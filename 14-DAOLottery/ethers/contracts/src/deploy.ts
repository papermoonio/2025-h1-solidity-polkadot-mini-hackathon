import { ethers } from "ethers";
import path from "path";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { config } from './config.js';

type ContractBytecode = string;

if (!config.privateKey) {
  console.error("PRIVATE_KEY environment variable is required for deploying smart contract");
  process.exit(1);
}

if (!config.rpcUrl) {
  console.error("RPC_URL environment variable is required for deploying smart contract");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(config.privateKey, provider);

const buildDir = ".build";
const contractsOutDir = path.join(buildDir, "contracts");
const deploysDir = path.join(".deploys", "deployed-contracts");
mkdirSync(deploysDir, { recursive: true });

type Contract = {
  abi: ethers.InterfaceAbi,
  bytecode: ContractBytecode,
}

type DeployedContract = {
  name: string,
  address: string,
  abi: ethers.InterfaceAbi,
  deployedAt: number
}

async function deployContract(name: string, args: any[] = []): Promise<DeployedContract> {
  const contract = JSON.parse(readFileSync(path.join(contractsOutDir, `${name}.json`), "utf8")) as Contract;
  const factory = new ethers.ContractFactory(
    contract.abi,
    contract.bytecode,
    wallet
  );

  console.log(`Deploying contract ${name}...`);
  const deployedContract = await factory.deploy(...args);
  await deployedContract.waitForDeployment();
  const address = await deployedContract.getAddress();

  console.log(`Deployed contract ${name}: ${address}`);

  const fileContent = JSON.stringify({
    name,
    address,
    abi: contract.abi,
    deployedAt: Date.now()
  });
  writeFileSync(path.join(deploysDir, `${address}.json`), fileContent);

  return {
    name,
    address,
    abi: contract.abi,
    deployedAt: Date.now()
  };
}

(async () => {
  try {

    // 部署 GovToken
    const govToken = await deployContract("GovToken");
    console.log("【GovToken deployed at】:", govToken.address);

    // 测试调用 GovToken 的 initialize 函数
    const govTokenContract = new ethers.Contract(govToken.address, govToken.abi, wallet);
    try {
      const txGovInit = await govTokenContract.initialize(); // GovToken的initialize通常不需要参数
      const receiptGovInit = await txGovInit.wait(); // 等待交易被矿工打包
      if (receiptGovInit.status !== 1) {
        console.error(`Failed to initialize GovToken. Transaction hash: ${receiptGovInit.hash}`);
        process.exit(1);
      }
    } catch (initError) {
      console.error("Failed to initialize or test GovToken:", initError);
    }

    // 部署 RewardToken
    const rewardToken = await deployContract("RewardToken");
    console.log("【RewardToken deployed at】:", rewardToken.address);

    // 测试调用 RewardToken 的 initialize 函数
    const rewardTokenContract = new ethers.Contract(rewardToken.address, rewardToken.abi, wallet);
    try {
      const tx = await rewardTokenContract.initialize();
      const receiptRewardTokenInit = await tx.wait();
      if (receiptRewardTokenInit.status !== 1) {
        console.error(`Failed to initialize RewardToken. Transaction hash: ${receiptRewardTokenInit.hash}`);
        process.exit(1);
      }
    } catch (initError) {
      console.error("Failed to initialize or test RewardToken:", initError);
    }

    // 部署 Governance (需要 GovToken 地址)
    const governance = await deployContract("Governance");
    console.log("【Governance deployed at】:", governance.address);
    // 初始化 Governance
    const governanceContract = new ethers.Contract(governance.address, governance.abi, wallet);
    try {
      const txGovernanceInit = await governanceContract.initialize(govToken.address);
      const receiptGovernanceInit = await txGovernanceInit.wait();
      if (receiptGovernanceInit.status !== 1) {
        console.error(`Failed to initialize Governance. Transaction hash: ${receiptGovernanceInit.hash}`);
        process.exit(1);
      }
    } catch (initError) {
      console.error("Failed to initialize or test Governance:", initError);
    }

    // 部署 Lottery
    const lottery = await deployContract("Lottery");
    console.log("【Lottery deployed at】:", lottery.address);
    // 初始化 Lottery (需要 RewardToken 地址, Governance 地址 和 rewardAmount)
    const lotteryContract = new ethers.Contract(lottery.address, lottery.abi, wallet);
    try {
      const txLotteryInit = await lotteryContract.initialize(rewardToken.address, governance.address);
      const receiptLotteryInit = await txLotteryInit.wait();
      if (receiptLotteryInit.status !== 1) {
        console.error(`Failed to initialize Lottery. Transaction hash: ${receiptLotteryInit.hash}`);
        process.exit(1);
      }
    } catch (initError) {
      console.error("Failed to initialize or test Lottery:", initError);
    }

    // 使用已存在的rewardTokenContract实例设置铸币者权限
    const nonce1 = await wallet.getNonce();
    const tx1 = await rewardTokenContract.setMinner(lottery.address, true, { nonce: nonce1 });
    await tx1.wait();
    console.log("【Set Lottery as RewardToken minter】");

    // 等待一段时间以确保前一个交易被确认
    await new Promise(resolve => setTimeout(resolve, 2000));

    const nonce2 = await wallet.getNonce();
    const tx2 = await govTokenContract.setMinner(governance.address, true, { nonce: nonce2 });
    await tx2.wait();
    console.log("【Set Governance as GovToken minter】");

    console.log("\n=======Deployment completed successfully!=======\n");
  } catch (err) {
    console.error("Deployment failed:", err);
    process.exit(1);
  }
})();