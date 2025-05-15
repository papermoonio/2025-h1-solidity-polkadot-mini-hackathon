# NFT斗图游戏项目

## 项目概述
基于Polkadot生态的NFT对战游戏，用户可铸造表情包NFT，NFT带有大模型给出的搞笑值，用户使用NFT进行对战，胜者赢走参与者的质押Token作为战利品。

## 游戏设计
- 铸造NFT：用户可通过铸造表情包NFT来获得游戏体验。项目集成了豆包大模型，用户提交的表情包将发送给豆包大模型，生成搞笑值。
- 对战系统：用户可使用铸造的表情包NFT进行对战。用户首先质押一定金额的对战押金，对战系统基于用户使用的NFT的搞笑值进行计算，根据搞笑值的高低决定胜负，胜者赢走部分押金，对战合约部分Token作为游戏手续费。
- 钱包连接：用户可通过钱包连接与游戏进行交互。

## 技术栈
- 前后端: Next.js + TRPC + Tailwind CSS + drizzle +viem.js 
- 合约: Solidity (PolkaVM兼容) + @parity/hardhat-polkadot: 0.1.4

## 合约设计
- 代币合约(GT.sol)：基于ERC20标准的游戏代币合约，用户需要获取Game Token(GT)才能铸造NFT和参与对战。合约包含代币发行、转账、授权等基础功能。
- NFT铸造合约：用户发送给ERC721合约1个GT代币，才可以铸造NFT，NFT被铸造后会带有power（搞笑值）属性。
- 对战系统合约：用户1首先需要质押一定金额的对战押金，进入房间并准备对战，等待用户2进入房间即开始对战，对战系统基于用户使用的NFT的搞笑值进行计算，根据搞笑值的高低决定胜负，胜者赢走部分押金，剩余Token作为游戏手续费。


## 功能特性
1. NFT铸造功能
2. NFT对战系统
3. 代币机制
4. 钱包连接与账户管理
5. 大模型提供搞笑值功能

## 部署说明

### app环境变量配置
在`.env`文件中需要配置以下变量：
```bash
DATABASE_URL="file:./db.sqlite"
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="实际地址"
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS="实际地址"
NEXT_PUBLIC_ALCHEMY_RPC_URL="http://127.0.0.1:8545"
JWT_SECRET=bed674227cf3c516e8cc55cc502c8d87a14cf5a73992a5f2d297b45ec6bed6132fa0bf2f03e703e761a1df73885c48bfb753b534403982f2320bc33fe4a53e66
```

### 前后端
```bash
cd app/nft_game
pnpm install
pnpm run dev
```

### 合约
```bash
cd ../contracts
pnpm install
npx hardhat compile
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/NFTEmojiModule.ts --network localNode
npx hardhat ignition deploy ./ignition/modules/GTModule.ts --network localNode
npx hardhat ignition deploy ./ignition/modules/BattleModule.ts --network localNode
```

## 部署与交互过程中发现的问题
部署过程中发现的问题均已提交到issue中

## 部署信息截图
使用hardhat-polkadot 部署合约在 Westend Assethub
<br>
合约拥有者密钥：5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133
<br>
<img width="416" alt="image" src="https://github.com/user-attachments/assets/1cf2d72c-01d4-4303-83df-877b4002ce26" />
<br>
<img width="426" alt="image" src="https://github.com/user-attachments/assets/212bb69c-fc47-4dda-92d6-712cd0becaf5" />
<br>
<img width="507" alt="image" src="https://github.com/user-attachments/assets/f36b7411-3fa5-40a9-a12b-0ec7c77b24d9" />
<br>
部署在本地node
<br>
<img width="596" alt="image" src="https://github.com/user-attachments/assets/f6a51cc1-9ba0-4713-9b83-dee9dbfedf47" />

## 测试
部分测试调整后仍不能通过
![image](https://github.com/user-attachments/assets/9874f38f-3b14-438a-9239-0dd40fdaacd8)

## Demo
由于使用Viem 连接到本地node遇到问题（已经提交Issues），故只能完成部分代码，进行部分展示：
<br>
<img width="1440" alt="image" src="https://github.com/user-attachments/assets/67ad56f7-fd57-46d9-a1cf-f6b696040aa0" />
<br>
<img width="1440" alt="image" src="https://github.com/user-attachments/assets/b1fd4064-735e-4219-b57f-2d6b400d51ce" />
<br>
<img width="1308" alt="image" src="https://github.com/user-attachments/assets/4ed0f8eb-b76e-4428-aa42-e8811a34105a" />
<br>
<img width="1440" alt="image" src="https://github.com/user-attachments/assets/f7698f53-97aa-4327-ba09-3657d341c179" />
<br>
<img width="1440" alt="image" src="https://github.com/user-attachments/assets/f20bb52d-72c7-4606-8717-b3ad6fa04367" />
<br>





