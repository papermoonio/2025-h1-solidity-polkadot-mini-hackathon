// src/lib/db/query/authdb.ts
import db from '../index';

type AuthResult = {
  success: boolean;
  name?:string;
  role?: string;
  id?:string;
  
};

export function checkWalletAuth(walletAddress: string): AuthResult {

  const staff = db.prepare('SELECT role,id,name FROM staff WHERE wallet_address = ?').get(walletAddress) as { role: string,id:number,name:string } | undefined;
 
      if (staff) {
       return { success: true, role: staff.role,id:String(staff.id),name:staff.name};
      }

  const student = db.prepare('SELECT approved,student_id,student_name FROM registrations WHERE wallet_address = ?').get(walletAddress)  as { approved: number,student_id:string,student_name:string } | undefined;
 
  if (student) {
    if(student.approved===1){
      return { success: true, role: "student",id:student.student_id,name:student.student_name};
    }else if(student.approved===0){
      return { success: true, role: "pending" };
    }
    
  }

  return { success: false };
}
