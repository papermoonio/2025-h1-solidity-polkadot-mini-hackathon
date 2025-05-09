
'use client';
import React, { useEffect, useState } from 'react';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
//import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface StudentNote {
  id?: number;
  student_id: string;
  student_name: string;
  title: string;
  content_markdown: string;
  task_number: number;
  created_at?: string;
  updated_at?: string;
}

export  function NotesManagement() {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<StudentNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');

  // 获取所有笔记
  async function fetchNotes() {
    try {
      const res = await fetch('/api/teacher/notes', {
        method: 'POST',
        body: JSON.stringify({ action: 'getAll' }),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotes(data);
      } else {
        console.error('Invalid notes response', data);
      }
    } catch (err) {
      console.error('Failed to fetch notes', err);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  // 新建笔记
  async function handleAddNote() {
    if (!title.trim() || !contentMarkdown.trim()) {
      toast.error('标题和内容不能为空');
      return;
    }
    const newNote: Omit<StudentNote, 'id' | 'created_at' | 'updated_at'> = {
      student_id: 'admin', // 这里可以改成动态获取
      student_name: '管理员', // 这里可以改成动态获取
      title,
      content_markdown: contentMarkdown,
      task_number: 0,
    };
    try {
      await fetch('/api/teacher/notes', {
        method: 'POST',
        body: JSON.stringify({ action: 'add', data: newNote }),
      });
      toast.success('笔记新增成功');
      setTitle('');
      setContentMarkdown('');
      fetchNotes();
    } catch (err) {
      console.error('Failed to add note', err);
    }
  }

  // 更新笔记
  async function handleUpdateNote() {
    if (!selectedNote) return;
    try {
      await fetch('/api/teacher/notes', {
        method: 'POST',
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
      toast.success('笔记更新成功');
      setIsEditing(false);
      setSelectedNote(null);
      setTitle('');
      setContentMarkdown('');
      fetchNotes();
    } catch (err) {
      console.error('Failed to update note', err);
    }
  }

  // 删除笔记
  async function handleDeleteNote(note: StudentNote) {
    if (!confirm(`确定要删除 "${note.title}" 吗？`)) return;
    try {
      await fetch('/api/teacher/notes', {
        method: 'POST',
        body: JSON.stringify({
          action: 'delete',
          data: {
            id: note.id,
            student_id: note.student_id,
          },
        }),
      });
      toast.success('笔记删除成功');
      fetchNotes();
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  }

  function handleEditNote(note: StudentNote) {
    setSelectedNote(note);
    setTitle(note.title);
    setContentMarkdown(note.content_markdown);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setSelectedNote(null);
    setTitle('');
    setContentMarkdown('');
    setIsEditing(false);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full p-4">
      {/* 编辑区 */}
      <div className="flex flex-col gap-4">
        <Input
          placeholder="笔记标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="h-96">
          <MarkdownEditor value={contentMarkdown} onChange={setContentMarkdown} />
        </div>
        <div className="flex gap-4">
          {isEditing ? (
            <>
              <Button onClick={handleUpdateNote}>保存修改</Button>
              <Button variant="secondary" onClick={handleCancelEdit}>
                取消
              </Button>
            </>
          ) : (
            <Button onClick={handleAddNote}>新增笔记</Button>
          )}
        </div>
      </div>

      {/* 笔记列表区 */}
      <ScrollArea className="h-full w-full border rounded-lg p-4">
        <div className="flex flex-col gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border p-4 rounded hover:shadow cursor-pointer transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{note.title}</h3>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEditNote(note)}>
                    编辑
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteNote(note)}>
                    删除
                  </Button>
                </div>
              </div>
              <MarkdownViewer markdown={note.content_markdown} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
