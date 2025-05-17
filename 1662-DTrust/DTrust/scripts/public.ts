import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http } from 'viem';

const privateKey = '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133';
const account = privateKeyToAccount(privateKey);

console.log('地址:', account.address);
console.log('公钥:', account.publicKey);

// 如果您想查询余额，可以添加以下代码
async function checkBalance() {
  const client = createPublicClient({
    transport: http('https://westend-asset-hub-eth-rpc.polkadot.io')
  });
  
  const balance = await client.getBalance({
    address: account.address,
  });
  
  console.log('余额:', balance);
}

// 调用函数查询余额
checkBalance().catch(console.error);
