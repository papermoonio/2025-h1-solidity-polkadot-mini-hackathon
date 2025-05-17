"use client"
import { getProposalList } from '@/lib/viem'
import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'

const ProposalList = () => {
  const [proposals, setProposals] = useState([])

  useEffect(() => {
    async function fetchProposals() {
      try {
        const allProposals = await getProposalList()
        const activeProposals = allProposals.filter(p => p.deadline * 1000 > Date.now())
        setProposals(activeProposals)
      } catch (error) {
        console.error('获取提案列表失败:', error)
      }
    }
    fetchProposals()
  }, [])

  return (
    <div className="space-y-4 mt-6">
      <h2 className="text-2xl font-bold">提案列表</h2>
      {proposals.length === 0 ? (
        <p className="text-gray-400">暂无活跃提案</p>
      ) : (
        <ul className="space-y-4">
          {proposals.map((p, index) => (
            <li key={index} className="border p-4 rounded-lg shadow-sm bg-gray-800">
              <Link href={`/proposals/${p.id}`}>
                <p className="cursor-pointer hover:underline"><span className="font-semibold">提案 ID:</span> {p.id}</p>
              </Link>
              <p><span className="font-semibold">描述:</span> {p.description}</p>
              <p><span className="font-semibold">发起人:</span> {p.proposer}</p>
              <p><span className="font-semibold">截止时间:</span> {format(new Date(p.deadline * 1000), 'yyyy-MM-dd HH:mm:ss')}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ProposalList
