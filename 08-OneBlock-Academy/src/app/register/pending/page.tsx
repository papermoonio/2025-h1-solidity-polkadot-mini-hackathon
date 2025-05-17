'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Pending() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const handleLogout = () => {
    disconnect(); // 断开钱包连接
    router.push('/'); // 跳转到首页
  };

  if (!isConnected) return <p>请连接钱包</p>;
  if (!address) return <p>钱包地址未找到</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">审核状态</h2>
      <p>钱包地址: {address}</p>
      <p>
        审核状态: <span className="font-semibold">正在审核中</span>
      </p>

      <Button onClick={handleLogout} className="w-full mt-4 bg-red-500 hover:bg-red-600">
        退出钱包并返回首页
      </Button>
    </div>
  );
}
