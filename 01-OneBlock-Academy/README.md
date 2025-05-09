# OneBlock-Academy

OneBlock-Academy 是一个基于现代Web3与区块链技术的在线学习与奖励平台，旨在为web3教育培训机构提供一站式的学员注册、课程管理、学习笔记、答题考试、成绩评估以及毕业奖励领取的完整解决方案。

## team
Alice 1593

## 开发背景

随着在线教育和区块链技术的快速发展，传统学习平台往往在用户身份管理、学习数据安全、激励机制与透明度方面存在不足。OneBlock-Academy项目结合Next.js、shadcn、Tailwind CSS、SQLite以及智能合约技术，利用web3钱包身份鉴权，打破了中心化的限制，为管理员、教师与学员提供了安全、高效、模块化的学习与奖励管理系统。通过工厂模式智能合约按需求生成新claim项目智能合约（包含白名单合约，NFT合约，claim合约，支持调用第三方ERC20合约token奖励）。

## 技术栈

* **前端框架**：Next.js
* **UI 组件**：shadcn/ui + Tailwind CSS
* **数据库**：SQLite（better-sqlite3）
* **身份与访问控制**：NextAuth+viem +Wagmi（角色：管理员、老师/助教、学员）
* **区块链交互**：viem + Wagmi
* **后端**：Next.js API 路由
* **智能合约** Soildity

## 核心功能模块

1. **注册管理**：
   * 学员在线注册、信息录入与审核
   * 管理员统一审批注册数据
2. **工作人员管理**：
   * 教师/助教账户创建与权限分配
   * 管理员对工作人员进行增删改查操作
3. **公共资源管理**：
   * 文件、课程资料与学习材料的上传、分类与下载
4. **学习笔记管理**：
   * 学员可基于 Markdown 记录、编辑与查看学习笔记
   * 对学习笔记进行共享
5. **答题卡管理**：
   * 考试题库 
   * 学员在线作答与提交
6. **成绩管理**：
   * 自动批阅、人工评分与成绩统计
   * 成绩排名
7. **毕业 Claim 管理**：
   * 通过合约工厂定义毕业奖励领取流程
   * 学员完成所有模块后，调用智能合约领取链上奖励

## 安装与使用

```bash
# 1. 克隆仓库
git clone https://github.com/easyshellworld/OneBlock-Academy.git
cd OneBlock-Academy

# 2. 安装 Node.js（推荐 LTS）
nvm install --lts && nvm use --lts

# 3. 安装依赖
npm install

# 4. 配置环境变量
cp .env.example .env.local
# 填写：
# NEXTAUTH_SECRET=a8f9b3c1d4e762509a3718652f4d8c56
# NEXT_PUBLIC_ITEM_TITLE="Oneblock Academy"  #项目标题名
# INITIAL_STUDENT_ID=1799          # 初始化学员编号
# NEXT_PUBLIC_CLAIM_FACTORY=0x85d08E78856A6071c332D9C7a418679D6dED2265 生成claim的工厂合约，已部署在westend-asset-hub-eth

# 需要在.env环境下（非.env.local环境,供应初始化数据库）
# ADMIN_ADDRESS=初始化管理员钱包地址  

# 5. 数据库初始化
npm run db:init

# 6. 启动开发服务器
npm run dev
# 打开 http://localhost:3000

# 7.项目构建与运行
npm run  build 
npm run  start

```

## 智能合约部署与测试
* 合约编译环境为：hardhat 2.22.19 + resolc + solc-linux-amd64-v0.8.28+commit.7893614a
* 编译参数模板：
   ```
      optimizer: {
        enabled: true,
        mode: "z",
			  fallback_to_optimizing_for_size: true,
        parameters: "1",
        runs: 400,
      },
      standardJson: true,
   ```
* 部署测试命令

```bash
# 部署环境参数：（需要在.env）
PRIVATE_KEY=  # 私钥
RPC_URL=https://westend-asset-hub-eth-rpc.polkadot.io

# 本地测试环境测试：（需要在.env）
PRIVATE_KEY=  # 私钥
RPC_URL=http://127.0.0.1:8545

# 1.智能合约部署
node ./contracts/deploy.js  #暂时为js，后期可能调整

# 2.智能合约测试
node ./contracts/deploy-test.js  #暂时为js，后期可能调整 建议本地节点节点测试

```

## 演示地址
![管理页面](./snapshots/1.PNG)
```
演示地址:
https://oneblock-academy.netlify.app

演示所使用账户地址与密钥：
管理员：  地址: 0x85E9D949b0897DAb7B3Cf8B29f46aCEa16aB3271, 
         私钥: 0x6200be1ec8844cde8564b0468b91dc64b08a957755b8ec22e1af1527c0098432
老师:    地址: 0xe7788133f4b99876498866e7E53dE4C4a2b90113, 
         私钥: 0xd55a8a17d8721d6162ee025a955625e17dc11c56802d2b930d68607699cf7492
助教：   地址: 0x1f8665788d7973CB8797A097E85f7d4f4a3892AB, 
         私钥: 0xe5a3ab6fba6a2cb0eba373a7b1127d784d16590985f3349a27d65be95e925994
学员：   地址: 0x3FD810bB2729a838e942F7C3a4be63973B210aF8, 
        私钥: 0xfa69f8b57066e48715fe3f926bd32e1e6990f854f31dd533aab31df564280d40
        地址: 0x58ae1A14EFCc975BD395728F16B128B0497431E4, 
        私钥: 0x4fdb9840f5fc3b82184b5e80b442b55c3512dc8c536abfcb652744885c1b651d

```



## 项目目录结构

```
├── src/
│   ├── app/               # Next.js 路由与页面
│   ├── lib/               # 数据库交互逻辑
│   ├── components/        # 公共 UI 组件（shadcn/ui）
│   ├── styles/            # 全局与模块化样式
│   └── app/api/         # API 路由（注册、笔记、考试、claim 等）
├── data/                  # SQLite 数据库文件
├── contracts/             # 智能合约源码以及ABI、bytecode
├── scripts/               # 初始化脚本
├── .env.example           # 环境变量模板（双模板）
├── README.md
└── package.json
```

## 联系方式

如有问题或建议，请通过 GitHub 提交 Issue，或在组织内部协作平台联系项目维护者。

---


