import { IconBobaNetwork, IconBNB, IconEth } from "@src/components/icons";
const RPC_URL = 'https://westend-asset-hub-eth-rpc.polkadot.io';
export const VALID_CHAINS = [
  {
  chainId:420420421, // ❗ 示例 Chain ID, 请替换为 Westend Asset Hub 的实际 Chain ID
  name: 'Westend Asset Hub',
  nativeCurrency: { name: 'Westend Dot', symbol: 'WND', decimals: 18 }, // ❗ 示例原生代币, 请核实并替换
  rpcUrls: { 
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  // {
  //   name: "Boba Network",
  //   logo: IconBobaNetwork,
  //   chainId: 288,
  //   shortName: "Boba",
  //   networkId: 288,
  //   nativeCurrency: {
  //     name: "Ether",
  //     symbol: "ETH",
  //     decimals: 18,
  //   },
  //   rpc: ["https://mainnet.boba.network/"],
  //   faucets: [],
  //   infoURL: "https://boba.network",
  // },
  //   {
  //      "name":"Boba Network Rinkeby Testnet",
  //    //   "name":"Boba Network",
  //      "logo": IconBobaNetwork,
  //      "chainId":28,
  //      "shortName":"Boba Rinkeby",
  //      "networkId":28,
  //      "nativeCurrency":{
  //         "name":"Ether",
  //         "symbol":"ETH",
  //         "decimals":18
  //      },
  //      "rpc":[
  //         "https://rinkeby.boba.network/"
  //      ],
  //      "faucets":[

  //      ],
  //      "infoURL":"https://boba.network"
  //   },
  // {
  //   name: "Binance Smart Chain",
  //   chainId: 56,
  //   shortName: "bnb",
  //   networkId: 56,
  //   nativeCurrency: {
  //     name: "Binance Chain Native Token",
  //     symbol: "BNB",
  //     decimals: 18,
  //   },
  //   rpc: [
  //     "https://bsc-dataseed1.binance.org",
  //     "https://bsc-dataseed2.binance.org",
  //     "https://bsc-dataseed3.binance.org",
  //     "https://bsc-dataseed4.binance.org",
  //     "https://bsc-dataseed1.defibit.io",
  //     "https://bsc-dataseed2.defibit.io",
  //     "https://bsc-dataseed3.defibit.io",
  //     "https://bsc-dataseed4.defibit.io",
  //     "https://bsc-dataseed1.ninicoin.io",
  //     "https://bsc-dataseed2.ninicoin.io",
  //     "https://bsc-dataseed3.ninicoin.io",
  //     "https://bsc-dataseed4.ninicoin.io",
  //     "wss://bsc-ws-node.nariox.org",
  //   ],
  //   faucets: ["https://free-online-app.com/faucet-for-eth-evm-chains/"],
  //   infoURL: "https://www.binance.org",
  // },
  //   {
  //      "name":"Binance Smart Chain Testnet",
  //    //   "name":"Binance Smart Chain",
  //      "logo": IconBNB,
  //      "chainId":97,
  //      "shortName":"bnbt",
  //      "networkId":97,
  //      "nativeCurrency":{
  //         "name":"Binance Chain Native Token",
  //         "symbol":"tBNB",
  //         "decimals":18
  //      },
  //      "rpc":[
  //         "https://data-seed-prebsc-1-s1.binance.org:8545",
  //         "https://data-seed-prebsc-2-s1.binance.org:8545",
  //         "https://data-seed-prebsc-1-s2.binance.org:8545",
  //         "https://data-seed-prebsc-2-s2.binance.org:8545",
  //         "https://data-seed-prebsc-1-s3.binance.org:8545",
  //         "https://data-seed-prebsc-2-s3.binance.org:8545"
  //      ],
  //      "faucets":[
  //         "https://testnet.binance.org/faucet-smart"
  //      ],
  //      "infoURL":"https://testnet.binance.org/"
  //   }
}];
