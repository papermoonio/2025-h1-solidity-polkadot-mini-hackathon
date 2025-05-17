"use client"

import { useEffect, useState } from "react"
import { useAccount } from "@/hooks/useAccount"
import {
  getGovTokenBalance,
  getRewardTokenBalance
} from "@/lib/viem"

const ProfilePage = () => {
  const { address } = useAccount()
  const [govBalance, setGovBalance] = useState(null)
  const [rewardBalance, setRewardBalance] = useState(null)

  useEffect(() => {
    async function fetchBalances() {
      if (!address) return

      try {
        const [gov, reward] = await Promise.all([
          getGovTokenBalance(address),
          getRewardTokenBalance(address)
        ])
        setGovBalance(gov)
        setRewardBalance(reward)
      } catch (err) {
        console.error("获取代币余额失败", err)
      }
    }

    fetchBalances()
  }, [address])

  if (!address) return <p className="mt-8">请连接钱包</p>

  return (
    <div className="mt-10 max-w-md mx-auto bg-gray-900 p-6 rounded-lg shadow-lg text-white">
      <h1 className="text-2xl font-bold mb-4">🧑 个人中心</h1>

      <div className="space-y-3">
        <p><strong>钱包地址：</strong><br />{address}</p>

        <div className="bg-gray-800 p-4 rounded">
          <p className="text-yellow-300 text-lg font-semibold">🎖 GovToken（治理代币）</p>
          <p className="text-xl">{govBalance !== null ? govBalance.toString() : "加载中..."}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <p className="text-green-300 text-lg font-semibold">💰 RewardToken（奖励代币）</p>
          <p className="text-xl">{rewardBalance !== null ? rewardBalance.toString() : "加载中..."}</p>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
