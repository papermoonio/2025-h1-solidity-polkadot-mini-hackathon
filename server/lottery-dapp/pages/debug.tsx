import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { SUPPORTED_NETWORKS, LOTTERY_FACTORY_ADDRESS } from "../services/contracts";
import LotteryFactoryABI from "../abis/LotteryFactory.json";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

// 备用RPC列表
const BACKUP_RPCS = {
  1287: [
    "https://moonbeam-alpha.api.onfinality.io/public",
    "https://moonbase-alpha.public.blastapi.io",
    "https://moonbase.unitedbloc.com:1000"
  ]
};

export default function DebugPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [selectedNetwork, setSelectedNetwork] = useState<number>(1287);
  const [customRpc, setCustomRpc] = useState("");
  const [useCustomRpc, setUseCustomRpc] = useState(false);
  const [methodToTest, setMethodToTest] = useState("getAllLotteryIds");
  const [methodArgs, setMethodArgs] = useState("");
  
  // 基础模式测试结果
  const [basicTestResults, setBasicTestResults] = useState<{
    networkConnected: boolean | null;
    contractFound: boolean | null;
    factoryMethods: boolean | null;
    message: string | null;
  }>({
    networkConnected: null,
    contractFound: null,
    factoryMethods: null,
    message: null
  });

  // 执行基础连接测试
  const runBasicTest = async () => {
    setLoading(true);
    setBasicTestResults({
      networkConnected: null,
      contractFound: null,
      factoryMethods: null,
      message: null
    });
    
    try {
      // 第1步：测试网络连接
      const network = SUPPORTED_NETWORKS[selectedNetwork];
      if (!network) {
        throw new Error("网络不支持");
      }
      
      const rpcUrl = useCustomRpc && customRpc ? customRpc : network.rpcUrl;
      console.log(`使用网络: ${network.name}, RPC: ${rpcUrl}`);
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const networkInfo = await provider.getNetwork();
      console.log("网络信息:", networkInfo);
      
      setBasicTestResults(prev => ({
        ...prev,
        networkConnected: true
      }));
      
      // 第2步：检测合约代码是否存在
      const contractCode = await provider.getCode(LOTTERY_FACTORY_ADDRESS);
      const contractExists = contractCode !== '0x';
      console.log("合约代码:", contractCode.substring(0, 50) + "...");
      
      setBasicTestResults(prev => ({
        ...prev,
        contractFound: contractExists
      }));
      
      if (!contractExists) {
        setBasicTestResults(prev => ({
          ...prev,
          message: `合约在地址 ${LOTTERY_FACTORY_ADDRESS} 上不存在`
        }));
        return;
      }
      
      // 第3步：尝试调用一个简单方法
      try {
        const contract = new ethers.Contract(LOTTERY_FACTORY_ADDRESS, LotteryFactoryABI.abi, provider);
        
        // 检查合约是否有owner方法
        let ownerAddress = "未知";
        try {
          if (typeof contract.owner === 'function') {
            ownerAddress = await contract.owner();
            console.log("合约拥有者:", ownerAddress);
          } else {
            console.log("合约没有owner方法，尝试getAllLotteryIds方法");
            // 尝试调用另一个方法
            const lotteryIds = await contract.getAllLotteryIds();
            console.log("抽奖ID列表:", lotteryIds);
          }
        } catch (ownerError) {
          console.error("调用owner方法失败:", ownerError);
          // 尝试调用另一个方法
          try {
            const lotteryIds = await contract.getAllLotteryIds();
            console.log("抽奖ID列表:", lotteryIds);
          } catch (idsError) {
            console.error("调用getAllLotteryIds也失败:", idsError);
            throw new Error("所有合约方法调用都失败");
          }
        }
        
        setBasicTestResults(prev => ({
          ...prev,
          factoryMethods: true,
          message: `连接成功！${ownerAddress !== "未知" ? `合约拥有者: ${ownerAddress}` : '合约可调用'}`
        }));
      } catch (methodError) {
        console.error("调用方法失败:", methodError);
        setBasicTestResults(prev => ({
          ...prev,
          factoryMethods: false,
          message: `合约存在但调用方法失败: ${methodError instanceof Error ? methodError.message : String(methodError)}`
        }));
      }
      
    } catch (error) {
      console.error("基础测试失败:", error);
      setBasicTestResults({
        networkConnected: false,
        contractFound: null,
        factoryMethods: null,
        message: `连接失败: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setLoading(false);
    }
  };

  const testContract = async () => {
    setLoading(true);
    try {
      const network = SUPPORTED_NETWORKS[selectedNetwork];
      if (!network) {
        throw new Error("网络不支持");
      }
      
      const rpcUrl = useCustomRpc && customRpc ? customRpc : network.rpcUrl;
      console.log(`使用网络: ${network.name}, RPC: ${rpcUrl}`);
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const networkInfo = await provider.getNetwork();
      console.log("网络信息:", networkInfo);
      
      // 检查合约代码
      const contractCode = await provider.getCode(LOTTERY_FACTORY_ADDRESS);
      console.log("合约代码:", contractCode.substring(0, 50) + "...");
      
      if (contractCode === '0x') {
        throw new Error(`合约在地址 ${LOTTERY_FACTORY_ADDRESS} 上不存在`);
      }
      
      // 测试基本方法调用
      const contract = new ethers.Contract(LOTTERY_FACTORY_ADDRESS, LotteryFactoryABI.abi, provider);
      
      // 检查合约是否有owner方法
      let ownerAddress = "未知";
      try {
        if (typeof contract.owner === 'function') {
          ownerAddress = await contract.owner();
          console.log("合约拥有者:", ownerAddress);
        } else {
          console.log("合约没有owner方法，尝试getAllLotteryIds方法");
          // 尝试调用另一个方法
          const lotteryIds = await contract.getAllLotteryIds();
          console.log("抽奖ID列表:", lotteryIds);
        }
      } catch (ownerError) {
        console.error("调用owner方法失败:", ownerError);
        // 尝试调用另一个方法
        const lotteryIds = await contract.getAllLotteryIds();
        console.log("抽奖ID列表:", lotteryIds);
      }
      
      setResults({
        network: network.name,
        chainId: networkInfo.chainId,
        contractExists: true,
        contractOwner: ownerAddress
      });
    } catch (error) {
      console.error("测试合约失败:", error);
      setResults({
        error: true,
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const testMethod = async () => {
    setLoading(true);
    try {
      const network = SUPPORTED_NETWORKS[selectedNetwork];
      if (!network) {
        throw new Error("网络不支持");
      }
      
      const rpcUrl = useCustomRpc && customRpc ? customRpc : network.rpcUrl;
      console.log(`使用网络: ${network.name}, RPC: ${rpcUrl}`);
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await provider.getNetwork();
      
      const contract = new ethers.Contract(LOTTERY_FACTORY_ADDRESS, LotteryFactoryABI.abi, provider);
      
      // 获取函数选择器
      let selector = "";
      try {
        selector = contract.interface.getFunction(methodToTest)?.selector || "";
        console.log(`${methodToTest}方法的选择器:`, selector);
      } catch (err) {
        console.error("获取函数选择器失败:", err);
      }
      
      // 解析参数
      let args = [];
      if (methodArgs.trim()) {
        try {
          args = JSON.parse(`[${methodArgs}]`);
        } catch (err) {
          console.error("参数解析失败:", err);
        }
      }
      
      // 调用方法
      let result;
      try {
        console.log(`调用${methodToTest}方法，参数:`, args);
        if (args.length > 0) {
          result = await contract[methodToTest].staticCall(...args);
        } else {
          result = await contract[methodToTest].staticCall();
        }
        console.log("方法调用成功:", result);
      } catch (err) {
        console.error("方法调用失败:", err);
        
        // 尝试低级调用
        try {
          const data = args.length > 0 
            ? contract.interface.encodeFunctionData(methodToTest, args)
            : selector;
            
          console.log("尝试低级调用，数据:", data);
          const rawResult = await provider.call({
            to: LOTTERY_FACTORY_ADDRESS,
            data
          });
          console.log("低级调用结果:", rawResult);
          result = rawResult;
        } catch (lowLevelErr) {
          console.error("低级调用也失败:", lowLevelErr);
          throw err; // 抛出原始错误
        }
      }
      
      setResults({
        method: methodToTest,
        args: args,
        result: result ? (typeof result === 'object' ? JSON.stringify(result) : result) : "无结果"
      });
    } catch (error) {
      console.error("测试方法失败:", error);
      setResults({
        error: true,
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  // 状态图标渲染
  const renderStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle className="h-5 w-5 text-gray-400" />;
    return status ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">合约调试页面</h1>
        
        <Tabs defaultValue="basic" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">基础模式</TabsTrigger>
            <TabsTrigger value="advanced">高级模式</TabsTrigger>
          </TabsList>
          
          {/* 基础模式内容 */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>快速连接测试</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">选择网络</h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(SUPPORTED_NETWORKS).map(([id, network]) => (
                      <Button
                        key={id}
                        variant={selectedNetwork === Number(id) ? "default" : "outline"}
                        onClick={() => setSelectedNetwork(Number(id))}
                      >
                        {network.name}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="useCustomRpc" 
                        checked={useCustomRpc}
                        onChange={e => setUseCustomRpc(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="useCustomRpc">使用自定义RPC URL</Label>
                    </div>
                    
                    {useCustomRpc && (
                      <div className="mt-2">
                        <Input
                          placeholder="输入RPC URL"
                          value={customRpc}
                          onChange={(e) => setCustomRpc(e.target.value)}
                          className="w-full max-w-xl"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={runBasicTest} 
                  disabled={loading}
                  size="lg"
                  className="mb-6"
                >
                  {loading ? "测试中..." : "开始测试"}
                </Button>
                
                {/* 测试结果显示 */}
                <div className="space-y-4 mt-4">
                  <div className="flex items-center space-x-3">
                    {renderStatusIcon(basicTestResults.networkConnected)}
                    <span>测试网络连接</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {renderStatusIcon(basicTestResults.contractFound)}
                    <span>检测合约存在性</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {renderStatusIcon(basicTestResults.factoryMethods)}
                    <span>调用合约方法</span>
                  </div>
                </div>
                
                {basicTestResults.message && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                      <h3 className="font-medium">测试结果</h3>
                    </div>
                    <p className="mt-2 text-sm">{basicTestResults.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 高级模式内容 */}
          <TabsContent value="advanced">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">选择网络</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(SUPPORTED_NETWORKS).map(([id, network]) => (
                  <Button
                    key={id}
                    variant={selectedNetwork === Number(id) ? "default" : "outline"}
                    onClick={() => setSelectedNetwork(Number(id))}
                  >
                    {network.name}
                  </Button>
                ))}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="useCustomRpc" 
                    checked={useCustomRpc}
                    onChange={e => setUseCustomRpc(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="useCustomRpc">使用自定义RPC URL</Label>
                </div>
                
                {useCustomRpc && (
                  <div className="mt-2">
                    <Input
                      placeholder="输入RPC URL"
                      value={customRpc}
                      onChange={(e) => setCustomRpc(e.target.value)}
                      className="w-full max-w-xl"
                    />
                  </div>
                )}
              </div>
              
              <div className="mb-2">
                <h3 className="font-medium">当前RPC URL:</h3>
                <code className="bg-muted p-2 rounded text-sm block mt-1">
                  {useCustomRpc && customRpc ? customRpc : SUPPORTED_NETWORKS[selectedNetwork]?.rpcUrl}
                </code>
              </div>
            </div>
            
            <div className="mb-8">
              <Button 
                onClick={testContract} 
                disabled={loading}
                size="lg"
              >
                {loading ? "测试中..." : "测试合约连接"}
              </Button>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">测试合约方法</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="methodName">方法名称</Label>
                  <Input
                    id="methodName"
                    value={methodToTest}
                    onChange={(e) => setMethodToTest(e.target.value)}
                    placeholder="例如: getAllLotteryIds"
                    className="max-w-md"
                  />
                </div>
                
                <div>
                  <Label htmlFor="methodArgs">方法参数 (逗号分隔的JSON格式)</Label>
                  <Input
                    id="methodArgs"
                    value={methodArgs}
                    onChange={(e) => setMethodArgs(e.target.value)}
                    placeholder='例如: "0x123", 100'
                    className="max-w-md"
                  />
                </div>
                
                <Button 
                  onClick={testMethod}
                  disabled={loading}
                >
                  {loading ? "测试中..." : "测试方法"}
                </Button>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">常用方法</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => { 
                  setMethodToTest("getLotteryInstanceAddress"); 
                  setMethodArgs('"test-id-1"');
                }}>
                  getLotteryInstanceAddress
                </Button>
                
                <Button variant="outline" onClick={() => { 
                  setMethodToTest("owner"); 
                  setMethodArgs('');
                }}>
                  owner
                </Button>
                
                <Button variant="outline" onClick={() => { 
                  setMethodToTest("isLotteryIdUsed"); 
                  setMethodArgs('"test-id-1"');
                }}>
                  isLotteryIdUsed
                </Button>
              </div>
            </div>
            
            {Object.keys(results).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>测试结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 