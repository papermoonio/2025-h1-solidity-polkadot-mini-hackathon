import { ethers } from "hardhat";

async function main() {
    // 获取合约工厂
    const MyToken = await ethers.getContractFactory("MyToken");
    
    // 部署合约，初始供应量设为100万
    const initialSupply = ethers.parseUnits("1000000", 18);
    const token = await MyToken.deploy(initialSupply);
    
    await token.waitForDeployment();
    
    console.log("MyToken deployed to:", await token.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});