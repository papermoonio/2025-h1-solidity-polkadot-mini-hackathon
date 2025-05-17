"use client"

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { add, format, set } from 'date-fns'
import { getProposal, hasVoted, voteProposal, walletClient } from '@/lib/viem'
import Button from '@/components/ui/Button'
import { useAccount } from '@/hooks/useAccount'

export const CONTRACTS = {
  govToken: process.env.NEXT_PUBLIC_GOV_TOKEN_ADDRESS,
  rewardToken: process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS,
  governance: process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS,
  lottery: process.env.NEXT_PUBLIC_LOTTERY_ADDRESS,
}

export default function ProposalDetailPage() {
  const { id } = useParams()
  const {address} = useAccount()
  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [voting, setVoting] = useState(false)
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    async function fetchProposal() {
      try {
        // fetch proposal detail
        const result = await getProposal(id)
        setProposal(result)
      } catch (e) {
        setError('提案加载失败：',e)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchProposal()
  }, [id])

  useEffect(()=>{
    async function checkVoted(){
      const result = await hasVoted(address, id)
      setVoted(result)
    }
    if (address) checkVoted()
  },[address])

  const handleVote = async (support) => {
    try {
      setVoting(true)
      await voteProposal(address, id, support)
      alert('投票成功！')
      setVoted(true)
    } catch (e) {
      console.error(e)
      alert('投票失败')
    } finally {
      setVoting(false)
    }
  }

  if (loading) return <p>加载中...</p>
  if (error) return <p>{error}</p>
  if (!proposal) return null

  return (
    <div className="space-y-4 mt-6">
      <h2 className="text-2xl font-bold">提案详情</h2>
      <p><span className="font-semibold">提案 ID:</span> {proposal.id}</p>
      <p><span className="font-semibold">描述:</span> {proposal.description}</p>
      <p><span className="font-semibold">发起人:</span> {proposal.proposer}</p>
      <p><span className="font-semibold">赞成票:</span> {proposal.yesVotes}</p>
      <p><span className="font-semibold">反对票:</span> {proposal.noVote}</p>
      <p><span className="font-semibold">是否通过:</span> {proposal.pass ? '✅ 是' : '❌ 否'}</p>
      <p><span className="font-semibold">是否已结束:</span> {proposal.finalized ? '✅ 是' : '❌ 否'}</p>
      <p><span className="font-semibold">截止时间:</span> {format(new Date(proposal.deadline * 1000), 'yyyy-MM-dd HH:mm:ss')}</p>

      {voted && <p className="text-green-500">你已经投票过了</p>}
      {!voted && (
          <div className="flex gap-4 mt-4">
            <Button onClick={() => handleVote(true)} disabled={voting}>投赞成票</Button>
            <Button onClick={() => handleVote(false)} disabled={voting}>投反对票</Button>
          </div>  
      )}
    </div>
  )
}
