"use client"

import { useEffect, useState } from 'react'
import { getProposalListWithStatus, finalizeProposal as finalizeProposalOnChain, getProposalList } from '@/lib/viem'
import { useAccount } from '@/hooks/useAccount'
import FinalizeButton from '@/components/FinalizeButton'
import LotteryDrawButton from '@/components/LotteryDrawButton'

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS

const AdminPage = () => {
  const { address } = useAccount()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProposals() {
      try {
        const allProposals = await getProposalList()
        const activeProposals = allProposals.filter(p => 
            p.deadline * 1000 < Date.now()
        )
        setProposals(activeProposals)
        setLoading(false)
      } catch (error) {
        console.error('获取提案列表失败:', error)
      }
    }
    fetchProposals()
  }, [])

  if (!address) return <p className="mt-8">请连接钱包</p>
  if (address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
    return <p className="mt-8 text-red-500">你不是管理员，无权访问此页面</p>
  }

  return (
    <div className="space-y-6 mt-10">
      <h1 className="text-3xl font-bold">管理员操作面板</h1>
      {loading ? (
        <p>加载中...</p>
      ) : (
        proposals.map((p, i) => (
          <div key={i} className="border p-4 rounded bg-gray-800">
            <p><span className="font-semibold">提案 ID:</span> {p.id}</p>
            <p><span className="font-semibold">描述:</span> {p.description}</p>
            <p><span className="font-semibold">截止时间:</span> {new Date(p.deadline * 1000).toLocaleString()}</p>
            <p><span className="font-semibold">是否已 Finalized:</span> {p.finalized ? '是' : '否'}</p>
            {!p.finalized && p.deadline * 1000 < Date.now() && (
              <FinalizeButton proposalId={p.id} onFinalized={() => window.location.reload()} />
            )}
            {p.finalized && (
              <LotteryDrawButton proposalId={p.id} />
            )}
          </div>
        ))
      )}
    </div>
  )
}
export default AdminPage