/*
File: app/components/admin/project/CreateProjectForm.tsx
Description: UI form to create a new project via Factory3 using Wagmi hooks
*/
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { parseEther, decodeEventLog, stringToHex, padHex } from 'viem';

function encodeProjectId(id: string): `0x${string}` {
  return padHex(stringToHex(id), { size: 32 });
}

const factoryAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "projectId", type: "bytes32" },
      { internalType: "address", name: "tokenAddress", type: "address" },
      { internalType: "string", name: "nftName", type: "string" },
      { internalType: "string", name: "nftSymbol", type: "string" },
      { internalType: "string", name: "baseURI", type: "string" },
      { internalType: "uint256", name: "claimQuota", type: "uint256" }
    ],
    name: "createProject",
    outputs: [
      { internalType: "address", name: "whitelistContract", type: "address" },
      { internalType: "address", name: "nftContract", type: "address" },
      { internalType: "address", name: "claimContract", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "projectId", type: "bytes32" },
      { indexed: false, internalType: "address", name: "whitelistContract", type: "address" },
      { indexed: false, internalType: "address", name: "nftContract", type: "address" },
      { indexed: false, internalType: "address", name: "claimContract", type: "address" }
    ],
    name: "ProjectDeployed",
    type: "event"
  }
] as const;

interface CreateProjectFormProps {
  onProjectCreated: (data: {
    whitelistAddr: `0x${string}`;
    nftAddr: `0x${string}`;
    claimAddr: `0x${string}`;
    erc20Addr: `0x${string}`;
  }) => void;
}

export function CreateProjectForm({ onProjectCreated }: CreateProjectFormProps) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [tokenAddr, setTokenAddr] = useState('');
  const [projectName, setProjectName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [baseURI, setBaseURI] = useState('');
  const [deposit, setDeposit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return alert('请先连接钱包');
    if (!publicClient) return alert('区块链客户端不可用');
    
    setLoading(true);
    
    try {
      const factoryAddress = (process.env.NEXT_PUBLIC_CLAIM_FACTORY as `0x${string}`) || '0x';
      const projectIdBytes = encodeProjectId(projectName);

      // 发送合约交易
      const txHash = await writeContractAsync({
        address: factoryAddress,
        abi: factoryAbi,
        functionName: 'createProject',
        args: [
          projectIdBytes,
          tokenAddr as `0x${string}`,
          projectName,
          symbol,
          baseURI,
          parseEther(deposit)
        ]
      });

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      // 解析事件日志
      const eventLog = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: factoryAbi,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'ProjectDeployed';
        } catch {
          return false;
        }
      });

      if (!eventLog) throw new Error('未能解析到 ProjectDeployed 事件');

      // 解码事件参数
      const { args } = decodeEventLog({
        abi: factoryAbi,
        data: eventLog.data,
        topics: eventLog.topics,
      }) as { 
        args: { 
          projectId: string; 
          whitelistContract: `0x${string}`; 
          nftContract: `0x${string}`; 
          claimContract: `0x${string}` 
        } 
      };

      // 提交到后端API
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId:projectIdBytes,
          projectName,
          factoryAddress,
          whitelistAddr: args.whitelistContract,
          nftAddr: args.nftContract,
          claimAddr: args.claimContract,
          erc20Addr:tokenAddr
        }),
      });

      if (!response.ok) {
        throw new Error('保存项目信息失败');
      }

      onProjectCreated({
        whitelistAddr: args.whitelistContract,
        nftAddr: args.nftContract,
        claimAddr: args.claimContract,
        erc20Addr: tokenAddr as `0x${string}`
      });
    } catch (err) {
      console.error(err);
      alert(`创建失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-2xl shadow">
      <Input
        placeholder="ERC20 Token 地址 (0x开头)"
        value={tokenAddr}
        onChange={e => setTokenAddr(e.target.value)}
        required
      />
      <Input
        placeholder="项目名称"
        value={projectName}
        onChange={e => setProjectName(e.target.value)}
        required
      />
      <Input
        placeholder="NFT Symbol"
        value={symbol}
        onChange={e => setSymbol(e.target.value)}
        required
      />
      <Input
        placeholder="Base URI"
        value={baseURI}
        onChange={e => setBaseURI(e.target.value)}
        required
      />
      <Input
        placeholder="认领配额"
        value={deposit}
        onChange={e => setDeposit(e.target.value)}
        required
      />
      <Button 
        type="submit" 
        disabled={loading || !address} 
        className="w-full"
      >
        {address ? (loading ? '创建中...' : '创建项目') : '请连接钱包'}
      </Button>
    </form>
  );
}
