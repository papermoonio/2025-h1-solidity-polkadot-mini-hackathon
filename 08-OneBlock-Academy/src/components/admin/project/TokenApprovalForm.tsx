'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAccount, useWriteContract, usePublicClient, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';

const erc20Abi = [
  {
    inputs: [{ internalType: 'address', name: 'spender', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }, { internalType: 'address', name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

interface TokenApprovalFormProps {
  erc20Address: `0x${string}`;
  claimAddress: `0x${string}`;
  tokenAmount: string;
  studentCount: number;
}

export function TokenApprovalForm({
  erc20Address,
  claimAddress,
  tokenAmount,
  studentCount
}: TokenApprovalFormProps) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isTransferred, setIsTransferred] = useState(false);
  
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address || '0x'],
    query: { enabled: !!address }
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address || '0x', claimAddress],
    query: { enabled: !!address && !!claimAddress }
  });

  const isApprovalNeeded = () => {
    if (!allowance || !tokenAmount) return true;
    try {
      const requiredAmount = parseEther(tokenAmount);
      return allowance < requiredAmount;
    } catch (error) {
      console.error('检查授权额度错误:', error);
      return true;
    }
  };

  const handleApprove = async () => {
    if (!address) {
      toast.error('请先连接您的钱包');
      return;
    }

    setLoadingApprove(true);
    if (!publicClient) return alert('区块链客户端不可用');

    try {
      const amount = parseEther((Number(tokenAmount) * 1.05).toString());

      const txHash = await writeContractAsync({
        address: erc20Address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [claimAddress, amount]
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      await refetchAllowance();
      setIsApproved(true);

      toast.success('已成功授权代币，可以进行转账操作');
    } catch (error) {
      console.error('授权失败:', error);
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoadingApprove(false);
    }
  };

  const handleTransfer = async () => {
    if (!address) {
      toast.error('请先连接您的钱包');
      return;
    }

    setLoadingTransfer(true);
    if (!publicClient) return alert('区块链客户端不可用');
    try {
      const amount = parseEther(tokenAmount);

      const txHash = await writeContractAsync({
        address: erc20Address,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [claimAddress, amount]
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      await refetchBalance();
      setIsTransferred(true);

      toast.success(`已成功转入 ${tokenAmount} 代币到 Claim 合约`);
    } catch (error) {
      console.error('转账失败:', error);
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoadingTransfer(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-md bg-muted">
        <h3 className="text-sm font-medium mb-2">代币信息</h3>
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">代币地址:</span>
            <span className="font-mono">{erc20Address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Claim合约地址:</span>
            <span className="font-mono">{claimAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">总Token数量:</span>
            <span>{tokenAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">学员数量:</span>
            <span>{studentCount} 人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">每人平均:</span>
            <span>{studentCount > 0 ? (Number(tokenAmount) / studentCount).toFixed(4) : '0'} Token</span>
          </div>
          {balance && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">当前余额:</span>
              <span>{formatEther(balance)} Token</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">步骤 1: 授权代币</span>
            {isApproved && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
          <Button
            onClick={handleApprove}
            disabled={loadingApprove || !address || isApproved || !isApprovalNeeded()}
            size="sm"
          >
            {loadingApprove ? '授权中...' : isApproved ? '已授权' : '授权代币'}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">步骤 2: 转账到Claim合约</span>
            {isTransferred && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
          <Button
            onClick={handleTransfer}
            disabled={loadingTransfer || !address || !isApproved || isTransferred}
            size="sm"
            variant={!isApproved ? 'outline' : 'default'}
          >
            {loadingTransfer
              ? '转账中...'
              : isTransferred
              ? '已转账'
              : '转账代币'}
          </Button>
        </div>
      </div>

      {(isApproved || isTransferred) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Progress
                value={isTransferred ? 100 : isApproved ? 50 : 0}
                className="w-full"
              />
              <span className="text-sm">
                {isTransferred
                  ? '已完成'
                  : isApproved
                  ? '已授权'
                  : '未开始'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
