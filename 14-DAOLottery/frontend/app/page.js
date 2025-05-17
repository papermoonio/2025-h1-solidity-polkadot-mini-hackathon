"use client";

import ProposalList from "@/components/ProposalList";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col">

      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            🎯 当前提案
          </h1>
          <Link
            href="/create"
            className="text-lg text-blue-400 hover:underline transition"
          >
            🤖 发布提案
          </Link>
        </div>
        <ProposalList />
      </section>
    </main>
  );
}
