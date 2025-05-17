import db from '@/lib/db';

export interface ChoiceQuestion {
  id?: number;
  task_number: number;
  question_number: number;
  question_text: string;
  options: Record<string, string>; // A, B, C, D
  correct_option: string;
  score: number;
  created_at?: string;
  updated_at?: string;
}

// Database error type definition
type DbError = {
  message: string;
  code?: string | number;
}

// 获取全部选择题
export function getAllChoiceQuestions(): ChoiceQuestion[] {
  const rows = db.prepare('SELECT * FROM choice_questions ORDER BY task_number, question_number').all() as Array<{
    id: number;
    task_number: number;
    question_number: number;
    question_text: string;
    options: string; // JSON 格式的字符串
    correct_option: string;
    score: number;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    ...row,
    options: JSON.parse(row.options) as Record<string, string>, // 明确转换为 Record<string, string>
  }));
}

// 获取不含答案的选择题（用于学员）
export function getQuestionsWithoutAnswers(): Omit<ChoiceQuestion, 'correct_option'>[] {
  const rows = db.prepare(`
    SELECT id, task_number, question_number, question_text, options, score, created_at, updated_at 
    FROM choice_questions 
    ORDER BY task_number, question_number
  `).all() as Array<{
    id: number;
    task_number: number;
    question_number: number;
    question_text: string;
    options: string; // JSON 格式的字符串
    score: number;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    ...row,
    options: JSON.parse(row.options) as Record<string, string>, // 明确转换为 Record<string, string>
  }));
}

// 插入选择题
export function addChoiceQuestion(q: ChoiceQuestion) {
  const stmt = db.prepare(`
    INSERT INTO choice_questions (
      task_number, question_number, question_text, options, correct_option, score, created_at, updated_at
    ) VALUES (
      @task_number, @question_number, @question_text, @options, @correct_option, @score, @created_at, @updated_at
    )
  `);
  stmt.run({
    ...q,
    options: JSON.stringify(q.options),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}

// 更新选择题
export function updateChoiceQuestion(id: number, updates: Partial<ChoiceQuestion>) {
  // 创建一个新对象，用于存储数据库可接受的值格式
  const safeUpdates: Record<string, string | number> = {};

  // 对每个字段单独处理
  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'id') return; // 跳过id字段
    
    if (key === 'options' && typeof value === 'object') {
      safeUpdates[key] = JSON.stringify(value);
    } else if (value !== undefined) {
      // 只处理非undefined的值，并确保类型正确
      safeUpdates[key] = value as string | number;
    }
  });

  const keys = Object.keys(safeUpdates);
  if (keys.length === 0) return { success: false, error: 'No fields to update' };

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const stmt = db.prepare(`UPDATE choice_questions SET ${setClause}, updated_at = ? WHERE id = ?`);
  const values = [...Object.values(safeUpdates), new Date().toISOString(), id];

  try {
    const result = stmt.run(...values);
    return { success: true, changes: result.changes };
  } catch (error) {
    return { success: false, error: error as DbError };
  }
}

// 删除选择题
export function deleteChoiceQuestion(id: number) {
  const stmt = db.prepare('DELETE FROM choice_questions WHERE id = ?');
  try {
    const result = stmt.run(id);
    return { success: true, changes: result.changes };
  } catch (error) {
    return { success: false, error: error as DbError };
  }
}

// 计算得分（传入学员答案）
export function calculateChoiceScore(studentAnswers: { [questionId: number]: string }): number {
  let score = 0;
  const allQuestions = getAllChoiceQuestions();

  for (const [idStr, answer] of Object.entries(studentAnswers)) {
    const question = allQuestions.find((q) => q.id === Number(idStr));
    if (question && question.correct_option === answer) {
      score += question.score ?? 1; // 如果没有设置分值，则默认得分 1
    }
  }

  return score;
}

export function deleteChoiceQuestionsByTaskNumber(taskNumber: number) {
  const stmt = db.prepare('DELETE FROM choice_questions WHERE task_number = ?');
  try {
    const result = stmt.run(taskNumber);
    return { success: true, changes: result.changes };
  } catch (error) {
    return { success: false, error: error as DbError };
  }
}