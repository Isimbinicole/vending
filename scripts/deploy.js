const hre = require("hardhat");

async function main() {
  const VendingMachine = await hre.ethers.getContractFactory("VendingMachine");
  const vendingMachine = await VendingMachine.deploy();
  await vendingMachine.waitForDeployment();

  console.log(`VendingMachine deployed to: ${vendingMachine.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
