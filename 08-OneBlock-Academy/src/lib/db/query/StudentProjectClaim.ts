import db from '@/lib/db';

export function insertStudentProjectClaim(data: {
  student_id: string;
  project_id: string;
  project_name: string;
  nft_address: string;
  claim_address: string;
  erc20_address: string;
  has_claimed?: boolean; // 可选，默认 ture
}) {
  const stmt = db.prepare(`
    INSERT INTO student_project_claims (
      student_id, project_id, project_name,
      nft_address, claim_address, erc20_address,
      has_claimed, created_at
    ) VALUES (
      @student_id, @project_id, @project_name,
      @nft_address, @claim_address, @erc20_address,
      @has_claimed, CURRENT_TIMESTAMP
    )
  `);

  return stmt.run({
    student_id: data.student_id ?? "",
    project_id: data.project_id ?? "",
    project_name: data.project_name ?? "",
    nft_address: data.nft_address ?? "",
    claim_address: data.claim_address ?? "",
    erc20_address: data.erc20_address ?? "",
    has_claimed: data.has_claimed === undefined ? 1 : data.has_claimed ? 1 : 0,
    
  });
}



export function getProjectsByStudentId(student_id: string) {
  const stmt = db.prepare(`
    SELECT * FROM student_project_claims
    WHERE student_id = ?
    ORDER BY created_at DESC
  `);

  return stmt.all(student_id);
}

export function getLatestProject() {
    const stmt = db.prepare(`
      SELECT *
      FROM projects
      ORDER BY created_at DESC
      LIMIT 1
    `);
  
    return stmt.get();
  }


  /**
 * 项目数据接口
 */
export interface Project {
  id: number;
  project_id: string;
  project_name: string;
  factory_address: string;
  whitelist_address: string;
  nft_address: string;
  claim_address: string;
  erc20_address: string;
  created_at: string;
  updated_at: string | null;
}

/**
 * 学生项目申领数据接口
 */
export interface StudentProjectClaim {
  id: number;
  student_id: string;
  student_name: string;
  project_id: string;
  project_name: string;
  nft_address: string;
  claim_address: string;
  erc20_address: string;
  has_claimed: number; // SQLite存储为0或1
  created_at: string;
  updated_at: string | null;
}

/**
 * 删除操作结果接口
 */
export interface DeleteResult {
  success: boolean;
  message: string;
  changes?: number;
  error?: Error;
}

/**
 * 获取所有项目数据
 * @returns 项目数据列表
 */
export function getAllProjects(): Project[] {
  const projects = db.prepare(`
    SELECT 
      id, 
      project_id, 
      project_name, 
      factory_address, 
      whitelist_address, 
      nft_address, 
      claim_address, 
      erc20_address, 
      created_at, 
      updated_at
    FROM projects
    ORDER BY created_at DESC
  `).all() as Project[];
  
  return projects;
}

/**
 * 获取所有学生项目申领数据，并关联学生姓名
 * @returns 学生项目申领数据列表
 */
export function getAllStudentProjectClaims(): StudentProjectClaim[] {
  const claims = db.prepare(`
    SELECT 
      spc.id,
      spc.student_id,
      reg.student_name,
      spc.project_id,
      spc.project_name,
      spc.nft_address,
      spc.claim_address,
      spc.erc20_address,
      spc.has_claimed,
      spc.created_at,
      spc.updated_at
    FROM student_project_claims spc
    JOIN registrations reg ON spc.student_id = reg.student_id
    ORDER BY spc.created_at DESC
  `).all() as StudentProjectClaim[];
  
  return claims;
}

/**
 * 根据ID删除项目
 * @param id 项目ID
 * @returns 删除操作结果
 */
export function deleteProjectById(id: number): DeleteResult {
  try {
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return {
      success: result.changes > 0,
      message: result.changes > 0 ? '项目删除成功' : '未找到指定项目',
      changes: result.changes
    };
  } catch (error) {
    return {
      success: false,
      message: `删除项目失败: ${(error as Error).message}`,
      error: error as Error
    };
  }
}

/**
 * 根据ID删除学生项目申领记录
 * @param id 申领记录ID
 * @returns 删除操作结果
 */
export function deleteStudentProjectClaimById(id: number): DeleteResult {
  try {
    const result = db.prepare('DELETE FROM student_project_claims WHERE id = ?').run(id);
    return {
      success: result.changes > 0,
      message: result.changes > 0 ? '申领记录删除成功' : '未找到指定申领记录',
      changes: result.changes
    };
  } catch (error) {
    return {
      success: false,
      message: `删除申领记录失败: ${(error as Error).message}`,
      error: error as Error
    };
  }
}