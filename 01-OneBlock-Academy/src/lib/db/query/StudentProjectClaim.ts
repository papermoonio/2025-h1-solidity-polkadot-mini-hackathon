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
    ...data,
    has_claimed: data.has_claimed ?? 1,
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