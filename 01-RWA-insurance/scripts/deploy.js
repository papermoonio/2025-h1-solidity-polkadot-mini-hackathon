const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory
  const DividendToken = await ethers.getContractFactory("DividendToken");

  console.log("Deploying DividendToken...");

  // Deploy the contract
  const dividendToken = await DividendToken.deploy();

  // Wait for the deployment to be mined
  await dividendToken.deployed();

  console.log("DividendToken deployed to:", dividendToken.address);
}

// Run the deployment script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
