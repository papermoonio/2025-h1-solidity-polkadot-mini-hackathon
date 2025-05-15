# NFTEmoji Battle Game Smart Contracts

This is a blockchain-based NFT battle game project built on Ethereum, consisting of three main modules: Emoji NFTs, Governance Token, and Battle System.

## Environment Setup

First, clone the repository and install dependencies:

```bash
git clone https://github.com/Jackliu-miaozi/hardhat-example.git
cd hardhat-example
pnpm install
```

### Configure Environment Variables

The project requires private key configuration to run properly. Create a `.env` file in the project root directory and add the following:

```env
WESTEND_HUB_PK=5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133
```

**Note:** This private key is for development only. Never use it in production environments.

## Compile Contracts

Compile smart contracts using Hardhat:

```bash
npx hardhat compile
```

## Start Local Development Network

```bash
npx hardhat node
```

This will start a local Ethereum node running at `http://localhost:8545`.

## Deploy Contracts

In a new terminal window, deploy each module sequentially:

### 1. Deploy NFTEmojiModule

```bash
npx hardhat ignition deploy ./ignition/modules/NFTEmojiModule.ts --network localNode
```

### 2. Deploy GTModule (Governance Token)

```bash
npx hardhat ignition deploy ./ignition/modules/GTModule.ts --network localNode
```

### 3. Deploy BattleModule (Combat System)

```bash
npx hardhat ignition deploy ./ignition/modules/BattleModule.ts --network localNode
```

## Interact with Contracts

After deployment, interact with the contracts using the Hardhat console:

```bash
npx hardhat console --network localNode
```

## Project Structure

```
├── contracts/               # Smart contract source code
├── ignition/                # Ignition deployment scripts
├── scripts/                 # Helper scripts
├── test/                    # Test cases
├── hardhat.config.ts        # Hardhat configuration
└── package.json             # Project dependencies
```

### Key Features:
- Emoji-themed NFT collection with unique battle attributes
- Governance token for community decision-making
- On-chain battle system with randomized outcomes
- Fully decentralized game economy

### Technology Stack:
- Solidity smart contracts
- Hardhat development environment
- Ignition deployment framework
- ERC-721 and ERC-20 token standards
- Local Ethereum node for testing