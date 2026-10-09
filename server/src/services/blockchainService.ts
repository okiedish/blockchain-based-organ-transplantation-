import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Contract, JsonRpcProvider, Wallet, type ContractTransactionResponse, type TransactionReceipt } from 'ethers';
import { env } from '../config/env.js';
import BlockchainRecord from '../models/BlockchainRecord.js';
import type { RecordType } from '../models/BlockchainRecord.js';
import { buildCanonical } from './records.js';
import { hashRecord, recordIdFor, referenceHashFor } from './hash.js';
import { audit } from './audit.js';

// ---------------------------------------------------------------- network metadata
const NETWORKS: Record<number, { name: string; explorer?: string }> = {
  1: { name: 'Ethereum Mainnet', explorer: 'https://etherscan.io' },
  11155111: { name: 'Sepolia', explorer: 'https://sepolia.etherscan.io' },
  137: { name: 'Polygon', explorer: 'https://polygonscan.com' },
  80002: { name: 'Polygon Amoy', explorer: 'https://amoy.polygonscan.com' },
  31337: { name: 'Hardhat Local' },
};
export const networkName = (chainId?: number | null) => (chainId ? NETWORKS[chainId]?.name ?? `Chain ${chainId}` : 'Unknown');
export const explorerTxUrl = (chainId?: number | null, tx?: string | null) =>
  chainId && tx && NETWORKS[chainId]?.explorer ? `${NETWORKS[chainId].explorer}/tx/${tx}` : null;

// ---------------------------------------------------------------- ABI loading
const here = path.dirname(fileURLToPath(import.meta.url));
function loadAbi(): any[] {
  const candidates = [
    env.blockchain.abiPath(),
    path.resolve(here, '../blockchain/JeevanBinduRecords.abi.json'),
    path.resolve(process.cwd(), 'src/blockchain/JeevanBinduRecords.abi.json'),
    path.resolve(process.cwd(), '../blockchain/artifacts/contracts/JeevanBinduRecords.sol/JeevanBinduRecords.json'),
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      return Array.isArray(j) ? j : j.abi;
    }
  }
  throw new BlockchainUnavailable('Contract ABI not found. Run `npm run compile` in /blockchain (it writes the ABI into server/src/blockchain).');
}

export class BlockchainUnavailable extends Error {}

// ---------------------------------------------------------------- provider / contract
let provider: JsonRpcProvider | null = null;
let providerKey = '';

/** connectProvider(): create (or reuse) the JSON-RPC provider. */
export function connectProvider(): JsonRpcProvider {
  const url = env.blockchain.rpcUrl();
  if (!url) throw new BlockchainUnavailable('BLOCKCHAIN_RPC_URL is not configured');
  if (!provider || providerKey !== url) {
    // staticNetwork avoids ethers retrying network detection forever when the node is down
    provider = new JsonRpcProvider(url, env.blockchain.chainId(), env.blockchain.chainId() ? { staticNetwork: true } : undefined);
    providerKey = url;
  }
  return provider;
}

/** getContract(): contract bound to the backend's writer wallet (server-side private key only). */
export function getContract(): Contract {
  const address = env.blockchain.contractAddress();
  const key = env.blockchain.privateKey();
  if (!address) throw new BlockchainUnavailable('BLOCKCHAIN_CONTRACT_ADDRESS is not configured (deploy the contract first)');
  if (!key) throw new BlockchainUnavailable('BLOCKCHAIN_PRIVATE_KEY is not configured');
  return new Contract(address, loadAbi(), new Wallet(key, connectProvider()));
}

function getReadContract(): Contract {
  const address = env.blockchain.contractAddress();
  if (!address) throw new BlockchainUnavailable('BLOCKCHAIN_CONTRACT_ADDRESS is not configured');
  return new Contract(address, loadAbi(), connectProvider());
}

// Serialises transaction *submission* so one wallet never reuses a nonce. Confirmation is awaited
// outside the queue.
let queue: Promise<unknown> = Promise.resolve();
const enqueue = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
};

// ---------------------------------------------------------------- low-level contract calls
const ZERO_TYPE = 0;
type Hex = string;
export const registerRecord = (c: Contract, id: Hex, hash: Hex, ref: Hex, type = ZERO_TYPE): Promise<ContractTransactionResponse> =>
  enqueue(() => c.registerRecord(id, hash, ref, type));
export const recordVerification = (c: Contract, id: Hex, hash: Hex, ref: Hex): Promise<ContractTransactionResponse> =>
  enqueue(() => c.recordVerification(id, hash, ref));
export const recordMatch = (c: Contract, id: Hex, hash: Hex, ref: Hex): Promise<ContractTransactionResponse> =>
  enqueue(() => c.recordMatch(id, hash, ref));
export const recordDonation = (c: Contract, id: Hex, hash: Hex, ref: Hex): Promise<ContractTransactionResponse> =>
  enqueue(() => c.recordDonation(id, hash, ref));

const EXPECTED_EVENT: Record<RecordType, string | null> = {
  REGISTRATION: 'RecordRegistered',
  VERIFICATION: 'VerificationRecorded',
  MATCH: 'MatchRecorded',
  DONATION: 'DonationRecorded',
};

function sendFor(c: Contract, type: RecordType, id: Hex, hash: Hex, ref: Hex) {
  switch (type) {
    case 'VERIFICATION': return recordVerification(c, id, hash, ref);
    case 'MATCH': return recordMatch(c, id, hash, ref);
    case 'DONATION': return recordDonation(c, id, hash, ref);
    default: return registerRecord(c, id, hash, ref, 0);
  }
}

/** waitForConfirmation(): resolves with the mined receipt, throws on revert or timeout. */
export async function waitForConfirmation(tx: ContractTransactionResponse): Promise<TransactionReceipt> {
  const receipt = await tx.wait(1, env.blockchain.confirmTimeoutMs());
  if (!receipt || receipt.status !== 1) throw new Error('Transaction was mined but reverted');
  return receipt;
}

/** getRecord(): reads a record straight from the contract. */
export async function getRecord(recordId: Hex) {
  const r = await getReadContract().getRecord(recordId);
  return {
    recordHash: r.recordHash as string,
    referenceHash: r.referenceHash as string,
    recordType: ['REGISTRATION', 'VERIFICATION', 'MATCH', 'DONATION'][Number(r.recordType)],
    timestamp: Number(r.timestamp),
    recorder: r.recorder as string,
  };
}

// ---------------------------------------------------------------- error mapping
export function describeError(e: any): { message: string; retryable: boolean; timedOut: boolean } {
  const code = e?.code as string | undefined;
  const text = String(e?.shortMessage || e?.message || e);
  if (e instanceof BlockchainUnavailable) return { message: e.message, retryable: true, timedOut: false };
  if (code === 'TIMEOUT') return { message: 'Confirmation timed out; the transaction may still be mined. Use refresh to re-check.', retryable: true, timedOut: true };
  if (code === 'INSUFFICIENT_FUNDS' || /insufficient funds/i.test(text)) return { message: 'The backend wallet has insufficient funds to pay for gas.', retryable: true, timedOut: false };
  if (code === 'ACTION_REJECTED') return { message: 'The transaction was rejected by the signer.', retryable: true, timedOut: false };
  if (code === 'CALL_EXCEPTION') {
    const name = e?.revert?.name || e?.reason || '';
    if (name === 'RecordAlreadyExists') return { message: 'RecordAlreadyExists', retryable: false, timedOut: false };
    if (name === 'AccessControlUnauthorizedAccount') return { message: 'The backend wallet is not authorised (missing WRITER_ROLE).', retryable: false, timedOut: false };
    return { message: `Contract reverted${name ? `: ${name}` : ''}.`, retryable: false, timedOut: false };
  }
  if (code === 'NETWORK_ERROR' || code === 'SERVER_ERROR' || code === 'ECONNREFUSED' || /ECONNREFUSED|could not detect network|failed to fetch/i.test(text))
    return { message: 'Could not reach the blockchain RPC endpoint.', retryable: true, timedOut: false };
  return { message: text.slice(0, 300), retryable: true, timedOut: false };
}

// ---------------------------------------------------------------- orchestration
/** Looks for an existing on-chain record with this id and returns the tx that created it. */
async function findExistingTx(c: Contract, recordId: Hex) {
  const logs = await c.queryFilter(c.filters.RecordRegistered(recordId));
  const l = logs[0];
  return l ? { transactionHash: l.transactionHash, blockNumber: l.blockNumber } : null;
}

async function submit(recId: string): Promise<any> {
  const rec = await BlockchainRecord.findById(recId);
  if (!rec) throw new Error('Blockchain record not found');
  if (rec.status === 'CONFIRMED') return rec;

  rec.status = 'PENDING';
  rec.errorMessage = undefined;
  rec.attempts += 1;
  await rec.save();

  let tx: ContractTransactionResponse | undefined;
  try {
    const contract = getContract();
    const net = await connectProvider().getNetwork();
    rec.chainId = Number(net.chainId);
    rec.network = networkName(rec.chainId);
    rec.contractAddress = await contract.getAddress();

    tx = await sendFor(contract, rec.recordType as RecordType, rec.recordId, rec.recordHash, rec.referenceHash || referenceHashFor());
    rec.transactionHash = tx.hash;
    rec.submittedAt = new Date();
    await rec.save();
    await audit(null, 'BLOCKCHAIN_SUBMITTED', 'BlockchainRecord', rec._id, { recordType: rec.recordType, transactionHash: tx.hash });

    const receipt = await waitForConfirmation(tx);
    // The event must really be in the receipt; success is derived from it, not assumed.
    const wanted = EXPECTED_EVENT[rec.recordType as RecordType];
    const seen = receipt.logs
      .filter((l) => l.address.toLowerCase() === rec.contractAddress!.toLowerCase())
      .map((l) => contract.interface.parseLog({ topics: [...l.topics], data: l.data })?.name);
    if (wanted && !seen.includes(wanted)) throw new Error(`Expected event ${wanted} not found in receipt`);

    rec.status = 'CONFIRMED';
    rec.blockNumber = receipt.blockNumber;
    rec.confirmedAt = new Date();
    await rec.save();
    await audit(null, 'BLOCKCHAIN_CONFIRMED', 'BlockchainRecord', rec._id, { recordType: rec.recordType, blockNumber: receipt.blockNumber });
  } catch (e: any) {
    const info = describeError(e);
    if (info.message === 'RecordAlreadyExists') {
      // A previous attempt was mined but our database update was lost. Recover the real tx.
      try {
        const found = await findExistingTx(getContract(), rec.recordId);
        if (found) {
          rec.status = 'CONFIRMED';
          rec.transactionHash = found.transactionHash;
          rec.blockNumber = found.blockNumber;
          rec.confirmedAt = new Date();
          rec.errorMessage = undefined;
          await rec.save();
          await audit(null, 'BLOCKCHAIN_CONFIRMED', 'BlockchainRecord', rec._id, { recovered: true });
          return rec;
        }
      } catch { /* fall through to FAILED */ }
    }
    // A timed-out transaction may still be mined, so it stays PENDING; everything else is FAILED.
    rec.status = info.timedOut && rec.transactionHash ? 'PENDING' : 'FAILED';
    rec.errorMessage = info.message;
    await rec.save();
    await audit(null, rec.status === 'FAILED' ? 'BLOCKCHAIN_FAILED' : 'BLOCKCHAIN_PENDING', 'BlockchainRecord', rec._id, { recordType: rec.recordType, error: info.message });
  }
  return rec;
}

/**
 * Anchors a database record on-chain. Never throws: the application event that triggered
 * it has already been saved and must not be rolled back because the chain is unavailable.
 * Returns the BlockchainRecord (CONFIRMED / PENDING / FAILED).
 */
export async function anchorRecord(recordType: RecordType, referenceId: string) {
  try {
    let rec = await BlockchainRecord.findOne({ recordType, referenceId });
    if (!rec) {
      const canonical = await buildCanonical(recordType, referenceId);
      if (!canonical) return null;
      rec = await BlockchainRecord.create({
        recordType,
        referenceModel: canonical.referenceModel,
        referenceId,
        parentReferenceId: canonical.parentReferenceId,
        recordId: recordIdFor(recordType, referenceId),
        recordHash: hashRecord(canonical.data),
        referenceHash: referenceHashFor(canonical.parentReferenceId),
        ownerIds: canonical.ownerIds,
        status: 'PENDING',
      });
    }
    return await submit(String(rec._id));
  } catch (e) {
    console.error('anchorRecord failed:', (e as Error).message);
    return null;
  }
}

export const retryRecord = (id: string) => submit(id);

/** Re-checks a PENDING record that already has a tx hash (e.g. after a timeout). */
export async function refreshRecord(id: string) {
  const rec = await BlockchainRecord.findById(id);
  if (!rec) return null;
  if (rec.status === 'CONFIRMED' || !rec.transactionHash) return rec;
  try {
    const receipt = await connectProvider().getTransactionReceipt(rec.transactionHash);
    if (receipt) {
      if (receipt.status === 1) {
        rec.status = 'CONFIRMED';
        rec.blockNumber = receipt.blockNumber;
        rec.confirmedAt = new Date();
        rec.errorMessage = undefined;
        await audit(null, 'BLOCKCHAIN_CONFIRMED', 'BlockchainRecord', rec._id, { refreshed: true });
      } else {
        rec.status = 'FAILED';
        rec.errorMessage = 'Transaction was mined but reverted';
        await audit(null, 'BLOCKCHAIN_FAILED', 'BlockchainRecord', rec._id, { refreshed: true });
      }
      await rec.save();
    }
  } catch (e) {
    rec.errorMessage = describeError(e).message;
    await rec.save();
  }
  return rec;
}

/** Recomputes the hash from current database state and compares it with the chain. */
export async function verifyAgainstChain(recId: string) {
  const rec = await BlockchainRecord.findById(recId);
  if (!rec) return null;
  const canonical = await buildCanonical(rec.recordType as RecordType, rec.referenceId);
  const recomputed = canonical ? hashRecord(canonical.data) : null;
  const result: any = { recordHash: rec.recordHash, recomputedHash: recomputed, databaseMatchesAnchor: recomputed === rec.recordHash, onChain: null, chainMatches: null };
  try {
    const onChain = await getRecord(rec.recordId);
    result.onChain = onChain;
    result.chainMatches = onChain.recordHash.toLowerCase() === rec.recordHash.toLowerCase();
  } catch (e: any) {
    result.chainError = e?.revert?.name === 'RecordNotFound' || e?.code === 'CALL_EXCEPTION' ? 'Record not found on-chain' : describeError(e).message;
  }
  result.verified = Boolean(result.databaseMatchesAnchor && result.chainMatches);
  return result;
}

/** Reads real contract events (RecordRegistered, VerificationRecorded, MatchRecorded, DonationRecorded). */
export async function readEvents(limitBlocks = 5000) {
  const c = getReadContract();
  const latest = await connectProvider().getBlockNumber();
  const from = Math.max(0, latest - limitBlocks);
  const names = ['RecordRegistered', 'VerificationRecorded', 'MatchRecorded', 'DonationRecorded'];
  const groups = await Promise.all(names.map((n) => c.queryFilter(c.filters[n], from, latest)));
  return groups
    .flat()
    .map((l: any) => ({ event: l.fragment?.name as string, transactionHash: l.transactionHash as string, blockNumber: l.blockNumber as number, recordId: l.args?.[0] as string }))
    .sort((a, b) => b.blockNumber - a.blockNumber);
}

export async function blockchainStatus() {
  const cfg = {
    rpcConfigured: Boolean(env.blockchain.rpcUrl()),
    contractConfigured: Boolean(env.blockchain.contractAddress()),
    signerConfigured: Boolean(env.blockchain.privateKey()),
  };
  const base: any = { ...cfg, contractAddress: env.blockchain.contractAddress() || null, connected: false };
  if (!cfg.rpcConfigured) return { ...base, message: 'Blockchain RPC is not configured.' };
  try {
    loadAbi();
    const net = await connectProvider().getNetwork();
    base.connected = true;
    base.chainId = Number(net.chainId);
    base.network = networkName(base.chainId);
    base.blockNumber = await connectProvider().getBlockNumber();
    if (cfg.contractConfigured) {
      const code = await connectProvider().getCode(env.blockchain.contractAddress());
      base.contractDeployed = code !== '0x';
      if (base.contractDeployed) base.totalRecords = Number(await getReadContract().totalRecords());
    }
    base.message = base.contractDeployed ? 'Connected' : 'Connected, but no contract is deployed at the configured address.';
  } catch (e) {
    base.message = describeError(e).message;
  }
  return base;
}
