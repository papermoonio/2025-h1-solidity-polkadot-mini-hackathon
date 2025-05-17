"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useWeb3 } from "../contexts/Web3Context"
import {
  getAllLotteryIds,
  getLotteryInstanceAddress,
  getLotteryDetails,
  resetLottery,
  LOTTERY_FACTORY_ADDRESS,
} from "../services/contracts"
import { useToast } from "../components/ui/use-toast"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { ArrowLeft, Search, RefreshCw, Shield, AlertTriangle, Check, X } from "lucide-react"
import { formatDateTime } from "../utils/format"
import LoadingSpinner from "../components/LoadingSpinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"

const Admin: React.FC = () => {
  const router = useRouter()
  const { account, provider, signer, isConnected, isCorrectNetwork } = useWeb3()
  const { toast } = useToast()

  const [isFactoryDeployer, setIsFactoryDeployer] = useState(false)
  const [lotteries, setLotteries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // 停止抽奖相关状态
  const [isStoppingLottery, setIsStoppingLottery] = useState(false)
  const [selectedLottery, setSelectedLottery] = useState<any>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  // 检查是否是工厂合约的部署者
  useEffect(() => {
    const checkFactoryDeployer = async () => {
      if (!provider || !account || !isConnected || !isCorrectNetwork) {
        setLoading(false)
        return
      }

      try {
        // 这里我们假设部署合约的地址是工厂合约的地址
        const isDeployer = account.toLowerCase() === LOTTERY_FACTORY_ADDRESS.toLowerCase()
        setIsFactoryDeployer(isDeployer)

        if (!isDeployer) {
          toast({
            title: "访问被拒绝",
            description: "您没有管理员权限",
            variant: "destructive",
          })
          router.push("/")
        } else {
          fetchLotteries()
        }
      } catch (error) {
        console.error("检查部署者身份失败:", error)
        setLoading(false)
      }
    }

    checkFactoryDeployer()
  }, [provider, account, isConnected, isCorrectNetwork, router, toast])

  // 获取所有抽奖
  const fetchLotteries = async () => {
    if (!provider || !isConnected || !isCorrectNetwork) {
      setLoading(false)
      return
    }

    try {
      setRefreshing(true)
      const ids = await getAllLotteryIds(provider)

      const lotteriesData = await Promise.all(
        ids.map(async (id: string) => {
          const address = await getLotteryInstanceAddress(provider, id)
          const details = await getLotteryDetails(provider, address)

          return {
            id,
            address,
            ...details,
            participantsCount: details.participants.length,
          }
        }),
      )

      setLotteries(lotteriesData)
    } catch (error) {
      console.error("获取抽奖列表失败:", error)
      toast({
        title: "获取数据失败",
        description: "无法获取抽奖列表",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 停止抽奖
  const handleStopLottery = async () => {
    if (!signer || !selectedLottery) return

    setIsStoppingLottery(true)

    try {
      await resetLottery(signer, selectedLottery.address)

      toast({
        title: "操作成功",
        description: `抽奖 "${selectedLottery.lotteryName}" 已成功停止`,
      })

      // 刷新数据
      fetchLotteries()
    } catch (error: any) {
      console.error("停止抽奖失败:", error)

      let errorMessage = "停止抽奖时发生错误"
      if (error.reason) {
        errorMessage = error.reason
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "操作失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsStoppingLottery(false)
      setConfirmDialogOpen(false)
      setSelectedLottery(null)
    }
  }

  // 打开确认对话框
  const openConfirmDialog = (lottery: any) => {
    setSelectedLottery(lottery)
    setConfirmDialogOpen(true)
  }

  // 过滤抽奖列表
  const filteredLotteries = lotteries.filter(
    (lottery) =>
      lottery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lottery.lotteryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lottery.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!isConnected || !isCorrectNetwork) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <h1 className="text-3xl font-bold mb-4 gradient-text">请先连接钱包</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          您需要连接钱包并切换到 Moonbase Alpha 测试网才能访问管理后台。
        </p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Button>
        </Link>
      </div>
    )
  }

  if (!isFactoryDeployer && !loading) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <h1 className="text-3xl font-bold mb-4 text-destructive">访问被拒绝</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">您没有管理员权限，无法访问此页面。</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Button>
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">加载管理后台中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                管理后台
              </CardTitle>
              <CardDescription>管理所有抽奖活动</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLotteries}
              disabled={refreshing}
              className="flex items-center"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索抽奖ID、名称或地址..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>参与人数</TableHead>
                  <TableHead>奖池</TableHead>
                  <TableHead>开奖时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLotteries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      {searchTerm ? "没有找到匹配的抽奖" : "暂无抽奖数据"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLotteries.map((lottery) => (
                    <TableRow key={lottery.id}>
                      <TableCell className="font-medium">{lottery.id}</TableCell>
                      <TableCell>{lottery.lotteryName}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            lottery.currentState === 0
                              ? "bg-green-500"
                              : lottery.currentState === 1
                                ? "bg-yellow-500"
                                : lottery.currentState === 2
                                  ? "bg-blue-500"
                                  : "bg-gray-500"
                          }
                        >
                          {lottery.currentState === 0
                            ? "进行中"
                            : lottery.currentState === 1
                              ? "开奖中"
                              : lottery.currentState === 2
                                ? "可领奖"
                                : "已结束"}
                        </Badge>
                      </TableCell>
                      <TableCell>{lottery.participantsCount}</TableCell>
                      <TableCell>{lottery.prizePool} ETH</TableCell>
                      <TableCell>{formatDateTime(lottery.drawTime)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/lottery/${lottery.id}`}>
                            <Button variant="outline" size="sm">
                              查看
                            </Button>
                          </Link>
                          {lottery.currentState === 3 ? (
                            <Button variant="outline" size="sm" disabled>
                              已结束
                            </Button>
                          ) : (
                            <Button variant="destructive" size="sm" onClick={() => openConfirmDialog(lottery)}>
                              停止
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 确认对话框 */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
              确认停止抽奖
            </DialogTitle>
            <DialogDescription>您确定要停止抽奖 "{selectedLottery?.lotteryName}" 吗？此操作不可逆。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={isStoppingLottery}>
              <X className="mr-2 h-4 w-4" />
              取消
            </Button>
            <Button variant="destructive" onClick={handleStopLottery} disabled={isStoppingLottery}>
              {isStoppingLottery ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  处理中...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  确认停止
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Admin
