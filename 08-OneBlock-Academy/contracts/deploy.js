import { createWalletClient, createPublicClient, http} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';


dotenv.config();

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

function loadContractData(name) {
    const filePath = path.resolve(`contracts/artifacts-pvm/contracts/${name}.sol/${name}.json`);
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    
    return {
      abi: json.abi,
      bytecode: "0x"+json.bytecode,
    };
  }

if (!PRIVATE_KEY || !RPC_URL) {
  throw new Error("请设置环境变量 PRIVATE_KEY 和 RPC_URL");
}

const account = privateKeyToAccount(PRIVATE_KEY);

const walletClient = createWalletClient({
  account,
  transport: http(RPC_URL),
});

const publicClient = createPublicClient({
  transport: http(RPC_URL),
});

// 部署某个合约
async function deploy(name) {
  const { abi, bytecode } = loadContractData(name);
  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [], // 可选构造参数
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`✅ 合约 ${name} 部署成功，地址:`, receipt.contractAddress);
  return { contractAddress: receipt.contractAddress, abi };
}

// 主执行函数
async function main() {
  console.log(`🚀 开始部署，部署者地址: ${account.address}`);
  console.log(`📡 网络: ${RPC_URL}\n`);

  // 依次部署各实现合约
  const whitelist = await deploy('Whitelist');
 const customNFT = await deploy('CustomNFT');
  const claim = await deploy('Claim');

  console.log('\n--- 实现合约部署完成 ---');
  console.log('Whitelist:', whitelist.contractAddress);
  console.log('CustomNFT:', customNFT.contractAddress);
  console.log('Claim:', claim.contractAddress);

  // 部署 Factory3 合约
  const factory = await deploy('Factory3');
  console.log('\n--- 工厂合约部署完成 ---');
  console.log('Factory3:', factory.contractAddress); 


}

main().catch((err) => {
  console.error('❌ 部署出错:', err);
  process.exit(1);
});
