'use client';

import { useState, useEffect } from 'react';
import { CourseContent } from '@/lib/db/query/courseContents';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AnnouncementViewer() {
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'announcement' | 'resource'>('all');

  useEffect(() => {
    fetchContents();
  }, []);

  async function fetchContents() {
    try {
      const res = await fetch('/api/student/course');
      const json = await res.json();
      if (!json.success) {
        console.error('获取内容失败：', json.error);
        return;
      }
      const allContents = json.data as CourseContent[];
      setContents(allContents);
    } catch (error) {
      console.error('获取内容异常：', error);
    }
  }

  const filteredContents = contents.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">公告与资源</h2>

      <div className="flex gap-4">
        <button 
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button 
          className={`px-4 py-2 rounded ${filter === 'announcement' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('announcement')}
        >
          公告
        </button>
        <button 
          className={`px-4 py-2 rounded ${filter === 'resource' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('resource')}
        >
          资源
        </button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <ScrollArea className="h-[600px] space-y-4">
            {filteredContents
              .sort((a, b) => ((b.is_pinned || 0) - (a.is_pinned || 0)))
              .map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">
                          {item.is_pinned === 1 && '📌 '}
                          [{item.type === 'announcement' ? '公告' : '资源'}] {item.title}
                        </h4>
                        <div className="text-sm text-gray-500">{item.created_at}</div>
                      </div>
                      <button 
                        className="text-blue-500 hover:underline"
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id ?? null)}
                      >
                        {expandedId === item.id ? '收起' : '查看详情'}
                      </button>
                    </div>

                    {expandedId === item.id && (
                      <div className="prose max-w-full mt-4">
                        <MarkdownViewer markdown={item.content_markdown} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
