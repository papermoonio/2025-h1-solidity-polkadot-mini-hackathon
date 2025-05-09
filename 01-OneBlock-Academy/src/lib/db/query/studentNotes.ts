// ./src/lib/db/query/studentNotes.ts
import db from '@/lib/db';

export interface StudentNote {
  id?: number;
  student_id: string;
  student_name: string;
  title: string;
  content_markdown: string;
  created_at?: string;
  updated_at?: string;
}

// 获取所有笔记
export function getAllStudentNotes(): StudentNote[] {
  return db.prepare('SELECT * FROM student_notes ORDER BY created_at DESC').all() as StudentNote[];
}

// 获取指定学生的所有笔记
export function getNotesByStudentId(studentId: string): StudentNote[] {
  return db.prepare('SELECT * FROM student_notes WHERE student_id = ? ORDER BY created_at DESC').all(studentId) as StudentNote[];
}

// 添加一条笔记
export function addStudentNote(note: StudentNote) {
  const stmt = db.prepare(`
    INSERT INTO student_notes (
      student_id, student_name, title, content_markdown, created_at, updated_at
    ) VALUES (
      @student_id, @student_name, @title, @content_markdown, @created_at, @updated_at
    )
  `);
  const now = new Date().toISOString();
  stmt.run({ ...note, created_at: now, updated_at: now });
}

// 更新笔记（仅支持指定 student_id 的修改）
export function updateStudentNoteById(id: number, student_id: string, fields: Partial<StudentNote>) {
  const safeUpdates = { ...fields };
  delete safeUpdates.id;
  delete safeUpdates.student_id;
  delete safeUpdates.created_at;

  const keys = Object.keys(safeUpdates);
  if (keys.length === 0) return { success: false, error: 'No fields to update' };

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const values = keys.map(key => (safeUpdates as Record<string, unknown>)[key]);

  const stmt = db.prepare(`
    UPDATE student_notes SET ${setClause}, updated_at = ? 
    WHERE id = ? AND student_id = ?
  `);
  const now = new Date().toISOString();
  try {
    const result = stmt.run(...values, now, id, student_id);
    return { success: true, changes: result.changes };
  } catch (error) {
    return { success: false, error };
  }
}

// 删除笔记（仅限本人）
export function deleteStudentNoteById(id: number, student_id: string) {
  const stmt = db.prepare('DELETE FROM student_notes WHERE id = ? AND student_id = ?');
  try {
    const result = stmt.run(id, student_id);
    return { success: true, changes: result.changes };
  } catch (error) {
    return { success: false, error };
  }
}
