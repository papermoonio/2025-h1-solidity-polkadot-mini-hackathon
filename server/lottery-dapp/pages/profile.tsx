"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useWeb3 } from "../contexts/Web3Context"
import {
  getOwnedLotteries,
  getLotteryInstanceAddress,
  getLotteryDetails,
  getLotteryCount,
  getLatestLotteries,
} from "../services/contracts"
import { formatDateTime, truncateAddress, isValidAddress } from "../utils/format"
import Layout from "../components/Layout"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Skeleton } from "../components/ui/skeleton"
import LoadingSpinner from "../components/LoadingSpinner"
import { 
  User, 
  Clock, 
  Trophy, 
  Award,
  PlusCircle,
  CornerRightDown,
  ArrowLeft
} from "lucide-react"

export default function Profile() {
  const router = useRouter()
  const { account, provider, isConnected, isCorrectNetwork, disconnectWallet } = useWeb3()

  const [createdLotteries, setCreatedLotteries] = useState<any[]>([])
  const [participatedLotteries, setParticipatedLotteries] = useState<any[]>([])
  const [loadingCreated, setLoadingCreated] = useState(true)
  const [loadingParticipated, setLoadingParticipated] = useState(true)

  // 获取用户创建的抽奖
  useEffect(() => {
    async function fetchCreatedLotteries() {
      if (!provider || !account || !isConnected || !isCorrectNetwork) {
        setLoadingCreated(false)
        return
      }

      try {
        const lotteryIds = await getOwnedLotteries(provider, account)
        
        // 获取每个抽奖的详情
        const lotteryDetailsPromises = lotteryIds.map(async (id: string) => {
          try {
            const address = await getLotteryInstanceAddress(provider, id)
            if (address === '0x0000000000000000000000000000000000000000') return null
            
            const details = await getLotteryDetails(provider, address)
            return { id, address, ...details }
          } catch (error) {
            console.error(`获取抽奖 ${id} 详情失败:`, error)
            return null
          }
        })
        
        const lotteries = (await Promise.all(lotteryDetailsPromises)).filter(Boolean)
        setCreatedLotteries(lotteries)
      } catch (error) {
        console.error("获取创建的抽奖失败:", error)
      } finally {
        setLoadingCreated(false)
      }
    }
    
    fetchCreatedLotteries()
  }, [provider, account, isConnected, isCorrectNetwork])

  // 获取用户参与的抽奖
  useEffect(() => {
    async function fetchParticipatedLotteries() {
      if (!provider || !account || !isConnected || !isCorrectNetwork) {
        setLoadingParticipated(false)
        return
      }

      try {
        // 获取所有抽奖 ID
        const allLotteryIds = await getLotteryCount(provider)
        const participatedLotteryDetails = []
        
        // 获取最近的抽奖（如果数量太多，只获取最近的20个）
        const recentLotteryIds = await getLatestLotteries(provider, Math.min(20, allLotteryIds))
        
        // 检查用户是否参与了这些抽奖
        const participatedPromises = recentLotteryIds.map(async (id: string) => {
          try {
            const address = await getLotteryInstanceAddress(provider, id)
            if (address === '0x0000000000000000000000000000000000000000') return null
            
            const details = await getLotteryDetails(provider, address)
            
            // 检查当前用户是否参与
            const hasParticipated = details.participants.some(
              (p: string) => p.toLowerCase() === account.toLowerCase()
            )
            
            if (hasParticipated) {
              return { id, address, ...details }
            }
            return null
          } catch (error) {
            console.error(`获取抽奖 ${id} 详情失败:`, error)
            return null
          }
        })
        
        const participatedResults = (await Promise.all(participatedPromises)).filter(Boolean)
        setParticipatedLotteries(participatedResults)
      } catch (error) {
        console.error("获取参与的抽奖失败:", error)
      } finally {
        setLoadingParticipated(false)
      }
    }
    
    fetchParticipatedLotteries()
  }, [provider, account, isConnected, isCorrectNetwork])

  // 渲染抽奖状态
  const renderLotteryState = (state: number) => {
    switch (state) {
      case 0:
        return <Badge className="text-white bg-green-500">进行中</Badge>
      case 1:
        return <Badge className="text-white bg-yellow-500">开奖中</Badge>
      case 2:
        return <Badge className="text-white bg-blue-500">可领奖</Badge>
      case 3:
        return <Badge className="text-gray-700 bg-gray-300">已结束</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  // 渲染抽奖卡片
  const renderLotteryCard = (lottery: any) => (
    <Card key={lottery.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{lottery.lotteryName}</CardTitle>
            <CardDescription className="mt-1">
              ID: {lottery.id}
            </CardDescription>
          </div>
          <div>{renderLotteryState(lottery.currentState)}</div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-y-2">
          <div className="flex items-center text-sm">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>开奖时间: {formatDateTime(lottery.drawTime)}</span>
          </div>
          <div className="flex items-center text-sm">
            <Trophy className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>奖池: {lottery.prizePool} ETH</span>
          </div>
        </div>
        {lottery.winner && 
         isValidAddress(lottery.winner) && 
         (lottery.currentState === 2 || lottery.currentState === 3) && (
          <div className="mt-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950 text-sm">
            <div className="flex items-center text-blue-800 dark:text-blue-400">
              <Award className="mr-2 h-4 w-4" />
              <span>中奖者: {truncateAddress(lottery.winner)}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href={`/lottery/${lottery.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            查看详情
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )

  // 渲染各区块的骨架屏
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <Skeleton className="h-5 w-36 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )

  const handleDisconnect = () => {
    disconnectWallet()
    router.push("/")
  }

  if (!isConnected || !isCorrectNetwork) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">请先连接钱包</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            您需要连接钱包并切换到 Moonbase Alpha 测试网才能查看个人资料。
          </p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">个人资料</h1>
            <p className="text-muted-foreground mt-1">
              管理您创建和参与的抽奖
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/create">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                创建新抽奖
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-muted mb-6 flex items-center">
          <User className="h-5 w-5 mr-2 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">钱包地址: </span>
            <span className="font-medium">{account}</span>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="created" className="mb-10">
        <TabsList className="mb-6">
          <TabsTrigger value="created">我创建的</TabsTrigger>
          <TabsTrigger value="participated">我参与的</TabsTrigger>
        </TabsList>
        
        <TabsContent value="created">
          {loadingCreated ? (
            <div className="py-4">
              <div className="flex items-center mb-6">
                <LoadingSpinner className="mr-2" />
                <span>加载中...</span>
              </div>
              {renderSkeleton()}
            </div>
          ) : createdLotteries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdLotteries.map(lottery => renderLotteryCard(lottery))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-xl font-medium mb-2">暂无创建的抽奖</h3>
              <p className="text-muted-foreground mb-6">
                您还没有创建过任何抽奖活动
              </p>
              <Link href="/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  创建抽奖
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="participated">
          {loadingParticipated ? (
            <div className="py-4">
              <div className="flex items-center mb-6">
                <LoadingSpinner className="mr-2" />
                <span>加载中...</span>
              </div>
              {renderSkeleton()}
            </div>
          ) : participatedLotteries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participatedLotteries.map(lottery => renderLotteryCard(lottery))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-xl font-medium mb-2">暂无参与的抽奖</h3>
              <p className="text-muted-foreground mb-6">
                您还没有参与过任何抽奖活动
              </p>
              <Link href="/">
                <Button>
                  <CornerRightDown className="mr-2 h-4 w-4" />
                  查看抽奖列表
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  )
} 