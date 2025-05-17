// app/api/ERC721/meta/[id]/route.ts
import { /* NextRequest,  */NextResponse } from 'next/server';

export async function GET(
 /*  req: NextRequest,
  context: { params: { id?: string} } */
) {
/*   const { id } = context.params;

  // 使用一下 req 避免 eslint 报错
  console.log("Received ID:", id);
  req.headers.get("user-agent");
 */
  const metadata = {

    description: "oneblock",
    image: "https://oneblock-academy.netlify.app/logo2.jpg",
    name: "oneblock",
  };

  return NextResponse.json(metadata);
}
