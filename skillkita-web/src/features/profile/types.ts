export type UserProfileRow = {
  user_id: string;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  full_name: string;
  short_name: string | null;
  company_name: string | null;
  phone: string | null;
  profile_pic_url: string | null;
};

