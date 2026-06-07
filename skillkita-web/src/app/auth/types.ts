export type UserRole = "admin" | "employer";

export type UserApprovalStatus = "pending" | "approved" | "rejected";

export type UserProfileRow = {
  user_id: string;
  role: UserRole;
  status: UserApprovalStatus;
  full_name: string;
  short_name?: string | null;
  company_name: string | null;
  company_address?: string | null;
};

