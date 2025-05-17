import hre from "hardhat";
import { defineChain } from "viem";

async function main() {
  // 定义自定义链
  const polkavmChain = defineChain({
    id: 420420420,
    name: 'PolkaVM Local',
    nativeCurrency: { name: 'Unit', symbol: 'UNIT', decimals: 18 },
    rpcUrls: {
      default: { http: ['http://127.0.0.1:8545'] },
      public: { http: ['http://127.0.0.1:8545'] },
    },
  });

  // 显式传递 chain 参数
  const [sender] = await hre.viem.getWalletClients({ chain: polkavmChain });
  const to = "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac"; // 替换为你的目标地址
  const value = hre.ethers.parseEther("100000000"); // 1 UNIT

  const hash = await sender.sendTransaction({
    to,
    value,
  });

  console.log("Tx sent:", hash);
}

main().catch(console.error);