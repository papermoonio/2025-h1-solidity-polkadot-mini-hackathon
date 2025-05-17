// lib/viem.js
import { createPublicClient, createWalletClient, custom, defineChain, http } from 'viem'

// 定义 Westend Asset Hub 网络
const westendAssetHub = defineChain({
  id: 420420421,
  name: 'Asset-Hub Westend Testnet',
  network: 'westend-asset-hub',
  nativeCurrency: {
    decimals: 18,
    name: 'Westend',
    symbol: 'WND',
  },
  rpcUrls: {
    default: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io']
    },
    public: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io']
    }
  },
  blockExplorers: {
    default: {
      name: 'Subscan',
      url: 'https://assethub-westend.subscan.io'
    }
  },
  testnet: true
})

import govTokenAbi from '@/abis/GovToken.json'
import rewardTokenAbi from '@/abis/RewardToken.json'
import governanceAbi from '@/abis/Governance.json'
import lotteryAbi from '@/abis/Lottery.json'

// ✅ 合约地址（部署后替换成你的地址）
export const CONTRACTS = {
  govToken: process.env.NEXT_PUBLIC_GOV_TOKEN_ADDRESS,
  rewardToken: process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS,
  governance: process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS,
  lottery: process.env.NEXT_PUBLIC_LOTTERY_ADDRESS,
}

// ✅ 只读 client
export const publicClient = createPublicClient({
  chain: westendAssetHub,
  transport: http(),
})

// ✅ 写入 client（使用 MetaMask）
export function getWalletClient() {
  if (!window.ethereum) throw new Error('MetaMask not installed')
  return createWalletClient({
    chain: westendAssetHub,
    transport: custom(window.ethereum),
  })
}

// ✅ 获取当前地址（连接钱包）
export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask not installed')
  const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
  return address
}

// ================= 合约方法封装 ===================

// 获取 GOV 余额
export async function getGovBalance(address) {
  return await publicClient.readContract({
    address: CONTRACTS.govToken,
    abi: govTokenAbi,
    functionName: 'balanceOf',
    args: [address],
  })
}

// 领取 GOV Token
export async function claimGovToken(address) {
  const client = await getWalletClient()
  return await client.writeContract({
    address: CONTRACTS.govToken,
    abi: govTokenAbi,
    functionName: 'claim',
    account: address,
    gas: 300000n // 添加足够的gas limit
  })
}

// 检查是否领取过
export async function hasClaimed(address) {
    return await publicClient.readContract({
      address: CONTRACTS.govToken,
      abi: govTokenAbi,
      functionName: 'hasClaimed',
      args: [address],
    })
}

// 确认授权
export async function ensureAllowance(user, spender, token, amount) {
  const allowance = await publicClient.readContract({
    address: token,
    abi: govTokenAbi,
    functionName: 'allowance',
    args: [user, spender],
  })

  if (BigInt(allowance) < BigInt(amount)) {
    const walletClient = await getWalletClient();
    await walletClient.writeContract({
      address: token,
      abi: govTokenAbi,
      functionName: 'approve',
      args: [spender, amount],
      account: user,
    })
  }
}

// 创建提案
export async function createProposal(address, description, duration) {
  // 确保授权 10 Gov
  await ensureAllowance(address, CONTRACTS.governance, CONTRACTS.govToken, 10)
  const client = await getWalletClient()
  return await client.writeContract({
    address: CONTRACTS.governance,
    abi: governanceAbi,
    functionName: 'createProposal',
    args: [description,duration],
    account: address,
  })
}

// 获取某个提案
export async function getProposal(id) {
  const [
    description,
    proposer,
    yesVotes,
    noVote,
    pass,
    finalized,
    deadline
  ] = await publicClient.readContract({
    address: CONTRACTS.governance,
    abi: governanceAbi,
    functionName: 'getProposal',
    args: [id],
  })
  return {
    id,
    description,
    proposer,
    yesVotes: Number(yesVotes),
    noVote: Number(noVote),
    pass,
    finalized,
    deadline: Number(deadline),
  }
}

// 获取提案列表（封装后的形式）
export async function getProposalList() {
  const proposalsCount = await publicClient.readContract({
    address: CONTRACTS.governance,
    abi: governanceAbi,
    functionName: 'getProposalCount',
  })
  const proposals = []
  for (let i = 1; i <= proposalsCount; i++) {
    const [
      description,
      proposer,
      yesVotes,
      noVote,
      pass,
      finalized,
      deadline
    ] = await publicClient.readContract({
      address: CONTRACTS.governance,
      abi: governanceAbi,
      functionName: 'getProposal',
      args: [i],
    })
    proposals.push({
      id: i, // 作为唯一 key 用
      description,
      proposer,
      yesVotes: Number(yesVotes),
      noVote: Number(noVote),
      pass,
      finalized,
      deadline: Number(deadline),
    })
  }
  return proposals
}


// 给提案投票
export async function voteProposal(address, proposalId, support) {
  await ensureAllowance(address, CONTRACTS.governance, CONTRACTS.govToken, 1)
  const client = await getWalletClient()
  return await client.writeContract({
    address: CONTRACTS.governance,
    abi: governanceAbi,
    functionName: 'voteProposal',
    args: [proposalId, support],
    account: address,
  })
}

// 检查投票
export async function hasVoted(address, proposalId) {
  return await publicClient.readContract({
    address: CONTRACTS.governance,
    abi: governanceAbi,
    functionName: 'hasUserVoted',
    args: [proposalId, address],
  })
}

// 检查投票选项
export async function getVoteOption(address, proposalId) {
  if (!(await hasVoted(address, proposalId))) return
  return await publicClient.readContract({
    address: CONTRACTS.governance,
    abi: governanceAbi,
    functionName: 'getVoteChoice',
    args: [proposalId, address],
  })
}

// 结束提案（管理员）
export async function finalizeProposal(address, proposalId) {
  const client = getWalletClient()
  return await client.writeContract({
    address: CONTRACTS.governance,
    abi: governanceAbi,
    functionName: 'finalizeProposal',
    args: [proposalId],
    account: address,
  })
}

// 抽奖（管理员）
export async function drawLottery(address, proposalId) {
  const client = getWalletClient()
  return await client.writeContract({
    address: CONTRACTS.lottery,
    abi: lotteryAbi,
    functionName: 'drawWinner',
    args: [proposalId],
    account: address,
  })
}

// 获取中奖地址
export async function getWinnerAddress(proposalId) {
  return await publicClient.readContract({
    address: CONTRACTS.lottery,
    abi: lotteryAbi,
    functionName: '_getWinner',
    args: [proposalId],
  })
}

// 检查是否已经领取
export async function hasClaimedReward(address, proposalId) {
  return await publicClient.readContract({
    address: CONTRACTS.lottery,
    abi: lotteryAbi,
    functionName: 'getCliaimed',
    args: [proposalId],
    account: address,
  })
}

// 领奖
export async function claimReward(address, proposalId) {
  const client = getWalletClient()
  return await client.writeContract({
    address: CONTRACTS.lottery,
    abi: lotteryAbi,
    functionName: 'claimReward',
    args: [proposalId],
    account: address,
  })
}

// 查看余额
export async function getGovTokenBalance(address) {
  return await publicClient.readContract({
    address: CONTRACTS.govToken,
    abi: rewardTokenAbi,
    functionName: 'balanceOf',
    args: [address],
  })
}

export async function getRewardTokenBalance(address) {
  return await publicClient.readContract({
    address: CONTRACTS.rewardToken,
    abi: rewardTokenAbi,
    functionName: 'balanceOf',
    args: [address],
  })
}

