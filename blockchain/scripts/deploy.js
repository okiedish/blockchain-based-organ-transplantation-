const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const ENV_PATH = path.join(__dirname, "..", "..", "server", ".env");

function upsertEnv(key, value) {
  let text = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  text = re.test(text) ? text.replace(re, line) : text + (text.endsWith("\n") || text === "" ? "" : "\n") + line + "\n";
  fs.writeFileSync(ENV_PATH, text);
}

async function main() {
  await hre.run("compile");

  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();

  // The deployer becomes admin and first writer. For a real deployment, BLOCKCHAIN_PRIVATE_KEY
  // in server/.env should be this same account (or grant WRITER_ROLE to the backend wallet).
  const Factory = await hre.ethers.getContractFactory("JeevanBinduRecords");
  const contract = await Factory.deploy(deployer.address);
  const receipt = await contract.deploymentTransaction().wait();
  const address = await contract.getAddress();

  console.log("JeevanBinduRecords deployed successfully\n");
  console.log("Network :", hre.network.name, `(chainId ${net.chainId})`);
  console.log("Contract:", address);
  console.log("Deployer:", deployer.address);
  console.log("Tx hash :", receipt.hash);
  console.log("Block   :", receipt.blockNumber);

  // ABI for backend (generated from the compiled artifact).
  require("./export-abi.js");

  // Deployment record + address for the backend.
  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${hre.network.name}.json`),
    JSON.stringify({ network: hre.network.name, chainId: Number(net.chainId), address, deployer: deployer.address, txHash: receipt.hash, blockNumber: receipt.blockNumber, deployedAt: new Date().toISOString() }, null, 2) + "\n"
  );
  if (hre.network.name !== "hardhat") {
    upsertEnv("BLOCKCHAIN_CONTRACT_ADDRESS", address);
    upsertEnv("BLOCKCHAIN_CHAIN_ID", String(net.chainId));
    console.log("\nUpdated server/.env with BLOCKCHAIN_CONTRACT_ADDRESS and BLOCKCHAIN_CHAIN_ID");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
