# JeevanBindu: blockchain-enabled blood donor & recipient platform

**MERN + REST API + Solidity + Web3 (ethers).** Academic prototype. Not a medical device, not a government
service, and **not UIDAI/Aadhaar authentication**.

```
client/       React + TypeScript + Vite + Tailwind + shadcn/ui
server/       Express 5 + MongoDB (Mongoose) + JWT + Zod + ethers
blockchain/   Hardhat project: contracts/, scripts/, test/
docs/         migration notes
legacy/, source-archives/   the two originally supplied frontends (reference only)
```

## How it works

```
register -> login -> identity verification (prototype) -> admin review -> VERIFIED
recipient creates blood request -> matching engine (ABO/Rh, verified, available, eligible, same city/state first)
donor accepts (MATCH)  -> hospital marks donation completed (DONATION)
each step: save to MongoDB -> canonical JSON -> SHA-256 -> Solidity tx -> wait for receipt -> store CONFIRMED / FAILED / PENDING
```

**Off-chain (MongoDB):** names, DOB, gender, blood group, location, contact details, requests, matches,
donation details, verification data (Aadhaar only as HMAC + masked form; the uploaded file is hashed and discarded).
**On-chain:** `recordId`, `recordHash`, `referenceHash`, record type, timestamp, recorder. No personal data.

### Hashing strategy
`canonicalize(data)` (keys sorted recursively, no whitespace, ISO dates) -> `SHA-256` -> `0x` + 32 bytes (`bytes32`).
`recordId = sha256("jeevanbindu:<TYPE>:<mongoId>")`. The canonical data holds ids, statuses and timestamps only.
`GET /api/blockchain/records/:id/verify` rebuilds the hash from the current database state and compares it with the
chain, so editing the database after anchoring is detected.

### Blood compatibility (documented assumption)
Red-cell / whole-blood rules. ABO: O gives to all, A to A/AB, B to B/AB, AB to AB. Rh-negative donors can give to any Rh;
Rh-positive donors only to Rh-positive recipients. Plasma/platelet rules differ and are out of scope.
Donor eligibility is a basic platform rule (age 18-65, 90 days between donations), not a medical screening.

### If the blockchain is down
The application event is **never rolled back**. The donation/match/verification stays saved and its `BlockchainRecord`
becomes `FAILED` (with a readable reason) or `PENDING` (tx sent, confirmation timed out). An admin can **Retry** or
**Refresh** it from the dashboard. If a previous attempt was actually mined, retry recovers the real tx from the contract events.

## Run it

Prerequisites: Node 20+, Docker (or a local MongoDB).

```bash
# 1. MongoDB
docker compose up -d mongo

# 2. Install
(cd blockchain && npm install)
(cd server && npm install)
(cd client && npm install)

# 3. Backend env
cp server/.env.example server/.env
#   edit server/.env: set JWT_SECRET, AADHAAR_HMAC_SECRET, SEED_ADMIN_PASSWORD, SEED_HOSPITAL_PASSWORD
#   BLOCKCHAIN_PRIVATE_KEY: for local dev use the first account key printed by `hardhat node`
#   (public, throwaway test key only; never reuse it anywhere real)

# 4. Compile + test the contract (also writes the ABI into server/src/blockchain/)
cd blockchain && npm run compile && npm test

# 5. Local chain (terminal 1, leave running)
npm run node

# 6. Deploy (terminal 2). Updates BLOCKCHAIN_CONTRACT_ADDRESS and BLOCKCHAIN_CHAIN_ID in server/.env
npm run deploy

# 7. Seed staff accounts (+ optional demo users) and start the API (terminal 3)
cd ../server && npm run seed          # or: npm run seed:demo
npm run dev                           # http://localhost:5000, prints blockchain connection status

# 8. Frontend (terminal 4)
cd ../client && cp .env.example .env && npm run dev     # http://localhost:8080
```

Sepolia: put `BLOCKCHAIN_RPC_URL`, a funded test-wallet `BLOCKCHAIN_PRIVATE_KEY` in `server/.env`, then
`cd blockchain && npm run deploy:sepolia`. Transaction links to Etherscan are generated from the chain id.
Never commit `.env`.

### Try the complete workflow
1. `npm run seed:demo` creates `admin@jeevanbindu.local`, `hospital@jeevanbindu.local` (passwords from your `.env`) and demo users flagged `isDemoSeed`.
   Or register your own donor and recipient at `/register`.
2. Each new user: Dashboard -> Identity Verification -> upload any PNG/JPEG/PDF, confirm the details, enter a
   well-formed 12-digit number (Verhoeff checksum, starting 2-9). Log in as admin -> approve (this creates a VERIFICATION record on-chain).
3. Recipient: create a blood request (e.g. `A-`). The response says how many compatible donors were found.
4. Donor (e.g. `O-`): Compatible Requests -> Accept (MATCH record on-chain).
5. Hospital: Accepted Donors -> Mark completed (DONATION record on-chain).
6. Anyone involved: "Blockchain Records" table shows status, tx hash (copy), network, block, explorer link, and **Verify**.
   Admin: Blockchain Audit (retry/refresh), audit log, statistics.

## Tests

| Command | What | Needs |
| --- | --- | --- |
| `cd blockchain && npm test` | Contract tests: deploy, register, duplicates, invalid input, authorization, verification/match/donation events, retrieval | `npm install` |
| `cd server && npx tsx --test test/core.test.ts` | Compatibility (full ABO/Rh chart), hashing, eligibility, Verhoeff | only Node + tsx |
| `cd server && npm test` | Above + `api.workflow.test.ts` (auth, RBAC, verification, end-to-end request->donation, blockchain failure handling, audit) + chain integration | `npm install` (uses mongodb-memory-server) |
| chain integration test | Runs automatically inside `npm test` when `hardhat node` + deployed contract + signer exist; otherwise it is skipped | steps 5-6 above |

## API (all under `/api`, JSON `{success, data | error}`)

| Route | Notes |
| --- | --- |
| `POST /auth/register` `POST /auth/login` `GET /auth/me` `POST /auth/logout` | self-registration only as donor/recipient |
| `GET/PATCH /users/me`, `GET /users` (admin) | |
| `POST /verification/extract` `POST /verification/submit` `GET /verification/me` | prototype flow |
| `GET /verification/pending` `POST /verification/:userId/review` | admin |
| `GET /donors/me` `PATCH /donors/me/availability` `GET /donors` (admin/hospital) | |
| `POST /requests` `GET /requests` `GET /requests/:id` `POST /requests/:id/rematch` `POST /requests/:id/cancel` | create needs VERIFIED recipient |
| `GET /matches` `POST /matches/:id/accept` `POST /matches/:id/decline` | role-scoped views, donors never see recipient identity |
| `POST /donations/:matchId/complete` `GET /donations` | hospital/admin completes |
| `GET /statistics` | aggregates from the database, no personal data |
| `GET /blockchain/status` `GET /blockchain/records` `GET /blockchain/records/:id` `.../verify` `POST .../retry` `POST .../refresh` `GET /blockchain/events` | retry/refresh/events admin only |
| `GET /audit` | admin |

## Smart contract
`blockchain/contracts/JeevanBinduRecords.sol`: OpenZeppelin `AccessControl`; `DEFAULT_ADMIN_ROLE` manages writers,
`WRITER_ROLE` (the backend wallet) is the only account that can write. Functions: `registerRecord`, `recordVerification`,
`recordMatch`, `recordDonation`, `getRecord`, `recordExists`, `verifyRecord`. Events: `RecordRegistered` (every write),
plus `VerificationRecorded`, `MatchRecorded`, `DonationRecorded`. Custom errors reject empty ids/hashes and duplicate records.

## Security notes
bcrypt (cost 12) passwords; JWT 2h; backend role checks on every route; Zod validation; helmet; CORS allow-list; global and
auth rate limits; no passwords/Aadhaar numbers in logs or audit metadata; blockchain private key only in `server/.env`
(never in `VITE_*`); seeded accounts are flagged and passwords come from the environment.

## Known limitations
- Identity verification is a prototype (format check + admin review). No OCR, no UIDAI call.
- Single backend writer wallet; blockchain events are read on demand (no background indexer), and a PENDING record needs an admin Refresh.
- JWTs are stateless (logout discards the token client-side and is audited).
- Concurrent accepts of the last unit are checked but not transaction-isolated.
- No email/SMS notifications; proximity is city/state, not GPS.
