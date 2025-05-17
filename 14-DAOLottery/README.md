# 🎯 DAO Lottery - 去中心化治理抽签应用

DAO Lottery 是一个创新的链上应用，将 DAO 治理机制与抽签激励系统相结合。通过投票参与治理，用户可获得抽签资格，并有机会赢取奖励，从而提升治理积极性与趣味性。

---

## 🧠 项目简介

DAO Lottery 的核心理念是 **“投票即抽奖”**。当用户参与提案投票后，系统将在所有有效投票者中随机抽取幸运用户并发放奖励。这种设计旨在：

* **激励用户积极参与 DAO 治理**
* **增强治理流程的互动性和娱乐性**
* **构建更具活力的治理生态**

---

## 团队成员

alan 1753



---

## 🏗️ 技术架构

### 🔐 智能合约

| 合约名               | 说明                |
| ----------------- | ----------------- |
| `Governance.sol`  | 管理提案与投票的 DAO 治理合约 |
| `GovToken.sol`    | 治理代币合约，用于投票权重计算   |
| `RewardToken.sol` | 奖励代币合约，用于发放奖励     |
| `Lottery.sol`     | 抽签合约，实现抽奖与奖励分发    |

### 🧩 前端技术栈

* **Next.js 14**
* **TailwindCSS**
* **Ethers.js + Viem**
* **React Hooks**

---

## 🚀 核心功能

### 1. 📝 提案管理

* 创建与查看提案
* 浏览提案详情
* 支持提案状态变更与历史记录

### 2. 🗳️ 投票系统

* 领取治理代币
* 治理代币投票
* 投票权重计算机制
* 查看实时投票结果

### 3. 🎲 抽签机制

* 提案结束后自动抽取幸运投票者
* 由于波卡网络限制，目前使用区块信息生成伪随机数（计划集成 Chainlink VRF）
* 奖励自动发放至用户钱包

### 4. 💰 奖励系统

* 奖励金额灵活可配置
* 奖励记录透明可查
* 奖励采用 **pull 模式** 安全发放

---

## 📦 部署信息

### 🔗 合约地址

| 合约              | 地址                                           |
| --------------- | -------------------------------------------- |
| **Governance**  | `0x47FA7Ba9ec2ef41C7E6F223dEBB631Eecdf81b6F` |
| **GovToken**    | `0xc5D73016B64fe4FB400716e417aE49B8f15be667` |
| **RewardToken** | `0xae5d03be11aBa34f0093fdc9B89a8F063efF0b2f` |
| **Lottery**     | `0xa4F845A3786C2127579e08bBb26A776D298Cf9A9` |

### 🛠️ 部署记录

![部署记录1](https://pic1.imgdb.cn/item/682843de58cb8da5c8f8e271.png)
![部署记录2](https://pic1.imgdb.cn/item/6828442b58cb8da5c8f8e292.png)

### 🐹 UI预览

![create](https://pic1.imgdb.cn/item/680b1e9d58cb8da5c8ca9f3f.png)
![list](https://pic1.imgdb.cn/item/680b1eec58cb8da5c8caa040.png)
![detail](https://pic1.imgdb.cn/item/680b1f8658cb8da5c8caa3de.png)
![vote](https://pic1.imgdb.cn/item/680b1f9d58cb8da5c8caa4ae.png)
![admin](https://pic1.imgdb.cn/item/680b207658cb8da5c8caa740.png)
![drawWinner](https://pic1.imgdb.cn/item/680b211058cb8da5c8caacfc.png)
![claim](https://pic1.imgdb.cn/item/680b215558cb8da5c8caafbc.png)
![profile](https://pic1.imgdb.cn/item/680b21ca58cb8da5c8cab059.png)

---

## 🧪 本地开发指南

### 🔧 环境要求

* Node.js 18+
* npm 9+
* Solidity 0.8.19+

### 📁 项目结构

```
14-DAOLottery/
├── contracts/           # Solidity智能合约
├── frontend/            # 前端项目（Next.js）
├── ethers/              # 合约编译、部署脚本
```

### 🚀 启动步骤

1. 克隆项目并进入目录

   ```bash
   git clone https://github.com/alan22333/2025-h1-solidity-polkadot-mini-hackathon.git
   cd 14-DAOLottery/frontend
   ```

2. 安装依赖

   ```bash
   npm install
   ```

3. 配置环境变量

   ```bash
   cp .env.example .env.local
   # 编辑 .env.local，填写合约地址等环境配置
   ```

4. 启动开发服务器

   ```bash
   npm run dev
   ```

---

## 🔒 安全考量

| 模块        | 安全设计说明                       |
| --------- | ---------------------------- |
| **随机数生成** | 当前使用区块信息，未来集成 Chainlink VRF  |
| **奖励发放**  | 使用 pull 模式，避免 DoS 攻击和 gas 竞价 |
| **访问控制**  | 多级权限管理，支持所有权转移与合约升级机制        |

---

## 🌱 项目规划与愿景

### 🚀 技术升级

* Chainlink VRF 集成
* 跨链治理与奖励机制

### 💡 商业模式创新

* NFT 会员系统
* 治理代币质押与流动性市场
* 多级奖励系统

### 📈 功能扩展

* 多语言支持
* 提案模板库
* AI 提案分析
* 治理数据可视化

### 🌐 生态建设

* 开放 API 与开发者激励
* DAO 项目合作
* 线上治理竞赛

### 🧩 应用场景探索

* 企业决策平台
* 社区治理工具
* 教育自治系统
* 公益透明机制

### ✅ 安全与合规

* 多签机制
* 提案审核流程
* 反作弊系统
* 地区合规支持

### 🎯 用户体验优化

* 简化流程与操作
* 移动端适配
* 自定义功能增强
* 一键社交分享

### 📊 数据分析洞察

* 行为分析系统
* 治理报告生成
* 决策建议与预测模型

---

## 🤝 贡献指南

欢迎提交 Issue 与 Pull Request 

---

## 📜 许可证

本项目遵循 [MIT License](./LICENSE) 开源协议。

---