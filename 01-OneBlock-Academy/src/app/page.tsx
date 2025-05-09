// ./src/app/page.tsx
"use client";
import Image from 'next/image';
import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useSession, signIn } from "next-auth/react";


// Define authentication states
type AuthState = 'initial' | 'connecting' | 'signing' | 'authenticating' | 'registered' | 'pending' | 'error';

const getTitle =()=> process.env.NEXT_PUBLIC_ITEM_TITLE  || "Oneblock Academy";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const { status,data:session } = useSession();

  // More granular authentication state
  const [authState, setAuthState] = useState<AuthState>('initial');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  useEffect(() => {
    setTitle(getTitle());
  }, []);

  useEffect(() => {
    async function checkAuth() {
      if (isConnected && address) {
        try {
          // Update state to show signing in progress
          setAuthState('signing');
          
          const message = "login Oneblock";
          const signature = await signMessageAsync({ message });
          
          // Update state to show authentication in progress
          setAuthState('authenticating');

          const response = await fetch("/api/auth/signin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ address, signature }),
          });

          const data = await response.json();

          if (data.token) {
            // Successful authentication
            await signIn("credentials", {
              address,
              signature,
              redirect: false,
            });
            setAuthState('registered');
          } else if (data.status === "pending") {
            // User registration is pending
            setAuthState('pending');
            router.push("/register/pending");
          } else if (data.status === "not_found") {
            // User needs to complete registration
            setAuthState('pending');
            router.push("/register");
          } else {
            // Unexpected response
            setAuthState('error');
            setErrorMessage("Unknown authentication status");
          }
        } catch (error) {
          // Handle authentication errors
          setAuthState('error');
          setErrorMessage(error instanceof Error ? error.message : "Authentication failed");
          console.error("Auth check failed:", error);
        }
      }
    }

    if (isConnected) {
      setAuthState('connecting');
      checkAuth();
    }
  }, [isConnected, address, router, signMessageAsync]);

  useEffect(() => {
    if (status === 'authenticated' && isConnected && address && session?.user?.role) {

      const { role } = session.user;
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "teacher" || role === "assistant") {
        router.push("/teacher");
      } else if(role === "student"){
        router.push("/student");
      }
    }
  }, [status, router, isConnected, address, session]);

  // Render different UI based on authentication state
  const renderAuthContent = () => {
    switch (authState) {
      case 'initial':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="mb-4">
              <Image
                src="/logo.png"
                alt="oneblock Logo"
                width={96}
                height={96}
                priority
              />
            </div>
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            <p className="mb-6 text-gray-600">请连接钱包以继续</p>
            <ConnectWallet />
          </div>
        );

      case 'connecting':
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4">钱包连接中...</p>
              <div className="animate-spin w-10 h-10 mx-auto border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        );

      case 'signing':
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4">正在签名认证...</p>
              <div className="animate-pulse text-gray-600">请在钱包中确认签名</div>
            </div>
          </div>
        );

      case 'authenticating':
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4">认证中...</p>
              <div className="animate-spin w-10 h-10 mx-auto border-4 border-green-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        );

      case 'pending':
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4">注册处理中</p>
              <p className="text-gray-600">请完成后续注册步骤</p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4 text-red-500">认证失败</p>
              {errorMessage && <p className="text-gray-600">{errorMessage}</p>}
              <button 
                onClick={() => {
                  setAuthState('initial');
                  setErrorMessage(null);
                }} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                重新尝试
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderAuthContent();
}