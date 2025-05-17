# PallasWallet - 基于 Polkadot VM 的可恢复钱包

一个基于 Polkadot VM 生态的创新型钱包解决方案，通过**守护者机制**实现账户恢复功能，兼容 EVM 与 Substrate 双环境。

## 🌟 核心功能

### 1. 社交恢复钱包
- **多签守护者**：由 N 个预设守护者（Guardians）组成的恢复委员会
- **动态阈值**：支持 M/N 灵活配置的恢复签名阈值（如 3/5）
- **链上验证**：恢复请求通过智能合约验证守护者签名有效性

### 2. 跨环境兼容
- **Polkadot VM 原生支持**：通过 `substrate-node` 本地运行测试链
- **EVM 兼容层**：通过 `eth-rpc` 提供 Ethereum 格式的交易接口           

## 🛠 快速开始

### 环境准备

Ensure that you have substrate-node, eth-rpc and local resolc binaries on your local machine. If not, follow these instructions to install them:

```bash
git clone https://github.com/paritytech/polkadot-sdk
cd polkadot-sdk
cargo build --bin substrate-node --release
cargo build -p pallet-revive-eth-rpc --release
```

Once the build is complete, you will find both binaries in the `./target/release` directory.

For resolc's installation, please refer to the [resolc's README](https://github.com/paritytech/revive/blob/main/README.md).
Start the network by running:

```bash
./target/release/substrate-node --dev
./target/release/eth-rpc --dev
```

## How to Initialize

```bash
git clone https://github.com/sekisamu/hardhat-revive-uniswap-v2-core
cd hardhat-revive-uniswap-v2-core
pnpm install
```

Open the `hardhat.config.js` file and update the following fields under networks -> hardhat:

```
nodeBinaryPath: Set this to the local path of your substrate-node binary.

adapterBinaryPath: Set this to the local path of your eth-rpc binary.

```

And add the following fields under resolc -> settings:

```
compilerPath: Set this to the local path of your resolc binary.
```
Remember to use `0.1.0-dev.14` or later for the resolc version, and ensure that both paths correctly point to the respective executable files.

How to Test

```bash
# For PolkaVM chains
npx hardhat test --network polkavm

# For EVM chains
npx hardhat test --network sepolia
```
