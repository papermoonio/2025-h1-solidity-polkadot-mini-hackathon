# DAO lottery 智能合约项目

A decentralized governance-based lottery system that encourages community participation through voting and token rewards.

## 项目结构

based on：https://contracts.polkadot.io/build-your-first-dapp

```
├── contracts/          # 智能合约源代码
│   ├── GovToken.sol    # 治理代币合约
│   ├── Governance.sol  # 治理系统合约
│   ├── Lottery.sol     # 彩票系统合约
│   └── RewardToken.sol # 奖励代币合约
└── README.md          # 项目说明文档
```

## 环境要求

- Node.js (推荐 v18 或更高版本)
- pnpm (推荐 v8 或更高版本)

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件，添加以下必需的环境变量：

```env
# 部署合约的账户私钥（以0x开头的64位十六进制字符串）
PRIVATE_KEY=your_private_key_here

# 连接的网络节点URL
# Westend Asset Hub: https://westend-asset-hub-eth-rpc.polkadot.io
# 本地开发环境: http://localhost:8545
RPC_URL=your_rpc_url_here
```

### 3. 编译合约

```bash
pnpm contracts:build
```

### 4. 部署合约

```bash
pnpm contracts:deploy
```

### 5. 导出合约数据

```bash
pnpm contracts:export
```

## 注意事项

- 确保 `.env` 文件中的私钥安全，不要将其提交到代码仓库
- 使用 `pnpm` 作为包管理器以确保依赖版本的一致性

## 许可证

MIT
