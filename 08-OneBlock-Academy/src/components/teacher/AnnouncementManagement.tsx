// ./src/components/teacher/AnnouncementManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { CourseContent } from '@/lib/db/query/courseContents';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export function AnnouncementManagement() {
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    type: 'announcement' | 'resource';
    task_number?: number;
    content_markdown: string;
    is_pinned: boolean;
  }>({
    title: '',
    type: 'announcement',
    content_markdown: '',
    is_pinned: false,
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  function resetForm() {
    setFormData({
      title: '',
      type: 'announcement',
      content_markdown: '',
      is_pinned: false,
    });
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit() {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      alert('标题和内容不能为空');
      return;
    }

    const payload = {
      action: editingId ? 'update' : 'add',
      data: {
        ...formData,
        is_pinned: formData.is_pinned ? 1 : 0,
        ...(editingId ? { id: editingId } : {}),
      },
    };

    try {
      const res = await fetch('/api/teacher/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        await fetchContents();
        resetForm();
      } else {
        alert('操作失败：' + (result.message || JSON.stringify(result.error)));
      }
    } catch (error) {
      console.error('提交失败：', error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定要删除这条内容吗？')) return;
    try {
      const res = await fetch('/api/teacher/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', data: { id } }),
      });
      const result = await res.json();
      if (result.success) {
        await fetchContents();
      } else {
        alert('删除失败：' + (result.message || JSON.stringify(result.error)));
      }
    } catch (error) {
      console.error('删除失败：', error);
    }
  }

  function handleEdit(item: CourseContent) {
    setFormData({
      title: item.title,
      type: item.type,
      task_number: item.task_number,
      content_markdown: item.content_markdown,
      is_pinned: item.is_pinned === 1,
    });
    setEditingId(item.id ?? null);
    setShowForm(true);
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">公告与资源管理</h2>

      <Button onClick={() => setShowForm(true)}>➕ 新增公告 / 资源</Button>

      {showForm && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <Input
              placeholder="标题"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as 'announcement' | 'resource' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="announcement">公告</SelectItem>
                <SelectItem value="resource">资源</SelectItem>
              </SelectContent>
            </Select>

            {formData.type === 'resource' && (
              <Input
                type="number"
                placeholder="关联的任务编号（可选）"
                value={formData.task_number ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, task_number: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            )}

            <div className="flex items-center gap-2">
              <Label>置顶：</Label>
              <Switch
                checked={formData.is_pinned}
                onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
              />
            </div>

            <div className="h-96">
              <MarkdownEditor
                value={formData.content_markdown}
                onChange={(value) => setFormData({ ...formData, content_markdown: value })}
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSubmit}>
                {editingId ? '更新内容' : '发布内容'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="text-lg font-semibold mb-4">内容列表</h3>
          <ScrollArea className="h-[600px] space-y-4">
            {contents.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">
                        [{item.type === 'announcement' ? '公告' : '资源'}] {item.title}
                      </h4>
                      <div className="text-sm text-gray-500">{item.created_at}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setExpandedId(expandedId === item.id ? null : item.id ?? null)}>
                        {expandedId === item.id ? '收起' : '预览'}
                      </Button>
                      <Button size="sm" onClick={() => handleEdit(item)}>
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id!)}
                      >
                        删除
                      </Button>
                    </div>
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
