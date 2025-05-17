// ./src/app/api/admin/staff/router.ts
import { NextResponse } from 'next/server';
import {
  getAllStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  Staff,
} from '@/lib/db/query/staff';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'get') {
      const data = getAllStaff();
      return NextResponse.json({ success: true, data });
    }

    if (action === 'add') {
      addStaff(payload as Omit<Staff, 'id' | 'created_at' | 'updated_at'>);
      return NextResponse.json({ success: true, message: 'Staff added successfully' });
    }

    if (action === 'update') {
      const { id, ...updates } = payload;
      const result = updateStaff(id, updates);
      return NextResponse.json(result);
    }

    if (action === 'delete') {
      const result = deleteStaff(payload.id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
