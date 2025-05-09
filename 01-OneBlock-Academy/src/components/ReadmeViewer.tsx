'use client';

import React from 'react';
import { MarkdownViewer } from '@/components/MarkdownViewer';

// 提取学习资料/课程安排部分
export const extractStudyMaterials = (markdown: string): string => {
  const match = markdown.match(/## 学习资料\/课程安排([\s\S]*?)(##|$)/);
  return match ? match[1].trim() : '未找到学习资料/课程安排';
};

// 提取打卡记录表
export const extractCheckInTable = (markdown: string): string => {
  const match = markdown.match(/<!-- START_COMMIT_TABLE -->([\s\S]*?)<!-- END_COMMIT_TABLE -->/);
  return match ? match[1].trim() : '未找到打卡记录表';
};

export const extractFirstColumn = (markdown: string): string[][] => {
  const tableContent = extractCheckInTable(markdown);
  if (tableContent === '未找到打卡记录表') return [[tableContent]];

  return tableContent
    .split('\n')
    .filter(row => row.trim().startsWith('|'))
    .map(row => row.split('|').map(col => col.trim())[1])
    .filter(col => col && col !== '-')
    .map(col => [col]);
};

interface StudyMaterialsProps {
  markdown: string;
}

export const StudyMaterials: React.FC<StudyMaterialsProps> = ({ markdown }) => {
  const extractedContent = extractStudyMaterials(markdown);
  return <MarkdownViewer markdown={extractedContent} />;
};

interface CheckInTableProps {
  markdown: string;
}

export const CheckInTable: React.FC<CheckInTableProps> = ({ markdown }) => {
  const extractedTable = extractCheckInTable(markdown);
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg p-4">
      <div className="w-full flex justify-center">
        <MarkdownViewer markdown={extractedTable} />
      </div>

    </div>
  );
};
