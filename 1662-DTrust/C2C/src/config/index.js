// boba token
export const  STAKED_TOKEN_ADDRESS ="0x97e0c8f6643df31197fff71ced70f8288c187120";
    // process.env.NEXT_PUBLIC_STAKED_TOKEN_ADDRESS;

// bre token
export const EARNED_TOKEN_ADDRESS ="0x97e0c8f6643df31197fff71ced70f8288c187120";
    // process.env.NEXT_PUBLIC_EARNED_TOKEN_ADDRESS;

// staking address
export const stakingPoolAddresses = [
    {
        chainId: 420420421,
        stakingAddress: "0x97e0c8f6643df31197fff71ced70f8288c187120",
        depositTokenAddress: "0x97e0c8f6643df31197fff71ced70f8288c187120",
        earnedTokenAddress: "0x97e0c8f6643df31197fff71ced70f8288c187120",
    },
];

export const API_DOMAIN = process.env.NEXT_PUBLIC_SERVER_DOMAIN;

export const VALID_CHAIN_IDS = [
    // Boba Network
    288,
    // Boba Rinkeby test
    28,
    // bsc main network
    56,
    // bsc test network
    97,
];

export * from "./valid_chains";

// 0: bre pool 1: boba pool
export const STAKING_POOL_ID = 0;

export const APPROVE_STAKING_AMOUNT_ETHER = 1000000;

export const TELEGRAM_BOT_ID = process.env.NEXT_PUBLIC_TG_BOT_ID;

export const BASE_URL = "https://pancakeswap.finance";
export const BASE_BSC_SCAN_URL = "https://bscscan.com";
import { abi } from "../util/ContractVerifier.json";
export const tokenAbi = abi
export const tokenImage =
    "http://bobabrewery.oss-ap-southeast-1.aliyuncs.com/brewery_logo.jpg";

export const AIRDROP_TOKEN = "0x5FFb239d5d073CE0Ae78f984b0103d95aF656054"
export const AIRDROP_CONTRACT = "0x196006736B59acbC62f1DBbE37aE6Ed508e7AC4f"
