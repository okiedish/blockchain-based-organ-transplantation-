import 'dotenv/config';

const required = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable ${name}`);
  return v;
};

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: () => required('MONGODB_URI'),
  jwtSecret: () => required('JWT_SECRET'),
  aadhaarHmacSecret: () => required('AADHAAR_HMAC_SECRET'),
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:8080').split(',').map((s) => s.trim()),
  blockchain: {
    rpcUrl: () => process.env.BLOCKCHAIN_RPC_URL || '',
    privateKey: () => process.env.BLOCKCHAIN_PRIVATE_KEY || '',
    contractAddress: () => process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '',
    chainId: () => (process.env.BLOCKCHAIN_CHAIN_ID ? Number(process.env.BLOCKCHAIN_CHAIN_ID) : undefined),
    confirmTimeoutMs: () => Number(process.env.BLOCKCHAIN_CONFIRM_TIMEOUT_MS || 60000),
    abiPath: () => process.env.BLOCKCHAIN_ABI_PATH || '',
  },
};
