// ./src/lib/db/query/courseContents.ts
import db from '@/lib/db';

export interface CourseContent {
  id?: number;
  title: string;
  type: 'announcement' | 'resource';
  task_number?: number;
  content_markdown: string;
  is_pinned?:  0 | 1;
  created_at?: string;
  updated_at?: string;
}

const now = () => new Date().toISOString();

export function getAllCourseContents(): CourseContent[] {
  return db.prepare('SELECT * FROM course_contents ORDER BY created_at DESC').all() as CourseContent[];
}

export function addCourseContent(content: Omit<CourseContent, 'id' | 'created_at' | 'updated_at'>): void {
  const stmt = db.prepare(`
    INSERT INTO course_contents (title, type, task_number, content_markdown, is_pinned, created_at, updated_at)
    VALUES (@title, @type, @task_number, @content_markdown, @is_pinned, @created_at, @updated_at)
  `);

  stmt.run({
    title: content.title,
    type: content.type,
    task_number: content.task_number ?? null, // 如果没有传，就插入 null
    content_markdown: content.content_markdown,
    is_pinned: content.is_pinned ? 1 : 0,      // boolean转成 1 或 0
    created_at: now(),
    updated_at: now()
  });
}

export function updateCourseContent(
  id: number,
  updates: Partial<CourseContent>
): { success: boolean; changes?: number; error?: unknown } {
  const safeUpdates = { ...updates };
  delete safeUpdates.id;

  const keys = Object.keys(safeUpdates) as (keyof CourseContent)[];
  if (keys.length === 0) return { success: false, error: 'No fields to update' };

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const stmt = db.prepare(`UPDATE course_contents SET ${setClause}, updated_at = ? WHERE id = ?`);

  const values = [...keys.map(key => safeUpdates[key]), now(), id];

  try {
    const result = stmt.run(...values);
    return { success: true, changes: result.changes };
  } catch (error: unknown) {
    return { success: false, error };
  }
}

export function deleteCourseContent(id: number): { success: boolean; changes?: number; error?: unknown } {
  try {
    const result = db.prepare('DELETE FROM course_contents WHERE id = ?').run(id);
    return { success: true, changes: result.changes };
  } catch (error: unknown) {
    return { success: false, error };
  }
}
