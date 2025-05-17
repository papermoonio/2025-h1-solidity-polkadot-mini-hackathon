// app/MetadataLayout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oneblock Academy",
  description: "Oneblock Academy",
};

export default function MetadataLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}