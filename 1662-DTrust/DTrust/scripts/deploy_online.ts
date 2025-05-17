import { createWalletClient, http, getContractAddress, defineChain, createPublicClient } from 'viem'; // 增加了 defineChain 和 createPublicClient
import { privateKeyToAccount } from 'viem/accounts';
// import { polygonMumbai } from 'viem/chains'; // 不再直接使用 polygonMumbai
import fs from 'fs';
import path from 'path';

// === 配置 ===
const RPC_URL = 'https://westend-asset-hub-eth-rpc.polkadot.io';
const PRIVATE_KEY = '0xcf27fffdd1a6b9ea37a6a7757f6c5f3712a68d7560c3497575154db6e350414f'; // 确保私钥安全
const artifactPath = path.join(__dirname, '../artifacts-pvm/contracts/ContractVerifier.sol/ContractVerifier.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// --- 定义 Westend Asset Hub 链 ---
// ❗ 重要: 您需要为 Westend Asset Hub 找到并填写真实的 chainId 和原生代币信息。
// 以下 id 和 nativeCurrency 为示例值，请务必核实并替换。
const westendAssetHub = defineChain({
  id:420420421, // ❗ 示例 Chain ID, 请替换为 Westend Asset Hub 的实际 Chain ID
  name: 'Westend Asset Hub',
  nativeCurrency: { name: 'Westend Dot', symbol: 'WND', decimals: 18 }, // ❗ 示例原生代币, 请核实并替换
  rpcUrls: { 
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  // blockExplorers: { // 可选: 如果有区块浏览器
  //   default: { name: 'ExplorerName', url: 'https://explorer.example.com' },
  // },
});

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  
  const walletClient = createWalletClient({
    account,
    chain: westendAssetHub, // 使用为 Westend Asset Hub 定义的链配置
    transport: http(RPC_URL),
  });

  const publicClient = createPublicClient({ // 用于读取链上信息和等待回执
    chain: westendAssetHub,
    transport: http(RPC_URL),
  });

  console.log(`🔌 连接网络成功: ${RPC_URL}`);
  console.log(`💰 部署钱包地址: ${account.address}`);

  try {
    const bytecodeForDeployment = (artifact.bytecode.startsWith('0x') 
      ? artifact.bytecode 
      : `0x${artifact.bytecode}`) as `0x${string}`;

    // client.deployContract 直接发送交易并返回交易哈希
    const deployTxHash = await walletClient.deployContract({
      abi: artifact.abi,
      bytecode: bytecodeForDeployment,
      args: [], 
      // gas: 2_000_000n, // 注意: gas 限制可能需要根据合约复杂度调整
    });

    console.log(`🚀 交易已发送: ${deployTxHash}`);

    // 等待交易确认并获取回执
    console.log("⏳ 等待交易确认...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash: deployTxHash });
    
    if (receipt.status === 'success') {
      console.log(`✅ 合约部署成功! 地址: ${receipt.contractAddress}`);
    } else {
      console.error('❌ 合约部署失败，回执状态:', receipt.status);
      console.error('回执详情:', receipt); // 打印完整回执以便调试
      return; 
    }

    // `getContractAddress` 用于预测地址，通常在有确切 nonce 时使用。
    // 由于我们已经通过 receipt 获得了实际的合约地址，预测地址的必要性降低。
    // 如果确实需要在发送交易前预测，应获取当时的 pending nonce。
    // const currentNonce = await publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' });
    // const predictedAddress = getContractAddress({ from: account.address, nonce: currentNonce });
    // console.log(`📍 (若在发送前预测) 预测合约地址: ${predictedAddress}`);

  } catch (err) {
    console.error('❌ 合约部署过程中发生错误:', err);
  }
}

main();
