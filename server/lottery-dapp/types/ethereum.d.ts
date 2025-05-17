// ethereum.d.ts
import { Eip1193Provider } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      selectedAddress?: string;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    }
  }
}

interface ImportMetaEnv {
  VITE_LOTTERY_FACTORY_ADDRESS: string;
  VITE_LOCAL_FACTORY_ADDRESS: string;
}

export {}; 