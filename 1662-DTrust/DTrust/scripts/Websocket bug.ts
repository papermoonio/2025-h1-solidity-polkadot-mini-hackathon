// scripts/listenAllEvents.ts
import {
  createPublicClient,
  webSocket,
  defineChain,
  Abi,
  parseAbiItem,
  AbiEvent,
} from 'viem';
import fs from 'fs';
import path from 'path';

// 配置本地 PolkaVM 网络
const localPolkaVmChain = defineChain({
  id: 420420420,
  name: 'Local PolkaVM',
  nativeCurrency: { name: 'Unit', symbol: 'UNIT', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
      webSocket: ['ws://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
      webSocket: ['ws://127.0.0.1:8545'],
    }
  },
});

// 合约地址和 ABI 路径
const contractAddress = '0x9c1da847B31C0973F26b1a2A3d5c04365a867703';
const artifactPath = path.join(__dirname, '../artifacts-pvm/contracts/ContractVerifier.sol/ContractVerifier.json');
const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const contractAbi = contractArtifact.abi as Abi;

// 格式化事件参数
function formatValue(value: any): string {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return JSON.stringify(value.map(formatValue));
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
  }
  return String(value);
}

async function startListening() {
  const client = createPublicClient({
    chain: localPolkaVmChain,
    transport: webSocket('ws://127.0.0.1:8545'),
  });

  console.log(`🚀 正在监听合约地址 ${contractAddress} 上的所有事件...`);

  const tasks = contractAbi
    .filter((abiItem): abiItem is AbiEvent => abiItem.type === 'event')
    .map((abiEvent) => { // 这里的 abiEvent 已经是 AbiEvent 对象了
      // const abiSignature = `event ${abiEvent.name}(${abiEvent.inputs.map(i => `${i.type} ${i.name}`).join(',')})`; // 这行不再需要
      // const parsedEvent = parseAbiItem(abiSignature) as AbiEvent; // 这行不再需要

      return client.watchEvent({
        address: contractAddress,
        event: abiEvent, // 直接使用从 ABI 中过滤得到的 abiEvent 对象
        onLogs: (logs) => {
          for (const log of logs) {
            console.log(`📥 监听到事件: ${abiEvent.name}`);
            if ('args' in log && log.args) {
              for (const [key, value] of Object.entries(log.args)) {
                console.log(`  - ${key}: ${formatValue(value)}`);
              }
            } else {
              console.log('⚠️ 无事件参数');
            }
          }
        },
        onError: (err) => {
          console.error(`❌ 监听事件 ${abiEvent.name} 出错:`, err);
        }
      });
    });

  // 并行注册所有事件监听
  // 注意: 如果节点不支持 eth_subscribe，这些调用仍会因 "Method not found" 而失败
  try {
    await Promise.all(tasks);
  } catch (error) {
    console.error("设置事件观察器时出错:", error);
  }
}

startListening();