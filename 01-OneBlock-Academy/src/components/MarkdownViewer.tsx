'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { ScrollArea } from "@/components/ui/scroll-area";

import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';
import 'github-markdown-css/github-markdown-light.css';

interface MarkdownViewerProps {
  markdown: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ markdown }) => {
  return (
    <div className="w-full h-full">
      <ScrollArea className="h-full w-full border border-gray-200 rounded-lg">
        <div className="markdown-body p-4 ">
          <ReactMarkdown
            remarkPlugins={[ remarkGfm,remarkBreaks, remarkMath]} // 保证 GFM 插件启用 remarkBreaks, remarkMath remarkGfm
            rehypePlugins={[rehypeKatex, rehypeRaw, rehypeHighlight]} //rehypeKatex, rehypeRaw, rehypeHighlight
            components={{
              ol: ({ children, ...props }) => (
                <ol className="list-decimal pl-6" {...props}>
                  {children}
                </ol>
              ),
              ul: ({ children, ...props }) => (
                <ul className="list-disc pl-6" {...props}>
                  {children}
                </ul>
              ),
              table: ({ children }) => (
                <table className="w-full flex justify-center border-collapse border border-gray-300">
                  {children}
                </table>
              ),
              thead: ({ children }) => (
                <thead className="bg-gray-100 border-b border-gray-300">{children}</thead>
              ),
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => <tr className="border-b border-gray-300">{children}</tr>,
              th: ({ children }) => (
                <th className="border border-gray-300 px-4 py-2 bg-gray-200 text-left">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-300 px-4 py-2">{children}</td>
              )
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </ScrollArea>
    </div>
  );
};
