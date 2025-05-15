import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/funniness
 * 接收图片和提示词，调用大模型API，返回搞笑值
 */
export async function POST(req: NextRequest) {
   try {
      // 解析请求体
      const { image } = await req.json();

      // 构造大模型API请求体
      const payload = {
         model: "doubao-1-5-lite-32k-250115",
         messages: [
            {
               role: "system",
               content:
                  "你是一个专门评判表情包搞笑程度的AI助手，你需要给出0-100的分数，越搞笑分数越高。你只需要返回数字。",
            },
            { role: "user", content: `图片数据：${image}` },
         ],
      };

      // 调用火山方舟大模型API
      const response = await fetch(
         "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               Authorization: "Bearer 88de73a6-efae-46dd-b2ba-72990041f2fe",
            },
            body: JSON.stringify(payload),
         },
      );

      if (!response.ok) {
         const err = await response.text();
         return NextResponse.json(
            { error: "大模型API调用失败", detail: err },
            { status: 500 },
         );
      }

      const data = await response.json();

      // 假设大模型返回内容在 data.choices[0].message.content
      let funniness = 0;
      if (
         data &&
         data.choices &&
         data.choices[0] &&
         data.choices[0].message &&
         data.choices[0].message.content
      ) {
         // 提取数字
         const match = data.choices[0].message.content.match(/\d+/);
         if (match) {
            funniness = Number.parseInt(match[0], 10);
         }
      }

      return NextResponse.json({ funniness });
   } catch (error) {
      return NextResponse.json(
         { error: "服务端异常", detail: String(error) },
         { status: 500 },
      );
   }
}
