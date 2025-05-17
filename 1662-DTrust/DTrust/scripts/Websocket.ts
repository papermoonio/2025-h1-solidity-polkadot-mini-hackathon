import { createPublicClient, http, parseAbiItem } from 'viem';

const client = createPublicClient({
  transport: http('http://127.0.0.1:8545'),
});

const contractAddress = '0x9c1da847b31c0973f26b1a2a3d5c04365a867703';

const event = parseAbiItem(
  'event RoleAssigned(address indexed user, string role, string department)'
);

async function main() {
  const toBlock = await client.getBlockNumber();
  const fromBlock = toBlock - 1000n; // 查询最近 1000 个区块范围

  console.log(`🔍 查询区块范围: ${fromBlock} ~ ${toBlock}`);

  const logs = await client.getLogs({
    address: contractAddress,
    event,
    fromBlock,
    toBlock,
  });

  if (logs.length === 0) {
    console.log('❌ 没有捕获到事件日志');
  } else {
    for (const log of logs) {
      console.log('📦 捕获事件:', log);
    }
  }
}

main().catch(console.error);
