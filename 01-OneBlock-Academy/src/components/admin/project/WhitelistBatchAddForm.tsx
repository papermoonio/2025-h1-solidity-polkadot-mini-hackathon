'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
import { toast } from "sonner";
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { Progress } from '@/components/ui/progress';

// 白名单合约ABI
const whitelistAbi = [
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "accounts",
        "type": "address[]"
      }
    ],
    "name": "batchAddToWhitelist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

interface WhitelistBatchAddFormProps {
  addresses: `0x${string}`[];
  whitelistContractAddress: `0x${string}`;
  onWhitelistAdded: () => void;
}

export function WhitelistBatchAddForm({
  addresses,
  whitelistContractAddress,
  onWhitelistAdded
}: WhitelistBatchAddFormProps) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 批量大小，防止gas过高导致交易失败
  const BATCH_SIZE = 100;
  if (!publicClient) {
    return (
      <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
        区块链客户端不可用，请检查连接
      </div>
    );
  }

  const addToWhitelist = async () => {
    if (!address) {
      toast.error('请先连接您的钱包', {
        description: '未连接钱包',
      });
      return;
    }

    if (!whitelistContractAddress) {
      toast.error('请确保项目创建成功', {
        description: '白名单合约地址无效',
      });
      return;
    }

    if (addresses.length === 0) {
      toast.error('请确保有有效的学生钱包地址', {
        description: '没有可添加的地址',
      });
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const totalBatches = Math.ceil(addresses.length / BATCH_SIZE);
      
      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min((i + 1) * BATCH_SIZE, addresses.length);
        const batchAddresses = addresses.slice(start, end);
        
        // 发送交易
        const txHash = await writeContractAsync({
          address: whitelistContractAddress,
          abi: whitelistAbi,
          functionName: 'batchAddToWhitelist',
          args: [batchAddresses]
        });

        // 等待交易确认
        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
        
        const currentProgress = Math.floor(((i + 1) / totalBatches) * 100);
        setProgress(currentProgress);
        
        toast.success(`批次 ${i + 1}/${totalBatches} 添加成功`, {
          description: `已添加 ${end} 个地址，进度 ${currentProgress}%`,
        });
      }

      toast.success('白名单添加完成', {
        description: `成功添加 ${addresses.length} 个地址`,
      });

      onWhitelistAdded();
    } catch (error) {
      console.error('添加白名单失败:', error);
      toast.error('添加白名单失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-md bg-muted">
        <h3 className="text-sm font-medium mb-2">白名单信息</h3>
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">合约地址:</span>
            <span className="font-mono">{whitelistContractAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">添加地址数量:</span>
            <span>{addresses.length}</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>添加进度</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <div className="max-h-40 overflow-y-auto border rounded-md p-2">
        <h3 className="text-sm font-medium mb-2">白名单地址预览</h3>
        <div className="text-xs font-mono space-y-1">
          {addresses.slice(0, 5).map((addr, index) => (
            <div key={index} className="truncate">{addr}</div>
          ))}
          {addresses.length > 5 && (
            <div className="text-muted-foreground">...还有 {addresses.length - 5} 个地址</div>
          )}
        </div>
      </div>

      <Button 
        onClick={addToWhitelist} 
        disabled={loading || !address || addresses.length === 0} 
        className="w-full"
      >
        {loading ? `添加中 (${progress}%)` : '批量添加白名单'}
      </Button>
    </div>
  );
}
