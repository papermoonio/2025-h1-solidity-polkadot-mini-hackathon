// src/lib/db/query/taskScores.ts

import db from '@/lib/db'
import type { RunResult } from 'better-sqlite3'

export type ScoreType = 'choice' | 'practice'

export interface StudentScore {
  student_id: string;
  student_name: string;
  wechat_id: string;
  wallet_address: string;
  total_score: number;
}


export interface TaskScore {
  id: number
  student_id: string
  task_number: number
  score_type: ScoreType
  score: number
  completed: boolean
  created_at: string
  updated_at: string | null
}

export interface OverallSummary {
  total_score: number
  avg_score: number
  records_count: number
}

interface TaskSummary {
  task_number: number
  score_type: ScoreType
  total_score: number
  times_completed: number
}

interface RawScore {
  student_id: string
  student_name: string | null
  task_number: number
  score_type: ScoreType
  score: number
}

/**
 * 新增一条评分记录，返回新记录的 id
 */
export function createTaskScore(payload: {
  student_id: string
  task_number: number
  score_type: ScoreType
  score?: number
  completed?: boolean
}): number {
  const stmt = db.prepare<
    { student_id: string; task_number: number; score_type: ScoreType; score: number; completed: number },
    RunResult
  >(
    `
    INSERT INTO task_scores
      (student_id, task_number, score_type, score, completed)
    VALUES
      (@student_id, @task_number, @score_type, @score, @completed)
  `
  )
  const info = stmt.run({
    student_id: payload.student_id,
    task_number: payload.task_number,
    score_type: payload.score_type,
    score: payload.score ?? 0,
    completed: payload.completed ? 1 : 0,
  })
  return info.lastInsertRowid as number
}

/**
 * 根据主键删除一条评分记录
 */
export function deleteTaskScore(id: number): void {
  db.prepare(`DELETE FROM task_scores WHERE id = ?`).run(id)
}

/**
 * 更新评分记录的分数、完成状态或类型
 */
export function updateTaskScore(
  id: number,
  updates: Partial<Pick<TaskScore, 'score' | 'completed' | 'score_type'>>
): void {
  const sets: string[] = []
  if (updates.score !== undefined) sets.push(`score = @score`)
  if (updates.completed !== undefined) sets.push(`completed = @completed`)
  if (updates.score_type !== undefined) sets.push(`score_type = @score_type`)

  if (sets.length === 0) {
    return // 没有需要更新的字段
  }

  const sql = `
    UPDATE task_scores
    SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `
  db.prepare<
    { id: number; score?: number; completed?: number; score_type?: ScoreType }
  >(sql).run({
    id,
    score: updates.score,
    completed: updates.completed ? 1 : 0,
    score_type: updates.score_type,
  })
}

/**
 * 查询某个学员的所有记录（按任务编号升序）
 */
export function getTaskScoresByStudent(student_id: string): TaskScore[] {
  return db
    .prepare<[string], TaskScore>(
      `
      SELECT *
      FROM task_scores
      WHERE student_id = ?
      ORDER BY task_number
    `
    )
    .all(student_id)
}

/**
 * 统计某个学员每道题得分汇总及 overall 总分/平均分/记录数
 */
export function getStudentScoreSummary(student_id: string): {
  perTask: TaskSummary[]
  overall: OverallSummary
} {
  const perTask = db
    .prepare<[string], TaskSummary>(
      `
      SELECT
        task_number,
        score_type,
        SUM(score)      AS total_score,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS times_completed
      FROM task_scores
      WHERE student_id = ?
      GROUP BY task_number, score_type
      ORDER BY task_number
    `
    )
    .all(student_id)

  const overall = db
    .prepare<[string], OverallSummary>(
      `
      SELECT
        COALESCE(SUM(score), 0)  AS total_score,
        COALESCE(AVG(score), 0)  AS avg_score,
        COUNT(*)                 AS records_count
      FROM task_scores
      WHERE student_id = ?
    `
    )
    .get(student_id) ?? {
      total_score: 0,
      avg_score: 0,
      records_count: 0,
    }

  return { perTask, overall }
}

/**
 * 获取所有原始记录（附带 student_name）
 */
export function getRawScores(): RawScore[] {
  return db
    .prepare<[], RawScore>(
      `
      SELECT
        ts.student_id,
        r.student_name AS student_name,
        ts.task_number,
        ts.score_type,
        ts.score
      FROM task_scores ts
      LEFT JOIN registrations r
        ON ts.student_id = r.student_id
      ORDER BY ts.student_id, ts.task_number
    `
    )
    .all()
}



export function getStudentScores(): StudentScore[] {
  const stmt = db.prepare<[], StudentScore>(`
    SELECT 
      r.student_id,
      r.student_name,
      r.wechat_id,
      r.wallet_address,
      IFNULL(SUM(t.score), 0) AS total_score
    FROM registrations r
    LEFT JOIN task_scores t ON r.student_id = t.student_id
    GROUP BY r.student_id
    ORDER BY total_score DESC;
  `);

  
  return stmt.all();
}