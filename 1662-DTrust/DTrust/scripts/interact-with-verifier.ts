import {
  createPublicClient,
  http,
  createWalletClient,
  parseAbi,
  defineChain,
  decodeEventLog,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv'

// 导入合约 ABI JSON 文件
const contractAbiJson = require('../artifacts-pvm/contracts/ContractVerifier.sol/ContractVerifier.json');

// --- 定义 UserInfo 类型 ---
interface UserInfo {
  role: string;
  departmentId: string;
}
// --- End: 定义 UserInfo 类型 ---

dotenv.config(); // 加载 .env 文件中的环境变量

const contractAddress = '0x9c1da847B31C0973F26b1a2A3d5c04365a867703'
const abi = contractAbiJson.abi;

const polkavmChain = defineChain({
  id: 420420420,
  name: 'PolkaVM Local',
  nativeCurrency: { name: 'Westend DOT', symbol: 'WND', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
});

const publicClient = createPublicClient({
  chain: polkavmChain,
  transport: http(),
})

const privateKey = "5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133";
if (!privateKey) throw new Error("私钥未设置");

const account = privateKeyToAccount(`0x${privateKey}`);

const walletClient = createWalletClient({
  account,
  chain: polkavmChain,
  transport: http(),
});

async function main() {
  console.log(`使用账户: ${account.address}`);

  // 1. 查询合约拥有者
  
  const contractOwner = await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: 'owner',
    args: [],
  });
  console.log(`合约所有者: ${contractOwner}`);
  console.log(`当前账户: ${account.address}`);

  // 2. 分配权限
  try {
    const targetUser = '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac';
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: 'assignUserRole',
      args: [targetUser],
    });

    console.log(`assignUserRole 交易发送: ${txHash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`assignUserRole 交易确认: 区块 ${receipt.blockNumber}`);

    // 可选：解析事件
    const eventLog = receipt.logs.find(log => {
      try {
        const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics });
        return (decoded as { eventName: string }).eventName === 'UserRoleAssigned';
      } catch { return false; }
    });

    if (eventLog) {
      const decodedEvent = decodeEventLog({
        abi,
        data: eventLog.data,
        topics: eventLog.topics,
      });
      // 使用类型断言确保 decodedEvent.args 的类型安全
      console.log("🧾 权限分配事件:", (decodedEvent as { args: unknown }).args);
    }

  } catch (error) {
    console.error("分配角色失败:", error);
  }

  // 3. 查询用户角色信息
  try {
    const targetAddress = '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac';
    const targetUserInfo = await publicClient.readContract({
      address: contractAddress,
      abi,
      functionName: 'getUserInfo',
      args: [targetAddress],
    }) as UserInfo;

    console.log(`目标用户当前角色: ${targetUserInfo.role}`);
    console.log(`目标用户当前部门: ${targetUserInfo.departmentId}`);
  } catch (error) {
    console.log("获取目标用户信息失败，可能尚未分配角色");
  }

  // 4. 上传文件 Hash
  try {
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: 'uploadContract',
      args: [
        6,
        '0x9f5a730b9e7d11f3a30aadb61e3d1b4cf32ad8a8e3c0c4b62dfc0cdba385b3b2',
        '6.0.0',
        'NDA',
      ],
    });
    console.log(`uploadContract 交易发送: ${txHash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`uploadContract 交易确认: 区块 ${receipt.blockNumber}`);

    const eventLog = receipt.logs.find(log => {
      try {
        const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics });
        return (decoded as { eventName: string }).eventName === 'ContractUploaded';
      } catch { return false; }
    });

    if (eventLog) {
      const decodedEvent = decodeEventLog({
        abi,
        data: eventLog.data,
        topics: eventLog.topics,
      });
      // 使用类型断言来处理 decodedEvent 的类型
      console.log("📦 合同上传事件:", (decodedEvent as { args: unknown }).args);
    }

  } catch (error) {
    console.error("上传合同失败:", error);
  }

  // 5. 获取最新版本 hash
  const contractId = 6;
  const latestHash = await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: 'getLatestHash',
    args: [contractId],
  });
  console.log(`📄 最新版本 Hash: ${latestHash}`);

  // 6. 检查 hash 是否存在
  const exists = await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: 'isHashExists',
    args: ['0x9f5a730b9e7d11f3a30aadb61e3d1b4cf32ad8a8e3c0c4b62dfc0cdba385b3b1'],
  });
  console.log(`🔍 Hash 是否存在: ${exists}`);
}

main().catch(console.error);
