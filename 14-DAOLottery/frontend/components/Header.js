"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "@/hooks/useAccount";
import { claimGovToken, hasClaimed } from "@/lib/viem";
import ConnectWallet from "./ConnectWallet";

export default function Header() {
  const { address } = useAccount();
  const pathname = usePathname();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState("");

  const handleClaim = async () => {
    if (!address) {
      setError("请先连接钱包");
      return;
    }

    setClaiming(true);
    setError("");
    try {
      await claimGovToken(address);
      setClaimed(true);
    } catch (err) {
      setError(err.message || "领取失败");
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    if (address) {
      hasClaimed(address).then((res) => {
        setClaimed(res);
      });
    }
  }, [address]);

  const isActive = (path) => pathname === path;

  return (
    <header className="w-full px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-800 bg-zinc-950 text-white">
      <div className="flex items-center justify-between w-full md:w-auto mb-2 md:mb-0">
        <h1 className="text-xl font-bold tracking-wide">🗳️ DAO 抽奖系统</h1>
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-end text-sm">
        <Link
          href="/claim"
          className={`hover:underline ${
            isActive("/claim") ? "text-yellow-400 font-semibold" : ""
          }`}
        >
          🎁 领奖
        </Link>
        <Link
          href="/profile"
          className={`hover:underline ${
            isActive("/profile") ? "text-yellow-400 font-semibold" : ""
          }`}
        >
          🧑 我的资产
        </Link>

        {/* ConnectWallet 显示链接样式 */}
        <ConnectWallet />

        {/* GOV Token 领取链接样式 */}
        {address && !claimed && (
          <span
            onClick={handleClaim}
            className="cursor-pointer hover:underline text-blue-400"
          >
            {claiming ? "领取中..." : "领取 GOV 代币"}
          </span>
        )}
        {claimed && (
          <span className="text-green-400 font-medium">已领取 GOV</span>
        )}
        {error && <span className="text-red-400">{error}</span>}
      </div>
    </header>
  );
}
