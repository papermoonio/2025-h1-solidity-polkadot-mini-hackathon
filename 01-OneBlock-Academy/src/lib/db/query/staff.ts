// ./src/lib/db/query/staff.ts
import db from '@/lib/db';

export interface Staff {
  id?: number;
  name: string;
  wechat_id: string;
  phone?: string;
  role: 'admin' | 'teacher' | 'assistant';
  wallet_address: string;
  approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function getAllStaff(): Staff[] {
  return db.prepare('SELECT * FROM staff').all() as Staff[];
}

export function addStaff(staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'>): void {
  const stmt = db.prepare(`
    INSERT INTO staff (name, wechat_id, phone, role, wallet_address, approved)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    staff.name,
    staff.wechat_id,
    staff.phone,
    staff.role,
    staff.wallet_address,
    staff.approved !== false ? 1 : 0 
  );
}

export function updateStaff(id: number, updates: Partial<Staff>) {
  const safeUpdates = { ...updates };
  delete safeUpdates.id;

  const keys = Object.keys(safeUpdates);
  if (keys.length === 0) return { success: false, error: 'No fields to update' };

  const setClause = keys.map((key) => `${key} = ?`).join(', ');
  const values = keys.map((key) => (safeUpdates as Record<string, unknown>)[key]);
  const now = new Date().toISOString();

  const stmt = db.prepare(`UPDATE staff SET ${setClause}, updated_at = ? WHERE id = ?`);
  try {
    const result = stmt.run(...values, now, id);
    return { success: true, changes: result.changes };
  } catch (error) {
    return { success: false, error };
  }
}

export function deleteStaff(id: number) {
  const stmt = db.prepare('DELETE FROM staff WHERE id = ?');
  try {
    const result = stmt.run(id);
    return { success: true, changes: result.changes };
  } catch (error) {
    return { success: false, error };
  }
}
