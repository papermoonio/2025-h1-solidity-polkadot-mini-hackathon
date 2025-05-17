"use client"

import { useWeb3 } from "../contexts/Web3Context"
import { Button } from "./ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { SUPPORTED_NETWORKS } from "../services/contracts"
import { AlertCircle } from "lucide-react"

export default function NetworkSwitcher() {
  const { chainId, isConnected, switchNetwork, isNetworkSupported } = useWeb3()
  
  // 如果未连接钱包，不显示
  if (!isConnected) return null
  
  const supportedNetworkIds = Object.keys(SUPPORTED_NETWORKS).map(id => Number(id))
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isNetworkSupported ? "outline" : "destructive"}
          size="sm"
          className="h-9 gap-1"
        >
          {!isNetworkSupported && <AlertCircle className="h-4 w-4" />}
          {chainId && isNetworkSupported 
            ? SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS]?.name 
            : "不支持的网络"}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end">
        {supportedNetworkIds.map(id => (
          <DropdownMenuItem 
            key={id}
            onClick={() => switchNetwork(id)}
            className="cursor-pointer"
          >
            {SUPPORTED_NETWORKS[id as keyof typeof SUPPORTED_NETWORKS].name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 