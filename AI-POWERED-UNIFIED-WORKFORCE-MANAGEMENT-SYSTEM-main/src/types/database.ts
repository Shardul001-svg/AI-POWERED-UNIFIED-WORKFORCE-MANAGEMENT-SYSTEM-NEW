export type ProfileRole = "ADMIN" | "HR" | "EMPLOYEE" | "CANDIDATE";
export type EmployeeStatus = "ACTIVE" | "INACTIVE";
export type CandidateStatus = "APPLIED" | "SCREENING" | "INTERVIEW" | "SELECTED" | "REJECTED";
export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type RequestType = "LEAVE" | "HR_QUERY" | "DOCUMENT" | "OTHER";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: ProfileRole;
  created_at: string;
}

export interface Employee {
  id: string;
  profile_id: string;
  employee_code: string;
  phone: string | null;
  department: string;
  position: string;
  joining_date: string;
  status: EmployeeStatus;
  created_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position_applied: string;
  experience: number;
  status: CandidateStatus;
  created_at: string;
}

export interface Interview {
  id: string;
  candidate_id: string;
  interviewer: string | null;
  interview_date: string;
  interview_time: string;
  status: InterviewStatus;
  notes: string | null;
  created_at: string;
}

export interface Request {
  id: string;
  employee_id: string;
  type: RequestType;
  title: string;
  description: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  related_type: string | null;
  related_id: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  profile_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  profile_id: string;
  action: string;
  description: string | null;
  created_at: string;
}