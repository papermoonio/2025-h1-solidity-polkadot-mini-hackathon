import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    // Polkadot EVM 平行链测试网配置
    moonbase: {
      url: process.env.YOUR_TESTNET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 1287,
      // gasPrice: 1000000000, // 可选：如果需要手动设置 gas price
    },
    // 也可以保留 Hardhat Network 的默认配置用于本地测试
    // hardhat: {
    //   chainId: 31337,
    // },
  },
  // 其他 Hardhat 配置...
};

export default config;
