'use client'

import { useEffect, useState } from 'react'
import { connectWallet } from '@/lib/viem'

export default function ConnectWallet() {
  const [address, setAddress] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) setAddress(accounts[0])
      })

      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
        } else {
          setAddress(null)
        }
      })
    }
  }, [])

  const handleConnect = async () => {
    try {
      const addr = await connectWallet()
      setAddress(addr)
    } catch (err) {
      console.error('连接失败:', err)
      alert('连接钱包失败，请确认已安装 MetaMask')
    }
  }

  const shorten = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <span
      onClick={handleConnect}
      className="cursor-pointer hover:underline text-blue-400"
    >
      {address ? shorten(address) : '连接钱包'}
    </span>
  )
}
