// app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { checkWalletAuth } from "@/lib/db/query/authdb";

export async function POST(req: NextRequest) {
  try {
    const { address, signature } = await req.json();
    
    if (!address || !signature) {
      return NextResponse.json({ status: "error", message: "Missing credentials" }, { status: 400 });
    }
    
    // 验证签名
    const message = "login Oneblock";
    const isValidSignature = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    
    if (!isValidSignature) {
      return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 401 });
    }
    
    // 检查用户是否存在及其状态
    const registertext =checkWalletAuth(address);
    
    const user = registertext
    //console.log(user)
    
    if (user.success === false) {
      return NextResponse.json({ status: "not_found" });
    }
    
    if (user.success === true && user.role==="student" ) {
      return NextResponse.json({ status: "approved", token: true });
    } else if (user.success === true && user.role==="admin") {
      return NextResponse.json({ status: "approved", token: true });
    }
    else if (user.success === true && user.role==="teacher") {
      return NextResponse.json({ status: "approved", token: true });
    }
    else if (user.success === true && user.role==="assistant") {
      return NextResponse.json({ status: "approved", token: true });
    }
      else if (user.success === true && user.role==="pending") {
      return NextResponse.json({ status: "pending" });
    } else if (user.success === true ) {
      return NextResponse.json({ status: "rejected" });
    } else {
      return NextResponse.json({ status: "unknown" });
    }
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json({ status: "error", message: "Server error" }, { status: 500 });
  }
}