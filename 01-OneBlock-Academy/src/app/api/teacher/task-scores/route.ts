// src/app/api/teacher/task-scores/route.ts
import { NextResponse } from 'next/server'
import {
  createTaskScore,
  updateTaskScore,
  deleteTaskScore,
  getStudentScores
} from '@/lib/db/query/taskScores'

// POST /api/teacher/task-scores
// Body: 
// - Create: { action: 'create', student_id, task_number, score_type, score, completed }
// - Update: { action: 'update', id, score?, completed?, score_type? }
// - Delete: { action: 'delete', id }
export async function POST(req: Request) {
  const body = await req.json()

  const { action } = body

  if (action === 'create') {
    const id = createTaskScore(body)
    return NextResponse.json({ id }, { status: 201 })
  }

  if (action === 'update') {
    const { id, ...updates } = body
    updateTaskScore(id, updates)
    return NextResponse.json({ id })
  }

  if (action === 'delete') {
    const { id } = body
    deleteTaskScore(id)
    return NextResponse.json({ id })
  }

    // ✅ 新增 summary 功能
    if (action === 'summary') {
      
      const summary = getStudentScores()
      return NextResponse.json(summary)
    }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
