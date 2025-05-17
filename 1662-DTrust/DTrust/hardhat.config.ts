import "@nomicfoundation/hardhat-toolbox"
import "@nomicfoundation/hardhat-ignition"
import "@nomicfoundation/hardhat-viem";
import { HardhatUserConfig } from "hardhat/config"; 


import "hardhat-resolc"
import { config } from "dotenv"
import "/Users/liruning/Desktop/polkdot_solidity_homework/2025-17-solidity-on-polkadot/homework-4/1662/hardhat_ts_project/tasks/compile-revive"
// 确保在使用环境变量之前调用 config()
config()

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      polkavm: true,
      nodeConfig: {
        // 使用绝对路径指向 substrate-node
        nodeBinaryPath: "/Users/liruning/Desktop/polkdot_solidity_homework/2025-17-solidity-on-polkadot/polkadot-sdk/target/debug/substrate-node",
        rpcPort: 8000,
        dev: true,
      },
      adapterConfig: {
        // 使用绝对路径指向 eth-rpc
        adapterBinaryPath: "/Users/liruning/Desktop/polkdot_solidity_homework/2025-17-solidity-on-polkadot/polkadot-sdk/target/debug/eth-rpc",
        dev: true,
      },
      gasPrice: 0,
      gas: 3000000 // 新增这一行
    },
    polkavm: {
      polkavm: true,
      url: "http://127.0.0.1:8545",
      accounts: [process.env.LOCAL_PRIV_KEY],
      gas: 3000000 // 或 gasLimit: 3000000
    },
    // polkavm: { url: "http://127.0.0.1:8545" },
    ah: {
      url: "https://westend-asset-hub-eth-rpc.polkadot.io",
      accounts: [process.env.AH_PRIV_KEY],
    },
  },
  // using remix compiler
  // resolc: {
  //   version: "1.5.2",
  //   compilerSource: "remix",
  //   settings: {
  //     optimizer: {
  //       enabled: false,
  //       runs: 600,
  //     },
  //     evmVersion: "istanbul",
  //   },
  // },

  // using binary compiler
  resolc: {
    compilerSource: "binary",
    settings: {
      optimizer: {
        enabled: true,
        // 压缩合约大小
        mode:"z",
        fallback_to_optimizing_for_size: true,
        runs: 400,
      },
      // 尝试将 evmVersion 修改为 "paris"
      evmVersion: "paris", // <--- 修改这里
      compilerPath: "/Users/liruning/Desktop/polkdot_solidity_homework/2025-17-solidity-on-polkadot/homework-4/1662/hardhat_ts_project/revive/resolc-universal-apple-darwin", // 只写 resolc 路径
      solcArgs: ["--solc", "/Users/liruning/Library/Python/3.9/bin/solc"], // 单独传递 solc 路径
      standardJson: true,
    },
  },
  
};