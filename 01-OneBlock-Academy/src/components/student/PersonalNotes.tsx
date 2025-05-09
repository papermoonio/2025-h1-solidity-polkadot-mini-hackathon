'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { CalendarIcon, PencilIcon, TrashIcon, PlusIcon, ArrowLeftIcon } from 'lucide-react';

interface PersonalNote {
  id: number | string; // 支持数字和字符串类型的ID
  student_id: string;
  student_name?: string; // 设为可选，因为API可能不总是返回
  title: string;
  content_markdown: string;
  created_at?: string;
  updated_at?: string;
}

export function PersonalNotes() {
  const { data: session, status } = useSession();
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<PersonalNote | null>(null);
  const [mode, setMode] = useState<'list' | 'read' | 'add' | 'edit'>('list');
  const [title, setTitle] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');

  // Fetch notes after authentication
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      console.log('Session authenticated, fetching notes for user:', session.user.id);
      fetchNotes();
    }
  }, [status, session?.user?.id]);

  async function fetchNotes() {
    try {
      const res = await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getAll',
          data: { student_id: session?.user.id }
        }),
      });
      const data = await res.json();
      
      console.log('Fetched notes:', data);
      
      if (Array.isArray(data)) {
        setNotes(data);
      } else {
        console.error('Invalid notes response', data);
        toast.error('获取笔记失败');
      }
    } catch (err) {
      console.error('Failed to fetch notes', err);
      toast.error('获取笔记失败');
    }
  }

  function startAddMode() {
    setSelectedNote(null);
    setTitle('');
    setContentMarkdown('');
    setMode('add');
  }

  function startEditMode(note: PersonalNote) {
    setSelectedNote(note);
    setTitle(note.title);
    setContentMarkdown(note.content_markdown);
    setMode('edit');
  }

  function startReadMode(note: PersonalNote) {
    setSelectedNote(note);
    setMode('read');
  }

  function backToList() {
    setMode('list');
    setSelectedNote(null);
    setTitle('');
    setContentMarkdown('');
  }

  async function handleAddNote() {
    if (!title.trim() || !contentMarkdown.trim()) {
      toast.error('标题和内容不能为空');
      return;
    }
    
    // 确保我们有用户ID和名称
    if (!session?.user?.id || !session?.user?.name) {
      toast.error('用户信息不完整，请重新登录');
      return;
    }
    
    try {
      console.log('Adding note with data:', {
        student_id: session.user.id,
        student_name: session.user.name,
        title,
        content_markdown: contentMarkdown
      });
      
      const res = await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          data: {
            student_id: session.user.id,
            student_name: session.user.name,
            title,
            content_markdown: contentMarkdown
          }
        }),
      });
      
      console.log('Add note response status:', res.status);
      const result = await res.json();
      console.log('Add note response:', result);
      
      if (res.ok) {
        toast.success('笔记创建成功');
        backToList();
        fetchNotes();
      } else {
        toast.error(result.message || '创建笔记失败');
      }
    } catch (err) {
      console.error('Failed to add note', err);
      toast.error('创建笔记失败');
    }
  }

  async function handleUpdateNote() {
    if (!selectedNote?.id) {
      toast.error('笔记ID不存在');
      return;
    }
    
    if (!title.trim() || !contentMarkdown.trim()) {
      toast.error('标题和内容不能为空');
      return;
    }
    
    // 确保我们有用户ID
    if (!session?.user?.id) {
      toast.error('用户信息不完整，请重新登录');
      return;
    }
    
    try {
      console.log('Updating note with data:', {
        id: selectedNote.id,
        student_id: session.user.id,
        title,
        content_markdown: contentMarkdown
      });
      
      const res = await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          data: {
            id: selectedNote.id,
            student_id: session.user.id,
            title,
            content_markdown: contentMarkdown
          }
        }),
      });
      
      console.log('Update note response status:', res.status);
      const result = await res.json();
      console.log('Update note response:', result);
      
      if (res.ok) {
        // 保存当前笔记的ID，用于后续查找
      //  const currentNoteId = selectedNote.id;
        
        // 先创建更新后的笔记对象，而不依赖于API返回
        const updatedNote = {
          ...selectedNote,
          title: title,
          content_markdown: contentMarkdown,
          updated_at: new Date().toISOString()
        };
        
        toast.success('笔记更新成功');
        
        // 直接使用更新后的笔记对象进入阅读模式
        setSelectedNote(updatedNote);
        setMode('read');
        
        // 然后在后台刷新笔记列表
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
    // 调试日志，检查传入的笔记对象
    console.log('Attempting to delete note:', note);
    
    if (!note?.id) {
      toast.error('笔记ID不存在');
      console.error('Delete failed: Note ID is missing');
      return;
    }
    
    // 确保我们有用户ID
    if (!session?.user?.id) {
      toast.error('用户信息不完整，请重新登录');
      console.error('Delete failed: User session is invalid');
      return;
    }
    
    // 使用window.confirm确保对话框正常显示
    const confirmDelete = window.confirm(`确定要删除 "${note.title}" 吗？`);
    if (!confirmDelete) {
      console.log('User cancelled delete operation');
      return;
    }
    
    try {
      console.log('Deleting note with ID:', note.id, 'and student_id:', session.user.id);
      
      const res = await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          data: { 
            id: note.id, 
            student_id: session.user.id 
          }
        }),
      });
      
      console.log('Delete note response status:', res.status);
      const result = await res.json();
      console.log('Delete note response:', result);
      
      if (res.ok) {
        toast.success('笔记删除成功');
        // 确保当前选中的笔记与被删除的笔记ID一致时才返回列表
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
    try {
      // 检查日期字符串是否有效
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '未知时间';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      console.error('Date formatting error:', e);
      return '未知时间';
    }
  }

  if (status !== 'authenticated') {
    return <div className="flex items-center justify-center h-full">正在加载用户信息...</div>;
  }

  // 单视窗设计 - 根据模式显示不同内容
  return (
    <div className="w-full h-full p-4">
      {/* 列表模式 */}
      {mode === 'list' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">我的笔记</h2>
            <Button onClick={startAddMode} className="flex items-center gap-2">
              <PlusIcon size={16} />
              <span>新增笔记</span>
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
              {notes.length === 0 ? (
                <div className="col-span-full text-center p-8 text-gray-500">
                  暂无笔记，点击新增笔记创建您的第一条笔记
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
                            e.stopPropagation(); // 防止触发父元素的点击事件
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
                            e.stopPropagation(); // 防止触发父元素的点击事件
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

      {/* 阅读模式 */}
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
              <Button 
                onClick={() => startEditMode(selectedNote)} 
                className="flex items-center gap-2"
              >
                <PencilIcon size={16} />
                <span>编辑</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  console.log('Delete button clicked in read mode for note:', selectedNote?.id);
                  if (selectedNote) {
                    handleDeleteNote(selectedNote);
                  } else {
                    toast.error('无法删除：笔记信息不完整');
                  }
                }}
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

      {/* 添加模式 */}
      {mode === 'add' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={backToList} className="flex items-center gap-2">
                <ArrowLeftIcon size={16} />
                <span>返回列表</span>
              </Button>
              <h2 className="text-2xl font-bold">新增笔记</h2>
            </div>
          </div>

          <Input
            placeholder="笔记标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium"
          />

          <div className="h-[calc(100vh-240px)] border rounded-lg p-1 bg-white">
            <MarkdownEditor
              value={contentMarkdown}
              onChange={setContentMarkdown}
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleAddNote}
              className="flex-1"
            >
              保存新笔记
            </Button>
            <Button 
              variant="outline" 
              onClick={backToList}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      )}

      {/* 编辑模式 */}
      {mode === 'edit' && selectedNote && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* 这里修改为返回阅读模式，而不是返回列表 */}
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

          <Input
            placeholder="笔记标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium"
          />

          <div className="h-[calc(100vh-240px)] border rounded-lg p-1 bg-white">
            <MarkdownEditor
              value={contentMarkdown}
              onChange={setContentMarkdown}
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleUpdateNote}
              className="flex-1"
            >
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