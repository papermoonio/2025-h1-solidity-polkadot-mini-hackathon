import { put } from "@vercel/blob";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return new Response("No file uploaded", { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        return new Response("Missing BLOB_READ_WRITE_TOKEN", { status: 500 });
    }

    // 上传到 Vercel Blob
    const blob = await put(file.name, file, { access: "public", token });

    return new Response(JSON.stringify({ url: blob.url }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
