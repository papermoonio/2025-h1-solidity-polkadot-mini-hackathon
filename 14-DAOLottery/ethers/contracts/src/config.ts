import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// 从项目根目录加载.env文件
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

export const config = {
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: process.env.RPC_URL
};