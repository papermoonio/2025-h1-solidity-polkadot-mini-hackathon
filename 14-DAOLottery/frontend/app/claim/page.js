"use client"

import { useEffect, useState } from 'react'
import { useAccount } from '@/hooks/useAccount'
import {
  getProposalList,
  getWinnerAddress,
  hasClaimedReward,
  claimReward
} from '@/lib/viem'

const ClaimPage = () => {
  const { address } = useAccount()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(null)

  useEffect(() => {
    async function fetchWinningProposals() {
      if (!address) return
      try {
        const all = await getProposalList()
        const finalized = all.filter(p => p.finalized)
        const winners = []

        for (const proposal of finalized) {
          const winnerAddress = await getWinnerAddress(proposal.id)
          if (winnerAddress.toLowerCase() === address.toLowerCase()) {
            const claimed = await hasClaimedReward(address,proposal.id)
            winners.push({
              ...proposal,
              hasClaimed: claimed
            })
          }
        }

        setProposals(winners)
        setLoading(false)
      } catch (err) {
        console.error('查询中奖信息失败', err)
      }
    }
    fetchWinningProposals()
  }, [address])

  async function handleClaim(proposalId) {
    try {
      setClaiming(proposalId)
      await claimReward(address,proposalId)
      alert('领取成功！')
      // 更新本地状态
      setProposals(prev =>
        prev.map(p =>
          p.id === proposalId ? { ...p, hasClaimed: true } : p
        )
      )
    } catch (err) {
      console.error('领取失败', err)
      alert('领取失败，请检查合约状态或稍后再试')
    } finally {
      setClaiming(null)
    }
  }

  if (!address) return <p className="mt-8">请连接钱包</p>

  return (
    <div className="mt-10 space-y-4">
      <h1 className="text-2xl font-bold">领奖中心</h1>
      {loading ? (
        <p>正在加载你的中奖记录...</p>
      ) : proposals.length === 0 ? (
        <p>你暂时没有中奖记录</p>
      ) : (
        proposals.map(p => (
          <div key={p.id} className="border p-4 rounded bg-gray-800">
            <p><strong>提案 ID:</strong> {p.id}</p>
            <p><strong>描述:</strong> {p.description}</p>
            {p.hasClaimed ? (
              <p className="text-green-400 mt-2">奖励已领取 ✅</p>
            ) : (
              <button
                onClick={() => handleClaim(p.id)}
                className="mt-2 px-4 py-1 bg-yellow-500 rounded text-black"
                disabled={claiming === p.id}
              >
                {claiming === p.id ? '领取中...' : '领取奖励'}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default ClaimPage
