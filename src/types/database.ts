export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  tier: "free" | "premium" | "enterprise";
  status: "active" | "inactive" | "suspended";
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  school_name: string;
  fraternity_name: string;
  chapter_code: string;
  location?: string;
  founded_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, string[]>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserChapterLink {
  id: string;
  user_id: string;
  chapter_id: string;
  role_id?: string;
  is_primary: boolean;
  joined_at: string;
  left_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  chapter_id: string;
  title: string;
  description?: string;
  event_type?:
    | "social"
    | "mixer"
    | "meeting"
    | "philanthropy"
    | "rush"
    | "formal"
    | "other";
  start_time: string;
  end_time?: string;
  location?: string;
  venue?: string;
  status:
    | "draft"
    | "published"
    | "cancelled"
    | "completed"
    | "planned"
    | "active";
  budget_estimate?: number;
  visibility: "public" | "chapter-only" | "officers-only";
  is_private?: boolean;
  max_attendees?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventTask {
  id: string;
  event_id: string;
  title: string;
  assigned_to?: string;
  due_date?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  type:
    | "general"
    | "venue"
    | "catering"
    | "entertainment"
    | "logistics"
    | "promotion";
  notes?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  due_date?: string;
  assigned_to?: string;
  event_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskWithDetails extends Task {
  assignee?: User;
  creator?: User;
  event?: Event;
}

export interface EventChecklist {
  id: string;
  event_id: string;
  item: string;
  completed: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  type: "event" | "budget" | "sponsor" | "general" | "reminder";
  related_event_id?: string;
  updated_at: string;
}

export interface Sponsorship {
  id: string;
  chapter_id: string;
  sponsor_name: string;
  amount: number;
  contact_email?: string;
  logo_url?: string;
  status: "active" | "pending" | "expired";
  created_at: string;
  updated_at: string;
}

// Extended types with relationships
export interface UserWithChapter extends User {
  chapter?: Chapter;
  role?: Role;
  user_chapter_link?: UserChapterLink;
}

export interface ChapterWithMembers extends Chapter {
  members?: UserWithChapter[];
  member_count?: number;
}

export interface EventWithCreator extends Event {
  creator?: User;
}

export interface NotificationWithEvent extends Notification {
  event?: Event;
}

// Form types
export interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  schoolName: string;
  fraternityName: string;
  chapterCode: string;
  roleName: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ChapterInvite {
  id: string;
  chapter_id: string;
  invited_email: string;
  role: "member" | "officer" | "social_chair";
  token: string;
  status: "pending" | "accepted" | "expired";
  created_at: string;
  expires_at: string;
  invited_by: string;
}

export interface ChapterJoinRequest {
  id: string;
  user_id: string;
  chapter_id: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relationships
export interface ChapterInviteWithDetails extends ChapterInvite {
  chapter?: Chapter;
  inviter?: User;
}

export interface ChapterJoinRequestWithDetails extends ChapterJoinRequest {
  user?: User;
  chapter?: Chapter;
  reviewer?: User;
}

export interface Budget {
  id: string;
  chapter_id: string;
  period: "monthly" | "semester";
  period_label: string;
  total_budget: number;
  created_by: string;
  created_at: string;
}

export interface Expense {
  id: string;
  budget_id: string;
  chapter_id: string;
  submitted_by: string;
  title: string;
  description?: string;
  amount: number;
  category: "alcohol" | "venue" | "decor" | "security" | "misc";
  date_incurred: string;
  receipt_url?: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: string;
  created_at: string;
}

export interface BudgetWithExpenses extends Budget {
  expenses?: Expense[];
  total_spent?: number;
  remaining_budget?: number;
}

export interface ExpenseWithDetails extends Expense {
  budget?: Budget;
  submitter?: User;
  reviewer?: User;
}

// API response types
export interface AuthResponse {
  user?: User;
  chapter?: Chapter;
  role?: Role;
  error?: string;
}

export interface ChapterSetupResponse {
  chapter: Chapter;
  userChapterLink: UserChapterLink;
  isNewChapter: boolean;
}
