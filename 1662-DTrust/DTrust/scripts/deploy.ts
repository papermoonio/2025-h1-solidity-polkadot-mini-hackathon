const hre = require("hardhat");

async function main() {
   // 获取合约工厂
   const ContractVerifier = await hre.ethers.getContractFactory("ContractVerifier");

   // 部署合约（无构造参数）
   const contractVerifier = await ContractVerifier.deploy();

   await contractVerifier.waitForDeployment();

   const contractAddress = await contractVerifier.getAddress();

   console.log("ContractVerifier deployed to:", contractAddress);
}

// 运行主函数
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });