"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "./ui/button"
import { SUPPORTED_NETWORKS } from "../services/contracts"
import { useWeb3 } from "../contexts/Web3Context"
import { useToast } from "./ui/use-toast"

interface ContractErrorAlertProps {
  onRetry: () => void
}

export default function ContractErrorAlert({ onRetry }: ContractErrorAlertProps) {
  const { connectWallet, isConnected, switchNetwork } = useWeb3()
  const { toast } = useToast()
  
  // 切换网络
  const switchToNetwork = async (networkId: number) => {
    if (!isConnected) {
      await connectWallet();
    }
    
    try {
      const result = await switchNetwork(networkId);
      if (result) {
        toast({
          title: "网络切换成功",
          description: `已切换到 ${SUPPORTED_NETWORKS[networkId as keyof typeof SUPPORTED_NETWORKS].name}`,
        });
        
        // 切换成功后重试
        onRetry();
      }
    } catch (error) {
      console.error("切换网络失败:", error);
    }
  };
  
  return (
    <div className="p-5 border border-red-300 bg-red-50 rounded-lg text-red-800 mb-6">
      <div className="flex items-center mb-3">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <h3 className="font-semibold">合约连接错误</h3>
      </div>
      
      <p className="mb-4">
        无法连接到智能合约。这可能是因为：
      </p>
      
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>您当前网络上没有部署此合约</li>
        <li>合约地址错误或已更改</li>
        <li>合约ABI与实际部署的合约不匹配</li>
      </ul>
      
      <p className="mb-4">
        请尝试以下解决方案：
      </p>
      
      <div className="flex flex-col gap-2">
        <Button 
          variant="outline" 
          className="flex items-center justify-center text-red-800 border-red-300 bg-red-100 hover:bg-red-200"
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          重试加载
        </Button>
        
        <div className="mt-3">
          <p className="text-sm mb-2">或切换到已知支持的网络：</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(SUPPORTED_NETWORKS).map(id => (
              <Button 
                key={id}
                variant="outline" 
                size="sm"
                className="text-red-800 border-red-300 bg-red-100 hover:bg-red-200"
                onClick={() => switchToNetwork(Number(id))}
              >
                {SUPPORTED_NETWORKS[Number(id) as keyof typeof SUPPORTED_NETWORKS].name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 