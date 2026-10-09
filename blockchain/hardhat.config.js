require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../server/.env" });

const { BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, SEPOLIA_RPC_URL } = process.env;

// Public-network accounts are only configured when a key is present in the environment.
// The key is read from server/.env, never from source code.
const accounts = BLOCKCHAIN_PRIVATE_KEY ? [BLOCKCHAIN_PRIVATE_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    hardhat: {},
    localhost: { url: "http://127.0.0.1:8545" },
    sepolia: {
      url: SEPOLIA_RPC_URL || BLOCKCHAIN_RPC_URL || "",
      chainId: 11155111,
      accounts,
    },
  },
};
