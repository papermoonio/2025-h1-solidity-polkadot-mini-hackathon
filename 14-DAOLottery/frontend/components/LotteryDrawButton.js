"use client"

import { useEffect, useState } from 'react'
import { drawLottery, getWinnerAddress } from '@/lib/viem'
import { useAccount } from '@/hooks/useAccount'

export default function LotteryDrawButton({ proposalId }) {
  const {address} = useAccount()
  const [winner, setWinner] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function checkWinner() {
      try {
        const winnerAddress = await getWinnerAddress(proposalId)
        console.log('中奖地址:', winnerAddress)
        setWinner(winnerAddress)
      } catch (error) {
        console.error('检查是否已抽奖失败:', error)
      }
    }
    checkWinner()
  }, [proposalId])

  const handleDraw = async () => {
    try {
      setLoading(true)
      const result = await drawLottery(address,proposalId)
      console.log('抽奖结果:', result)
      alert('抽奖成功！')
      window.location.reload()
    } catch (err) {
      console.error('抽奖失败:', err)
      alert('抽奖失败，请检查控制台')
    } finally {
      setLoading(false)
    }
  }

  if (winner && winner !== '0x0000000000000000000000000000000000000000') {
    return <p className="text-green-400 mt-2">已抽奖，中奖地址：{winner}</p>
  }

  return (
    <button
      onClick={handleDraw}
      disabled={loading}
      className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
    >
      {loading ? '抽奖中...' : '抽奖'}
    </button>
  )
}
