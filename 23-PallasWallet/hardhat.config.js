require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition");

require("dotenv").config();
require("./tasks/compile-revive");
// require("hardhat-revive-node");
/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      polkavm: true,
      nodeConfig: {
        nodeBinaryPath: '../../../code/polkadot-sdk/target/debug/substrate-node',
        rpcPort: 8000,
        dev: true,
      },
      adapterConfig: {
        adapterBinaryPath: '../../../code/polkadot-sdk/target/debug/eth-rpc',
        dev: true,
      },
    },
    polkavm: {
      polkavm: true,   
      url: 'http://127.0.0.1:8545',
      //accounts: [process.env.LOCAL_PRIV_KEY, process.env.AH_PRIV_KEY],
      accounts: [   
        "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133", 
        "0x5db5a1d7a4a5f5e3e7d1c9b2a8f6d4c3b2a1e0d9f8e7d6c5b4a3f2e1d0c9b8a7",
        "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d", 
        "0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1", 
        "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c", 
        "0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913", 
      ],
    },

    ah: { 
      polkavm: true,
      url: "https://westend-asset-hub-eth-rpc.polkadot.io",
      accounts: [process.env.AH_PRIV_KEY, process.env.LOCAL_PRIV_KEY],
    },

    sepolia: {
      polkavm: false,
      url: "https://eth-sepolia.api.onfinality.io/public",
      accounts: [process.env.AH_PRIV_KEY, process.env.LOCAL_PRIV_KEY],
    },

    moonbeam: {
      polkavm: false,
      url: "https://moonbeam.api.onfinality.io/public",
      accounts: [process.env.AH_PRIV_KEY, process.env.LOCAL_PRIV_KEY],
    },
  },
};

const cliNetwork = process.argv.indexOf('--network') !== -1 
  ? process.argv[process.argv.indexOf('--network') + 1]
  : null;

const needsResolc = config.networks[cliNetwork]?.polkavm === true;

console.log("Current network:", cliNetwork);
console.log("needsResolc:", needsResolc);

if (needsResolc) {
  require("hardhat-resolc");
  require("hardhat-revive-node");
  // Standard JSON output
  config.resolc = {
    compilerSource: 'binary',
    settings: {
      optimizer: {
        enabled: true,
      },
      evmVersion: 'istanbul',
      compilerPath: '~/.cargo/bin/resolc',
      standardJson: true,
    },
  };
}

module.exports = config;
