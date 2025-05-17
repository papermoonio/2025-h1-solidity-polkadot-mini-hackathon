// src/components/Claim.tsx
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { useSession } from 'next-auth/react';
import { decodeEventLog, formatEther } from 'viem';
import Image from 'next/image';
import CopyAddress from "@/components/CopyAddress";

// Simplified ABIs
const CLAIM_ABI = [
  {
    "inputs": [],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "claimed",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "quota",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "account", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "tokenAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Claimed",
    "type": "event"
  }
];

const ERC20_ABI = [
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const NFT_ABI = [
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ownerOf",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// TypeScript 类型定义
type Project = {
  project_id: string;
  project_name: string;
  nft_address: `0x${string}`;
  claim_address: `0x${string}`;
  erc20_address: `0x${string}`;
  has_claimed?: boolean;
  created_at?: string;
};

export function StudentClaimComponent() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient()!; // Non-null assertion as we expect it to be defined
  const { data: session } = useSession();
  const studentId = session?.user?.id || '';
  const [latestProject, setLatestProject] = useState<Project | null>(null);
  const [claimedProjects, setClaimedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nftSymbol, setNftSymbol] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [hasUserClaimed, setHasUserClaimed] = useState(false);
  const [claimQuota, setClaimQuota] = useState('0');
  const [nftImage, setNftImage] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('');

  // Contract interaction hooks
  const { writeContractAsync } = useWriteContract();

  // Check if user has already claimed
  const checkClaimed = async (claimAddress: string, userAddress: string) => {
    try {
      const claimed = await publicClient.readContract({
        address: claimAddress as `0x${string}`,
        abi: CLAIM_ABI,
        functionName: 'claimed',
        args: [userAddress]
      });
      setHasUserClaimed(claimed as boolean);
    } catch (err) {
      console.error('Error checking claim status:', err);
    }
  };

  const getNftInfoByOwner = async (
    nftAddress: `0x${string}`,
    ownerAddress: `0x${string}`
  ) => {
    try {
      // 1. 查询持有者 NFT 数量
      const balance = (await publicClient.readContract({
        address: nftAddress,
        abi: NFT_ABI,
        functionName: 'balanceOf',
        args: [ownerAddress],
      })) as bigint

      if (balance <= BigInt(0)) {
        console.log('用户未持有此NFT，显示默认图片')
        setNftImage('/api/placeholder/400/400')
        return
      }
      
      // 3. 读取 metadata URI
      const rawUri = (await publicClient.readContract({
        address: nftAddress,
        abi: NFT_ABI,
        functionName: 'tokenURI',
        args: [BigInt(1)],
      })) as string

      // 4. IPFS 转换并 fetch metadata
      const metadataUrl = rawUri.startsWith('ipfs://')
        ? rawUri.replace('ipfs://', 'https://ipfs.io/ipfs/')
        : rawUri

      const res = await fetch(metadataUrl)
      if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.status}`)
      const { image } = (await res.json()) as { image?: string }

      // 5. 处理 image 的 IPFS URI
      const imageUrl = image
        ? image.startsWith('ipfs://')
          ? image.replace('ipfs://', 'https://ipfs.io/ipfs/')
          : image
        : '/api/placeholder/400/400'

      setNftImage(imageUrl)
    } catch (err) {
      console.error('getNftInfoByOwner error:', err)
      setNftImage('/api/placeholder/400/400')
    }
  }

  // Get claim quota
  const getClaimQuota = async (claimAddress: string) => {
    try {
      const quota = await publicClient.readContract({
        address: claimAddress as `0x${string}`,
        abi: CLAIM_ABI,
        functionName: 'quota'
      });
      setClaimQuota(formatEther(quota as bigint));
    } catch (err) {
      console.error('Error getting claim quota:', err);
    }
  };

  // Get token symbol
  const getTokenSymbol = async (tokenAddress: string) => {
    try {
      const symbol = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol'
      });
      setTokenSymbol(symbol as string);

      if (address) {
        const balance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address]
        });
        setTokenBalance(formatEther(balance as bigint));
      }
    } catch (err) {
      console.error('Error getting token info:', err);
    }
  };

  // Get NFT symbol and image
  const getNftInfo = async (nftAddress: string) => {
    try {
      const symbol = await publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'symbol'
      });
      setNftSymbol(symbol as string);
    } catch (err) {
      console.error('Error getting NFT info:', err);
    }
  };

  // Fetch project data from API
  const fetchProjectData = async () => {
    if (!studentId) {
      setError('请输入学员ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/student/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'query',
          student_id: studentId
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Handle the updated API response structure
      if (data.projects) {
        // Process history of claimed projects
        if (data.projects.history) {
          setClaimedProjects(data.projects.history);
        }

        // Process latest project if available
        if (data.projects.latest) {
          const currentProject = data.projects.latest;
          setLatestProject(currentProject);
          
          // Get token and NFT info
          if (currentProject.erc20_address) {
            await getTokenSymbol(currentProject.erc20_address);
          }
          if (currentProject.nft_address) {
            await getNftInfo(currentProject.nft_address);
          }
          if (currentProject.claim_address && address) {
            await checkClaimed(currentProject.claim_address, address);
            await getClaimQuota(currentProject.claim_address);
            if (currentProject.nft_address) {
              await getNftInfoByOwner(currentProject.nft_address, address);
            }
          }
        }
      } else if (data.project && data.project.latest) {
        // Handle the case where only the latest project is returned
        const currentProject = data.project.latest;
        setLatestProject(currentProject);
        
        // Get token and NFT info
        if (currentProject.erc20_address) {
          await getTokenSymbol(currentProject.erc20_address);
        }
        if (currentProject.nft_address) {
          await getNftInfo(currentProject.nft_address);
        }
        if (currentProject.claim_address && address) {
          await checkClaimed(currentProject.claim_address, address);
          await getClaimQuota(currentProject.claim_address);
          if (currentProject.nft_address) {
            await getNftInfoByOwner(currentProject.nft_address, address);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('获取项目数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // Execute claim function on contract
  const handleClaim = async () => {
    if (!latestProject || !address || !isConnected) {
      setError('请先连接钱包');
      return;
    }

    if (hasUserClaimed) {
      setError('您已经领取过该项目的代币');
      return;
    }

    setTransactionStatus('处理中...');

    try {
      const hash = await writeContractAsync({
        address: latestProject.claim_address as `0x${string}`,
        abi: CLAIM_ABI,
        functionName: 'claim'
      });

      setTransactionStatus('交易已提交，等待确认...');

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Look for the Claimed event in the logs
      const claimedEvents = receipt.logs
        .filter(log => log.address.toLowerCase() === latestProject.claim_address.toLowerCase())
        .map(log => {
          try {
            return decodeEventLog({
              abi: CLAIM_ABI,
              data: log.data,
              topics: log.topics,
            });
          } catch {
            return null;
          }
        })
        .filter(event => event?.eventName === 'Claimed');

      if (claimedEvents.length > 0) {
        // Record claim in database
        await recordClaim(latestProject);
        setTransactionStatus('领取成功！');
        setHasUserClaimed(true);

        // Refresh token balance
        if (latestProject.erc20_address) {
          const balance = await publicClient.readContract({
            address: latestProject.erc20_address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address]
          });
          setTokenBalance(formatEther(balance as bigint));
        }

        // Add the claimed project to the history list
        setClaimedProjects(prev => [
          { ...latestProject, has_claimed: true, created_at: new Date().toISOString() },
          ...prev
        ]);
      }
    } catch (err) {
      console.error('Error claiming tokens:', err);
      setTransactionStatus('');
      setError('领取失败，请稍后重试');
    }
  };

  // Record successful claim in the database
  const recordClaim = async (projectData: Project) => {
    try {
      await fetch('/api/student/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          student_id: studentId,
          project_id: projectData.project_id,
          project_name: projectData.project_name,
          nft_address: projectData.nft_address,
          claim_address: projectData.claim_address,
          erc20_address: projectData.erc20_address
        }),
      });
    } catch (err) {
      console.error('Error recording claim:', err);
    }
  };

  // Check claim status when wallet address changes
  useEffect(() => {
    if (address && latestProject?.claim_address) {
      checkClaimed(latestProject.claim_address, address);
      if (latestProject.erc20_address) {
        getTokenSymbol(latestProject.erc20_address);
      }
    }
  }, [address, latestProject]);

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">学员项目claim领取</h1>

      {/* Query Button */}
      <div className="mb-6">
        <button
          onClick={fetchProjectData}
          disabled={loading || !studentId}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? '加载中...' : '查询最新claim项目信息'}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Latest Project Information */}
      {latestProject && (
        <div className="border rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">最新项目: {latestProject.project_name}</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">代币信息</h3>
              <p className="mb-1"><span className="font-medium">代币符号:</span> {tokenSymbol || '加载中...'}</p>
              <p className="mb-1"><span className="font-medium">代币地址:</span> <CopyAddress address={latestProject.erc20_address}/></p>
              <p className="mb-1"><span className="font-medium">领取数量:</span> {claimQuota} {tokenSymbol}</p>
              <p className="mb-1"><span className="font-medium">当前余额:</span> {tokenBalance} {tokenSymbol}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">NFT信息</h3>
              <p className="mb-1"><span className="font-medium">NFT符号:</span> {nftSymbol || '加载中...'}</p>
              <p className="mb-1"><span className="font-medium">NFT地址:</span> <CopyAddress address={latestProject.nft_address}/></p>

              {nftImage && (
                <div className="mt-4">
                  <Image
                    src={nftImage}
                    alt="NFT预览图"
                    width={150}
                    height={150}
                    className="rounded-md"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Claim Button */}
          <div className="mt-6">
            {!isConnected ? (
              <p className="text-yellow-600">请先连接钱包以领取代币</p>
            ) : hasUserClaimed || latestProject.has_claimed ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                您已成功领取此项目的代币和NFT
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={loading || !isConnected}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                领取代币和NFT
              </button>
            )}

            {transactionStatus && (
              <p className="mt-2 text-blue-600">{transactionStatus}</p>
            )}
          </div>
        </div>
      )}

      {/* Claimed Projects History */}
      {claimedProjects.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">已领取的项目</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 border-b text-left">项目名称</th>
                  <th className="py-2 px-4 border-b text-left">领取时间</th>
                  <th className="py-2 px-4 border-b text-left">状态</th>
                </tr>
              </thead>
              <tbody>
                {claimedProjects.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-2 px-4 border-b">{item.project_name}</td>
                    <td className="py-2 px-4 border-b">{item.created_at}</td>
                    <td className="py-2 px-4 border-b">
                      {item.has_claimed ? (
                        <span className="text-green-600">已领取</span>
                      ) : (
                        <span className="text-yellow-600">未领取</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}