import { useState } from 'react';
import { MarkdownViewer } from '@/components/MarkdownViewer';

interface CheckInListProps {
  markdown: string;
}

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
    .slice(1) // 跳过第一行
    .map(row => row.match(/\[(.*?)\]/)?.[1]) // 仅提取 `[]` 中的内容
    .filter(Boolean) // 过滤掉空值
    .map(col => [col!]);
};

export const CheckInList: React.FC<CheckInListProps> = ({ markdown }) => {
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (name: string) => {
    setSelectedName(name);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/file?name=${name}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setNotes(data.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const firstColumn = extractFirstColumn(markdown);

  return selectedName ? (
    <div>
      <div className="flex justify-end">
        <button
          onClick={() => setSelectedName(null)}
          className="mb-4 rounded-lg bg-blue-500 px-4 py-2 text-white shadow-md hover:bg-blue-600 transition"
        >
          返回
        </button>
      </div>
      {loading ? (
        <p className="text-xl font-semibold text-gray-700 text-center">学习笔记加载中...</p>
      ) : error ? (
        <p className="text-xl font-semibold text-red-500 text-center">错误: {error}</p>
      ) : (
        <div>
          <MarkdownViewer markdown={notes} />
          <div className="flex justify-end">
            <button
              onClick={() => setSelectedName(null)}
              className="mb-4 rounded-lg bg-blue-500 px-4 py-2 text-white shadow-md hover:bg-blue-600 transition"
            >
              返回
            </button>
          </div>
        </div>
      )}

    </div>
  ) : (
    <div className="flex justify-center">
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 w-full max-w-5xl">
        {firstColumn.map(([name], index) => (
          <li key={index}>
            <button
              onClick={() => handleClick(name)}
              className="w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-700 shadow-md hover:bg-gray-300 transition"
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
    </div>

  );
};
