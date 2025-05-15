import "@nomicfoundation/hardhat-toolbox-viem"
import "@nomicfoundation/hardhat-ignition"
// import "@nomicfoundation/hardhat-foundry";
import "hardhat-resolc"
import "./scripts/compile-revive"
import { HardhatRuntimeEnvironment } from "hardhat/types";
import type { HardhatUserConfig } from "hardhat/config";
import { config } from "dotenv"
config()

// const path = require("path");
// const solcPath = path.resolve(__dirname, "node_modules", "solc");
// require("hardhat/config").extendEnvironment((hre: HardhatRuntimeEnvironment) => {
//   hre.config.solidity.compilers[0].version = "0.8.29";
//   hre.config.solidity.compilers[0].settings = {
//     optimizer: {
//       enabled: true,
//       runs: 400,
//     },
//   };
// });

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 400,
      },
    },
  },
  networks: {
    hardhat: {
      polkavm: true,
      nodeConfig: {
        nodeBinaryPath: "../../polkadot-sdk/target/release/substrate-node",
        rpcPort: 8000,
        dev: true,
      },
      adapterConfig: {
        adapterBinaryPath: "../../polkadot-sdk/target/release/eth-rpc",
        dev: true,
      },
    },
    // polkavm: { url: "http://127.0.0.1:8545" },
    polkavm: {
      polkavm: true,
      url: "http://127.0.0.1:8545",
      accounts: [process.env.LOCAL_PRIV_KEY],
    },
    // ah: {
    //   url: "https://westend-asset-hub-eth-rpc.polkadot.io",
    //   accounts: [process.env.AH_PRIV_KEY],
    // },
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

  // Temporarily disable the `resolc` configuration
  resolc: {
    compilerSource: "binary",
    settings: {
      optimizer: {
        enabled: true,
        runs: 400,
      },
      evmVersion: "istanbul",
      compilerPath: "~/.cargo/bin/resolc --solc /usr/local/bin/solc",
      standardJson: true,
    },
  },
};
