# JeevanBindu blockchain

`contracts/JeevanBinduRecords.sol` is a hash-anchoring registry. It stores a SHA-256 record hash,
a reference hash, a record type and a timestamp. It never stores personal data.

Roles: `DEFAULT_ADMIN_ROLE` (grants/revokes writers) and `WRITER_ROLE` (the backend wallet).

```bash
npm install
npm run compile      # compiles and writes the ABI to ../server/src/blockchain/
npm test             # contract tests (Hardhat in-process network)
npm run node         # terminal 1: local chain on http://127.0.0.1:8545
npm run deploy       # terminal 2: deploys, writes deployments/localhost.json and updates ../server/.env
npm run deploy:sepolia   # needs BLOCKCHAIN_RPC_URL + BLOCKCHAIN_PRIVATE_KEY in ../server/.env and test ETH
```
