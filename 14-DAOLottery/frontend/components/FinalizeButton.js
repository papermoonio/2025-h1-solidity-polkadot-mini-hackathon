'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { useAccount } from '@/hooks/useAccount'
import { finalizeProposal } from '@/lib/viem'

export default function FinalizeButton({ proposalId }) {
  const { address } = useAccount()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFinalize = async () => {
    setLoading(true)
    setError('')
    try {
        const result = await finalizeProposal(address, proposalId)
        console.log("提案已 Finalize:",result)
    } catch (err) {
        console.error(err)
        setError(err.message || 'Finalize 失败')
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className='mt-4'>
      <Button onClick={handleFinalize} disabled={loading}>
        {loading ? 'Finalizing...' : 'Finalize 提案'}
      </Button>
      {error && <p className="text-red-400 mt-1">{error}</p>}
    </div>
  )
}
