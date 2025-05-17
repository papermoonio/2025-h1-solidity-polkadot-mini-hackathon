import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// 复制ABI文件到前端目录的函数
async function copyABIToFrontend() {
  try {
    // 源文件路径 - Hardhat编译后的ABI文件路径
    const lotteryFactoryPath = path.join(
      __dirname, 
      "../artifacts/contracts/LotteryFactory.sol/LotteryFactory.json"
    );
    
    const simpleLotteryPath = path.join(
      __dirname, 
      "../artifacts/contracts/SimpleLottery.sol/SimpleLottery.json"
    );
    
    // 目标文件路径 - 前端目录
    const frontendABIDir = path.join(__dirname, "../lottery-dapp/abis");
    
    // 确保目标目录存在
    if (!fs.existsSync(frontendABIDir)) {
      fs.mkdirSync(frontendABIDir, { recursive: true });
    }
    
    // 复制文件
    fs.copyFileSync(
      lotteryFactoryPath, 
      path.join(frontendABIDir, "LotteryFactory.json")
    );
    
    fs.copyFileSync(
      simpleLotteryPath, 
      path.join(frontendABIDir, "SimpleLottery.json")
    );
    
    console.log("✅ ABI文件已成功复制到前端目录:", frontendABIDir);
  } catch (error) {
    console.error("❌ 复制ABI文件失败:", error);
  }
}

async function main() {
  // 准备部署账户
  const [deployer] = await ethers.getSigners();

  console.log("用这个账户部署合约:", deployer.address);

  // 看看账户里有多少钱 (测试网代币)
  const accountBalance = await deployer.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(accountBalance), "ETH"); // 这里的 ETH 记得换成你链的代币符号

  // 拿到 LotteryFactory 合约工厂，准备创建合约实例
  const LotteryFactory = await ethers.getContractFactory("LotteryFactory");

  // 开始部署 LotteryFactory 合约
  console.log("正在把 LotteryFactory 合约发到链上...");
  // 部署 LotteryFactory 不需要构造函数参数
  const lotteryFactory = await LotteryFactory.deploy();

  // 等待合约部署完成，拿到最终地址
  await lotteryFactory.waitForDeployment();

  const contractAddress = await lotteryFactory.getAddress();
  console.log("LotteryFactory 合约部署完成, 地址是:", contractAddress);

  // 部署完成后，复制ABI文件到前端目录
  await copyABIToFrontend();
  
  // 创建或更新.env文件，保存合约地址
  updateEnvFile(contractAddress);

  // 部署完成后，你可以通过这个 Factory 合约地址来创建新的抽奖实例
  console.log("现在你可以使用这个地址来创建新的抽奖场次了。");
}

// 更新前端.env文件的函数
function updateEnvFile(contractAddress: string) {
  try {
    const envPath = path.join(__dirname, "../lottery-dapp/.env.local");
    const envContent = `NEXT_PUBLIC_LOTTERY_FACTORY_ADDRESS=${contractAddress}\n`;
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ 合约地址已写入前端环境变量文件:", envPath);
  } catch (error) {
    console.error("❌ 更新环境变量文件失败:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
