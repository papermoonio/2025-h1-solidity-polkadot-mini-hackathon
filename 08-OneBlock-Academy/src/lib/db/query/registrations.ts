// ./src/lib/db/query/registrations.ts
import db from '@/lib/db';


const now = new Date().toISOString(); // 当前时间字符串
export interface Registration {
  id:number;
  student_name: string;
  wechat_id: string;
  phone: string;
  email: string;
  gender: string;
  age_group: string;
  education: string;
  university: string;
  major: string;
  city: string;
  role: string;
  languages: string;
  experience: string;
  source: string;
  has_web3_experience: boolean;
  study_time: string;
  interests: string;
  platforms: string;
  willing_to_hackathon: boolean;
  willing_to_lead: boolean;
  wants_private_service: boolean;
  referrer: string;
  wallet_address: string;
  student_id: string;
  approved?: boolean;
  created_at?: string;
  updated_at?:string;

}



export function addRegistration(reg: Omit<Registration, 'student_id' | 'id'>): {success: boolean, data?: Registration} {
  // 查询当前最大 student_id（转为整数）
  const result = db.prepare(
    `SELECT MAX(CAST(student_id AS INTEGER)) as maxId FROM registrations WHERE student_id GLOB '[0-9]*'`
  ).get() as { maxId: string | null };

  const initialStudentId=process.env.INITIAL_STUDENT_ID || "1799"

  const maxId = result?.maxId ?? initialStudentId; // 如果没有记录就从 1799 开始（下一条是 1800）
  const nextId = parseInt(maxId, 10)  + 1;
  const formattedId = nextId.toString().padStart(4, '0'); // 确保4位格式

  const stmt = db.prepare(
    `INSERT INTO registrations (
      student_name, wechat_id, phone, email, gender, age_group, education,
      university, major, city, role, languages, experience, source,
      has_web3_experience, study_time, interests, platforms,
      willing_to_hackathon, willing_to_lead, wants_private_service,
      referrer, wallet_address, student_id, approved，created_at, updated_at
    ) VALUES (
      @student_name, @wechat_id, @phone, @email, @gender, @age_group, @education,
      @university, @major, @city, @role, @languages, @experience, @source,
      @has_web3_experience, @study_time, @interests, @platforms,
      @willing_to_hackathon, @willing_to_lead, @wants_private_service,
      @referrer, @wallet_address, @student_id, @approved，@created_at, @updated_at
    )`
  );

  const params = {
    ...reg,
    student_id: formattedId, // 自动生成的 student_id
    has_web3_experience: reg.has_web3_experience ? 1 : 0,
    willing_to_hackathon: reg.willing_to_hackathon ? 1 : 0,
    willing_to_lead: reg.willing_to_lead ? 1 : 0,
    wants_private_service: reg.wants_private_service ? 1 : 0,
    approved: reg.approved ? 1 : (reg.approved === false ? 0 : undefined),
    created_at: now,
    updated_at: now,
  };

  try {
    const result = stmt.run(params);
    if (result.changes > 0) {
      const inserted = getRegistrationByStudentId(formattedId);
      return { success: true, data: inserted };
    }
    return { success: false };
  } catch (error) {
    console.error('Failed to add registration:', error);
    return { success: false };
  }
}


// 更新注册信息的审核状态
export function updateApprovalStatus(id: number, approved: boolean) {
  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE registrations SET approved = ?, updated_at = ? WHERE id = ?');
  
  try {
    const result = stmt.run(approved ? 1 : 0, now, id);
    return { success: true, changes: result.changes };
  } catch (error) {
    return { success: false, error };
  }
}

// 更新注册信息
export function updateRegistration(id: number, updates: Partial<Registration>) {
  // 防止更新id和student_id字段
  const safeUpdates = { ...updates };
  delete safeUpdates.id;
  delete safeUpdates.student_id;
  
  // 构建更新语句
  const keys = Object.keys(safeUpdates);
  if (keys.length === 0) return { success: false, error: 'No fields to update' };
  
  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`UPDATE registrations SET ${setClause}, updated_at = ? WHERE id = ?`);
  
  // 准备参数
  const values = [...Object.values(safeUpdates), now, id];
  
  try {
    const result = stmt.run(...values);
    return { success: true, changes: result.changes };
  } catch (error) {
    return { success: false, error };
  }
}

// 删除注册信息
export function deleteRegistration(id: number) {
  const stmt = db.prepare('DELETE FROM registrations WHERE id = ?');
  
  try {
    const result = stmt.run(id);
    return { success: true, changes: result.changes };
  } catch (error) {
    return { success: false, error };
  }
}


// 获取所有注册信息
export function getAllRegistrations() {
  return db.prepare('SELECT * FROM registrations ORDER BY created_at DESC').all();
}

// 根据ID获取单个注册信息
export function getRegistrationById(id: number) {
  return db.prepare('SELECT * FROM registrations WHERE id = ?').get(id);
}

// 根据student_id获取注册信息
export function getRegistrationByStudentId(studentId: string){
  return db.prepare('SELECT * FROM registrations WHERE student_id = ?').get(studentId) as Registration;
}
// 获取已审核或未审核的注册信息
export function getRegistrationsByApprovalStatus(approved: boolean) {
  return db.prepare('SELECT * FROM registrations WHERE approved = ? ORDER BY created_at DESC').all(approved ? 1 : 0);
}
