"use client";

import { useState } from "react";
import { createProposal } from "@/lib/viem"; // 
import { useAccount } from "@/hooks/useAccount"; // 

export default function CreateProposalPage() {
  const [description, setDescription] = useState("");
  // const [duration, setDuration] = useState(60 * 60 * 24); // 默认一天（秒）
  const [duration, setDuration] = useState(60 * 2); // 默认一天（秒）
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const { address } = useAccount(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await createProposal(address,description, duration);
      setMessage("✅ 提案发布成功！");
      setDescription("");
    } catch (err) {
      console.error(err);
      setMessage("❌ 发布失败，请检查是否连接钱包和拥有足够代币。");
    }
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">📜 发起新提案</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <div>
          <label className="block mb-2 text-lg font-semibold">提案描述</label>
          <textarea
            className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700"
            rows={5}
            placeholder="例如：建议本期黑客松主题为环保宣传"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-lg font-semibold">投票时长（秒）</label>
          <input
            type="number"
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            min={60}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded font-semibold"
        >
          {isSubmitting ? "提交中..." : "提交提案"}
        </button>

        {message && <p className="mt-4 text-lg">{message}</p>}
      </form>
    </main>
  );
}
