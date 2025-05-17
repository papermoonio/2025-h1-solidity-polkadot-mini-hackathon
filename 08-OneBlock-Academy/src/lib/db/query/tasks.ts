// ./src/lib/db/query/tasks.ts
import db from '@/lib/db';

export interface Task {
  id?: number;
  student_id: string;
  student_name: string;
  task1_choice_score: number;
  task1_practice_score: number;
  task2_choice_score: number;
  task2_practice_score: number;
  task3_choice_score: number;
  task3_practice_score: number;
  task4_choice_score: number;
  task4_practice_score: number;
  task5_choice_score: number;
  task5_practice_score: number;
  task6_choice_score: number;
  task6_practice_score: number;
  created_at: string;
  updated_at?: string;
}

// 获取所有任务数据
export function getAllTasks() {
  return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
}

// 根据 student_id 获取任务数据
export function getTaskByStudentId(studentId: string) {
  return db.prepare('SELECT * FROM tasks WHERE student_id = ?').get(studentId);
}

// 插入任务数据
export function addTask(task: Task) {
  const stmt = db.prepare(`
    INSERT INTO tasks (
      student_id, student_name, task1_choice_score, task1_practice_score,
      task2_choice_score, task2_practice_score, task3_choice_score, task3_practice_score,
      task4_choice_score, task4_practice_score, task5_choice_score, task5_practice_score,
      task6_choice_score, task6_practice_score, created_at, updated_at
    ) VALUES (
      @student_id, @student_name, @task1_choice_score, @task1_practice_score,
      @task2_choice_score, @task2_practice_score, @task3_choice_score, @task3_practice_score,
      @task4_choice_score, @task4_practice_score, @task5_choice_score, @task5_practice_score,
      @task6_choice_score, @task6_practice_score, @created_at, @updated_at
    )
  `);
  const params = { ...task, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  stmt.run(params);
}

// 更新任务数据
export function updateTask(id: number, task: Partial<Task>) {
  const safeUpdates = { ...task };
  delete safeUpdates.id; // 防止修改 id 字段
  const keys = Object.keys(safeUpdates);
  
  if (keys.length === 0) return { success: false, error: 'No fields to update' };
  
  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`UPDATE tasks SET ${setClause}, updated_at = ? WHERE id = ?`);
  const values = [...Object.values(safeUpdates), now, id];
  
  try {
    const result = stmt.run(...values);
    return { success: true, changes: result.changes };
  } catch (error) {
    return { success: false, error };
  }
}

// 删除任务数据
export function deleteTask(id: number) {
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  
  try {
    const result = stmt.run(id);
    return { success: true, changes: result.changes };
  } catch (error) {
    return { success: false, error };
  }
}
