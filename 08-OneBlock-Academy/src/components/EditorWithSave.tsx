import React, { useState, useRef, useEffect } from 'react';
import { MarkdownEditor } from '@/components/MarkdownEditor';
//import { MarkdownViewer } from '@/components/MarkdownViewer';

interface EditorWithSaveProps {
  initialMarkdown?: string;
  address?: string;
  setMarkdown: (markdown: string) => void;
}

const EditorWithSave: React.FC<EditorWithSaveProps> = ({
  initialMarkdown,
  address,
  setMarkdown
}) => {
  const [markdown, localSetMarkdown] = useState(initialMarkdown || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    localSetMarkdown(initialMarkdown || '');
  }, [initialMarkdown]);

  const handleMarkdownChange = (newMarkdown: string) => {
    localSetMarkdown(newMarkdown); // 更新本地状态
    setMarkdown(newMarkdown); // 同步到上层 useMarkdown
  };

  // 组件卸载时更新 isMounted 标志
/*   useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
 */
  const handleSave = async () => {
    if (!address || isSaving || !isMounted.current) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/save?address=${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: markdown }),
      });

      if (response.ok && isMounted.current) {
        setSaveSuccess(true);
        setTimeout(() => {
          if (isMounted.current) setSaveSuccess(false);
        }, 3000);
      } else {
        throw new Error('Failed to save data');
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      if (isMounted.current) {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 主体部分（编辑器 & 预览器） */}
      <div className="flex  min-h-0">
        {/* 编辑区 */}
        <div className="w-full p-4 flex flex-col min-h-0">
          <div className=" min-h-100">
            <MarkdownEditor value={markdown} onChange={ handleMarkdownChange} />
          </div>
        </div>
{/* 
        {/* 预览区 
        <div className="w-1/2 p-4 border-l flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <MarkdownViewer markdown={markdown} />
          </div>
        </div> */}

      </div>

      {/* 保存按钮区域 */}
      <div className="flex justify-center p-4 bg-white border-t">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 px-4 rounded"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
        {error && <div className="text-red-500 ml-4">{error}</div>}
      </div>

      {saveSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-30 z-50">
          <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg">
            保存成功!
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorWithSave;