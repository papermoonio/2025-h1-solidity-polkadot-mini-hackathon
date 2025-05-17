# DTrust项目-去中心化数据真实性验证平台

## 一、项目介绍：

在全球数据合规要求日益趋严、各国强化数据在地化监管的背景下，跨国企业在核心数据与重要文件的管理中，面临篡改与伪造风险，难以实现跨区域的一致性审计与可信管理。
DTrust 是一个构建于区块链技术之上的数据真实性验证平台，专为解决企业在合同管理中面临的数据篡改风险、审计信任缺失与信息孤岛问题而设计。平台通过去中心化存证与链上签章机制（功能正在推进中），为合同的上传、审阅、审批与归档等关键环节提供公开、可信、可追溯的技术保障。
DTrust 尤其适用于合同需跨部门协作（如法务、内控、业务、审计）且原有系统缺乏统一信任机制的场景，帮助企业构建无需依赖人为信任的审计与监控体系，同时有效应对多国家、多地区的数据隐私与合规挑战。

DTrust is a blockchain-based platform for verifying data authenticity, designed to help enterprises prevent contract tampering, reduce audit friction, and ensure trust across departments.
As global data compliance tightens and localization rules grow stricter, DTrust enables secure, transparent, and tamper-proof contract processes—supporting upload, review, approval, and archiving—while reducing reliance on human trust and addressing cross-border data privacy risks.

## 二、项目优势：

1. 文件哈希上链保存，防止后期伪造或被改动✅ 
2. 审计可信审计、风控等部门可直接从区块链获取原始合同摘要，无需依赖法务提供✅ 
3. 签署透明（本次不考虑）每次审批操作均伴随链上签章（NFT），可实时追踪每位责任人的签署状态✅ 
4. 即时通知合同文件变更后自动触发链上事件监听，相关部门可第一时间获取变更记录✅ 
5. 可与原系统集成支持通过API与现有OA、法务系统、文档管理系统对接，逐步部署无需推倒重建✅ 
6. 合规优势在全球数据合规的背景下，实现对文件的可信验证✅ 

## 三、操作步骤：
* 前端项目：C2C
    1. 连接钱包：../C2C/src/hooks/userWallet.ts
    2. 调用页面及脚本：../C2C/src/hooks/index.tsx
    3. 部署（1）进入../C2C （2）npm install --legacy-peer-deps (3) 运行 npm run dev 
 * 合约项目：DTrust：
    1. 合约：../DTrust/contracts/ContractVerifier.sol
    2. 接口ABI文档: ../DTrust/artifacts-pvm/contracts/ContractVerifier.sol/ContractVerifier.json
* 合约地址：0x97e0c8f6643df31197fff71ced70f8288c187120（已部署在 asset hub westend链上）
* 测试钱包地址：0x550FA69e0A7b61c2D3F34d4dEd7c1B3cE1327488（目前已配置在权限名单中，只有该账号可以进行文件上传和验证操作）
* 添加了将源文件上传到服务器后端存储的功能，用没有后端服务器导致报错，请忽略
  

## 四、操作步骤：
### 1. 第一步：连接钱包
   ![image](https://github.com/user-attachments/assets/95bcb008-7e50-4b8b-84db-bb2ebd6f4971)

### 2. 第二步：选择钱包
   ![f91e1a9992ec2e4a4e5a301732771b7b](https://github.com/user-attachments/assets/3a546baa-e9ee-4532-a110-17c6d528b84b)

### 3. 第三步：上传文件
   ![image](https://github.com/user-attachments/assets/38c29649-844a-45c4-8927-c205eb2c7e1b)

### 4. 第四步：上传文件hash并请求asset hub，文件hash上链
   ![image](https://github.com/user-attachments/assets/b844c563-a7fc-49f1-9edb-9d29705ad1c7)

### 5. 第五步：验证文件上链
   ![image](https://github.com/user-attachments/assets/31e81cfd-6b00-412c-8b60-6df722eab1b8)

## 五、详细介绍：

https://mcnb2hw1abnm.feishu.cn/wiki/JHwpwNnmTiQHhCk1TGncEQ4BnXc?from=from_copylink
