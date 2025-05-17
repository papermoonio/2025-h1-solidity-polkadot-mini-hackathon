"use client";

import { hasClaimed } from "@/lib/viem";
import { useEffect, useState } from "react";
export function useAccount() {
  const [address, setAddress] = useState(null);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            await hasClaimed(accounts[0]).then((res) => {
              setClaimed(res);
            });
          }
        } catch (err) {
          console.error("获取账户失败:", err);
        }
      }
    };

    checkConnection();

    // 监听账户变化
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
      } else {
        setAddress(accounts[0]);
      }
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  return { address,claimed};
}
