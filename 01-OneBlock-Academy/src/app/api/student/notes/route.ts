// ./src/app/api/student/notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllStudentNotes,
  addStudentNote,
  updateStudentNoteById,
  deleteStudentNoteById
} from '@/lib/db/query/studentNotes';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, data } = body;

  try {
    if (action === 'getAll') {
      const result = getAllStudentNotes();
      return NextResponse.json(result);
    }

    if (action === 'add') {
      if (!data || !data.student_id || !data.student_name || !data.title || !data.content_markdown) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
      }
      addStudentNote(data);
      return NextResponse.json({ message: 'Note added successfully' });
    }

    if (action === 'update') {
      const { id, student_id, ...updateFields } = data;
      if (!id || !student_id) {
        return NextResponse.json({ message: 'Missing id or student_id' }, { status: 400 });
      }
      const result = updateStudentNoteById(id, student_id, updateFields);
      return NextResponse.json(result);
    }

    if (action === 'delete') {
      const { id, student_id } = data;
      if (!id || !student_id) {
        return NextResponse.json({ message: 'Missing id or student_id' }, { status: 400 });
      }
      const result = deleteStudentNoteById(id, student_id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Student Notes API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
