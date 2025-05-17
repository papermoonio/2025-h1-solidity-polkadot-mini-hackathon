"use client";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider,createConfig } from "wagmi";
import { http } from "viem";
import {
    mantleSepoliaTestnet,
    // mainnet,
    // polygon,
    // optimism,
    // arbitrum,
    // optimismSepolia,
    // bscTestnet,
    // baseGoerli,
} from "wagmi/chains";

/*
// 定义自定义链 MatrixNet
const matrixNet = defineChain({
    id: 1337, // 你需要确认 MatrixNet 的 Chain ID
    name: "MatrixNet",
    network: "matrixnet",
    rpcUrls: {
        default: { http: ["https://ethereum.matrix-net.tech/"] },
        public: { http: ["https://ethereum.matrix-net.tech/"] },
    },
    nativeCurrency: {
        decimals: 18,
        name: "MatrixNet ETH",
        symbol: "ETH",
    },
    blockExplorers: {
        default: { 
            name: "MatrixNet Explorer", 
            url: "https://explorer.matrix-net.tech/" 
        },
    },
});
*/

const chains = [
    // mainnet, 
    // polygon, 
    // optimism, 
    // arbitrum,
    // matrixNet, 
    mantleSepoliaTestnet
] as const;

const projectId = "3fbb6bba6f1de962d911bb5b5c9dba88";

const { connectors } = getDefaultWallets({
    appName: "Web3 Demo",
    projectId,
});

const config = createConfig({
    chains,
    transports: {
        [mantleSepoliaTestnet.id]: http(), 
        // [mainnet.id]: http(),
        // [polygon.id]: http(),
        // [optimism.id]: http(),
        // [arbitrum.id]: http(),
        // [matrixNet.id]: http(),
        // [optimismSepolia.id]: http(),
        // [bscTestnet.id]: http(),
        // [baseGoerli.id]: http(),
    },
    ssr: true,
    connectors,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient} >
                <RainbowKitProvider locale="zh-CN" initialChain={mantleSepoliaTestnet}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
