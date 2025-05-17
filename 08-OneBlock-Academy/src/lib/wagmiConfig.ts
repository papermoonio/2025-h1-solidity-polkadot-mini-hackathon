import { http, createConfig} from 'wagmi'
import { /* base, mainnet,optimism */Chain  } from 'wagmi/chains'
import { metaMask, walletConnect } from 'wagmi/connectors'

const projectId =process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID  || "Oneblock Academy" 
// Asset‑Hub Westend Testnet
const assetHubWestendTestnet: Chain = {
  id: 420420421,
  name: 'Asset‑Hub Westend Testnet',
 // network: 'asset-hub-westend-testnet',
  nativeCurrency: {
    name: 'Westend DOT',
    symbol: 'WND',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
    },
    public: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-asset-hub.parity-chains-scw.parity.io',
    },
    blockscout: {
      name: 'Blockscout',
      url: 'https://blockscout-asset-hub.parity-chains-scw.parity.io',
    },
  },
  testnet: true,
}

export const config = createConfig({
  chains: [/* /* base, mainnet, optimism */assetHubWestendTestnet],
  connectors: [

    walletConnect({ projectId }),
    metaMask(),

  ],
  transports: {
  //  [mainnet.id]: http(),
  //  [base.id]: http(),
    [assetHubWestendTestnet.id]: http(),
  },
})
