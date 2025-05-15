import { burnNFTOnChain, mintNFT } from "@/lib/nft";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { nftImages } from "../../db/schema";
import { createTRPCRouter, publicProcedure } from "../trpc";

/**
 * NFT相关的tRPC路由
 * 处理NFT图片的读写操作
 */
export const nftRouter = createTRPCRouter({
   /**
    * 获取指定钱包地址拥有的所有NFT
    */
   getNFTsByOwner: publicProcedure
      .input(
         z.object({
            ownerAddress: z.string(),
         }),
      )
      .query(async ({ ctx, input }) => {
         try {
            const userNFTs = await ctx.db
               .select()
               .from(nftImages)
               .where(eq(nftImages.ownerAddress, input.ownerAddress));

            return userNFTs;
         } catch (error) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "获取NFT列表失败",
               cause: error,
            });
         }
      }),

   /**
    * 获取单个NFT的详细信息
    */
   getNFTById: publicProcedure
      .input(
         z.object({
            tokenId: z.number(), // 保持为number类型
         }),
      )
      .query(async ({ ctx, input }) => {
         try {
            const nft = await ctx.db
               .select()
               .from(nftImages)
               .where(eq(nftImages.tokenId, input.tokenId)) // 这里会自动转换类型
               .limit(1);

            if (!nft.length) {
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "NFT不存在",
               });
            }

            return nft[0];
         } catch (error) {
            if (error instanceof TRPCError) throw error;
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "获取NFT详情失败",
               cause: error,
            });
         }
      }),

   /**
    * 创建新的NFT
    */
   createNFT: publicProcedure
      .input(
         z.object({
            tokenId: z.number(),
            ownerAddress: z.string(),
            imageData: z.string(),
            name: z.string(),
            description: z.string().optional(),
            rarity: z.number().min(0).max(100),
            power: z.number().min(0),
            signature: z.string(),
            message: z.string(),
            messageHash: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            // 1. 先在链上铸造NFT
            const response = await mintNFT(
               input.ownerAddress,
               input.power, // 添加power参数
            );
            if (response.status !== "success") {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "链上铸造NFT失败",
               });
            }
            // 2. 将NFT信息存入数据库
            const newNFT = await ctx.db
               .insert(nftImages)
               .values({
                  tokenId: input.tokenId,
                  ownerAddress: input.ownerAddress,
                  imageData: input.imageData,
                  name: input.name,
                  description: input.description,
                  rarity: input.rarity,
                  power: input.power,
               })
               .returning();

            // 3. 生成JWT令牌
            if (!process.env.JWT_SECRET) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "JWT密钥未配置",
               });
            }

            const token = jwt.sign(
               {
                  address: input.ownerAddress,
                  tokenId: response.transactionHash,
               },
               process.env.JWT_SECRET,
               {
                  expiresIn: "1d",
                  algorithm: "HS256", // 显式指定算法
               },
            );

            return {
               ...newNFT[0],
               token,
            };
         } catch (error) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "创建NFT失败",
               cause: error,
            });
         }
      }),

   /**
    * 更新NFT所有者
    */
   updateNFTOwner: publicProcedure
      .input(
         z.object({
            tokenId: z.number(), // 保持为number类型
            newOwnerAddress: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const updatedNFT = await ctx.db
               .update(nftImages)
               .set({
                  ownerAddress: input.newOwnerAddress,
                  updatedAt: Math.floor(Date.now() / 1000),
               })
               .where(eq(nftImages.tokenId, Number(input.tokenId)))
               .returning();

            if (!updatedNFT.length) {
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "NFT不存在",
               });
            }

            return updatedNFT[0];
         } catch (error) {
            if (error instanceof TRPCError) throw error;
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "更新NFT所有者失败",
               cause: error,
            });
         }
      }),

   /**
    * 删除指定的NFT
    * 只有NFT的所有者才能删除。
    * 此操作会先从数据库中移除记录，然后（未来实现）在区块链上销毁NFT。
    * @param {object} input - 输入参数
    * @param {string} input.tokenId - 要删除的NFT的Token ID (链上ID)
    * @param {string} input.ownerAddress - 发起删除请求的用户钱包地址
    * @param {string} input.signature - 用户对删除操作的签名
    * @param {string} input.message - 签名的原始消息
    * @param {string} input.messageHash - 原始消息的哈希
    * @returns {Promise<{success: boolean, message: string}>} 操作成功状态和消息
    */
   deleteNFT: publicProcedure
      .input(
         z.object({
            tokenId: z.number(), // 保持为number类型
            ownerAddress: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         // 步骤 1: 验证用户签名 (重要！)
         // 此处应实现验证逻辑，确保 input.signature 是 input.ownerAddress 对 input.message 或 input.messageHash 的有效签名。
         // 例如:
         // const isValidSignature = await verifyMessage({
         //   address: input.ownerAddress as `0x${string}`,
         //   message: input.message, // 或者根据您前端签名的方式
         //   signature: input.signature as `0x${string}`
         // });
         // if (!isValidSignature) {
         //   throw new TRPCError({ code: "UNAUTHORIZED", message: "签名验证失败，无权删除" });
         // }

         try {
            // 步骤 2: 检查NFT是否存在且属于该用户
            const nft = await ctx.db
               .select()
               .from(nftImages)
               .where(eq(nftImages.tokenId, input.tokenId))
               .limit(1); // 限制返回结果为1条记录

            if (!nft.length) {
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "NFT不存在",
               });
            }

            if (
               nft[0]?.ownerAddress.toLowerCase() !==
               input.ownerAddress.toLowerCase()
            ) {
               throw new TRPCError({
                  code: "FORBIDDEN",
                  message: "您不是该NFT的所有者，无权删除",
               });
            }

            // 步骤 3: 从链上删除NFT
            // 这里需要调用链上的合约方法来销毁NFT
            const receipt = await burnNFTOnChain(input.tokenId);
            if (receipt.status !== "success") {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "链上销毁NFT失败",
               });
            }
            // 步骤 4: 从数据库中删除NFT
            const deletedDBRecord = await ctx.db
               .delete(nftImages)
               .where(eq(nftImages.tokenId, input.tokenId))
               .returning();

            if (!deletedDBRecord.length) {
               // 理论上，如果前面的检查通过了，这里不应该发生
               // 但作为防御性编程，可以保留
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "从数据库删除NFT记录失败",
               });
            }

            // 步骤 4: 在区块链上销毁NFT (重要！)
            // 注意：这通常需要后端有权操作合约或引导用户通过钱包签名销毁交易。
            // 这里的实现方式取决于您的架构。
            // 如果后端直接操作（例如管理员钱包），需要配置私钥并确保安全。
            // 更安全的方式可能是后端准备好交易数据，前端通过用户钱包签名并发送。
            // 假设有一个 burnNFTOnChain 函数，它需要 tokenId。
            // 您需要确保 burnNFTOnChain 函数已在 "@/lib/nft" 中正确实现。
            // const burnReceipt = await burnNFTOnChain(input.tokenId, input.ownerAddress); // ownerAddress 可能需要是签名者或管理员
            // console.log('NFT burn transaction receipt:', burnReceipt);
            console.log(
               `NFT ${input.tokenId} 已从数据库删除，链上销毁操作待实现或已触发`,
            );

            return { success: true, message: "NFT已成功从数据库删除" };
         } catch (error) {
            if (error instanceof TRPCError) throw error;
            console.error("删除NFT失败:", error);
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "删除NFT失败",
               cause: error,
            });
         }
      }),
});
