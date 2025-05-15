import { http, createPublicClient, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

// 配置本地节点连接
export const publicClient = createPublicClient({
   chain: hardhat,
   transport: http("http://127.0.0.1:8545"),
});

// 使用测试账户（从Hardhat节点获取的私钥）
const account = privateKeyToAccount(
   "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Hardhat第一个测试账户
);

export const walletClient = createWalletClient({
   account,
   chain: hardhat,
   transport: http("http://127.0.0.1:8545"),
});
