// src/app/api/student/taskscores/route.ts
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { 
  getRawScores, 
  getStudentScores, 
  getTaskScoresByStudent, 
 /*  createTaskScore, 
  updateTaskScore,  */
  getStudentScoreSummary 
} from '@/lib/db/query/taskScores'
import { getToken } from 'next-auth/jwt'

// For returning raw scores (legacy GET endpoint)
export async function GET() {
  const rawScores = getRawScores()
  return NextResponse.json(rawScores)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Get current user session for authorization checks
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    const userId = token?.id as string

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle different actions
    switch (action) {
/*       case 'create':
        // Permission check: Only admin or teachers can create scores
        if (token.role !== 'admin' && token.role !== 'teacher') {
          return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
        }
        
        const id = createTaskScore(body)
        return NextResponse.json({ id }, { status: 201 })
      
      case 'update':
        // Permission check: Only admin or teachers can update scores
        if (token.role !== 'admin' && token.role !== 'teacher') {
          return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
        }
        
        const { id, ...updates } = body
        updateTaskScore(id, updates)
        return NextResponse.json({ success: true }) */
      
      case 'getMyScores':
        // Get the student's own scores
        if (!userId) {
          return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
        }
        
        const myScores = getTaskScoresByStudent(userId)
        const summary = getStudentScoreSummary(userId)
        return NextResponse.json({ scores: myScores, summary })
      
      case 'getAllScores':
        // Get all student scores (for ranking)
        const allScores = getStudentScores()
        return NextResponse.json(allScores)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}