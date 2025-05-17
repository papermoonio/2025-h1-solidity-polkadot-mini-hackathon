'use client';
import React, { useEffect, useState } from 'react';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { CalendarIcon, PencilIcon, TrashIcon, ArrowLeftIcon } from 'lucide-react';

interface PersonalNote {
  id: number | string;
  student_id: string;
  student_name?: string;
  title: string;
  content_markdown: string;
  created_at?: string;
  updated_at?: string;
}

export function NotesManagement() {

  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<PersonalNote | null>(null);
  const [mode, setMode] = useState<'list' | 'read' | 'edit'>('list');
  const [title, setTitle] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');

  useEffect(() => {
    
      fetchNotes();
   
  }, []);

  async function fetchNotes() {
    try {
      const res = await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getAll', data: {} }),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotes(data);
      } else {
        toast.error('获取笔记失败');
      }
    } catch (err) {
      console.error('Failed to fetch notes', err);
      toast.error('获取笔记失败');
    }
  }

  function startReadMode(note: PersonalNote) {
    setSelectedNote(note);
    setMode('read');
  }

  function startEditMode(note: PersonalNote) {
    setSelectedNote(note);
    setTitle(note.title);
    setContentMarkdown(note.content_markdown);
    setMode('edit');
  }

  function backToList() {
    setMode('list');
    setSelectedNote(null);
    setTitle('');
    setContentMarkdown('');
  }

  async function handleUpdateNote() {
    if (!selectedNote) {
      toast.error('笔记信息不完整');
      return;
    }
    if (!title.trim() || !contentMarkdown.trim()) {
      toast.error('标题和内容不能为空');
      return;
    }
    try {
      const res = await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          data: {
            id: selectedNote.id,
            student_id: selectedNote.student_id,
            title,
            content_markdown: contentMarkdown,
          },
        }),
      });
      const result = await res.json();
      if (res.ok) {
        const updated: PersonalNote = {
          ...selectedNote,
          title,
          content_markdown: contentMarkdown,
          updated_at: new Date().toISOString(),
        };
        toast.success('笔记更新成功');
        setSelectedNote(updated);
        setMode('read');
        fetchNotes();
      } else {
        toast.error(result.message || '更新笔记失败');
      }
    } catch (err) {
      console.error('Failed to update note', err);
      toast.error('更新笔记失败');
    }
  }

  async function handleDeleteNote(note: PersonalNote) {
    if (!note.id) {
      toast.error('笔记ID不存在');
      return;
    }
    const confirmDelete = window.confirm(`确定要删除 "${note.title}" 吗？`);
    if (!confirmDelete) return;
    try {
      const res = await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          data: { id: note.id, student_id: note.student_id },
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('笔记删除成功');
        if (selectedNote?.id === note.id) {
          backToList();
        }
        fetchNotes();
      } else {
        toast.error(result.message || '删除笔记失败');
      }
    } catch (err) {
      console.error('Failed to delete note', err);
      toast.error('删除笔记失败');
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '未知时间';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '未知时间';
    return formatDistanceToNow(date, { addSuffix: true });
  }

/*   if (status !== 'authenticated') {
    return <div className="flex items-center justify-center h-full">正在加载用户信息...</div>;
  }
 */
  return (
    <div className="w-full h-full p-4">
      {mode === 'list' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">学员笔记</h2>
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
              {notes.length === 0 ? (
                <div className="col-span-full text-center p-8 text-gray-500">
                  暂无笔记
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="border p-4 rounded-lg transition-all hover:shadow-md cursor-pointer"
                    onClick={() => startReadMode(note)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                        {note.title}
                      </h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditMode(note);
                          }}
                        >
                          <PencilIcon size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note);
                          }}
                        >
                          <TrashIcon size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <span className="font-medium">{note.student_name || '未知作者'}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <CalendarIcon size={12} />
                        <span>{formatDate(note.updated_at || note.created_at)}</span>
                      </div>
                    </div>
                    <div className="max-h-32 overflow-hidden text-gray-700 text-sm">
                      <div className="line-clamp-3">
                        <MarkdownViewer markdown={note.content_markdown} />
                      </div>
                      <div className="text-blue-500 text-xs mt-2">点击查看详情</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {mode === 'read' && selectedNote && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={backToList} className="flex items-center gap-2">
                <ArrowLeftIcon size={16} />
                <span>返回列表</span>
              </Button>
              <h2 className="text-2xl font-bold">{selectedNote.title}</h2>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => startEditMode(selectedNote)} className="flex items-center gap-2">
                <PencilIcon size={16} />
                <span>编辑</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDeleteNote(selectedNote)}
              >
                <TrashIcon size={16} />
                <span>删除</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium">{selectedNote.student_name || '未知作者'}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <CalendarIcon size={12} />
              <span>更新于 {formatDate(selectedNote.updated_at || selectedNote.created_at)}</span>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-220px)] mt-4 border rounded-lg p-6 bg-white">
            <div className="pr-4">
              <MarkdownViewer markdown={selectedNote.content_markdown} />
            </div>
          </ScrollArea>
        </div>
      )}

      {mode === 'edit' && selectedNote && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => startReadMode(selectedNote)}
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon size={16} />
                <span>返回查看</span>
              </Button>
              <h2 className="text-2xl font-bold">编辑笔记</h2>
            </div>
          </div>

          <div className="h-[calc(100vh-240px)] border rounded-lg p-1 bg-white">
            <textarea
              className="w-full h-full p-2 border rounded"
              value={contentMarkdown}
              onChange={(e) => setContentMarkdown(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleUpdateNote} className="flex-1">
              保存修改
            </Button>
            <Button
              variant="outline"
              onClick={() => startReadMode(selectedNote)}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
