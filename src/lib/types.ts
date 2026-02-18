export type UserType = "student" | "professional";
export type SkillComplexity = "simple" | "moderate" | "complex";
export type SkillStatus = "active" | "inactive";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type TransactionType = "earn" | "spend";

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  fullName: string;
  userType: UserType;
  creditBalance: number;
  role?: UserRole;
  avatarUrl?: string;
  bio?: string;
  joinedAt: string;
  rating: number;
  skillsTaught: number;
  skillsLearned: number;
  profile?: UserProfile;
  stats?: UserStats;
}

export type DisputeStatus = "open" | "in_review" | "resolved" | "closed";

export interface Dispute {
  id: number;
  booking_id: number;
  raised_by_user_id: number;
  status: DisputeStatus;
  subject: string;
  description: string;
  proof_urls?: string[] | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  resolved_by?: number | null;
  resolution_notes?: string | null;
  learner_id?: number;
  teacher_id?: number;
  learner_name?: string;
  teacher_name?: string;
  skill_title?: string;
  raised_by_name?: string;
  booking_status?: string;
  scheduled_at?: string;
  credits_cost?: number;
}

export interface DisputeMessage {
  id: number;
  dispute_id: number;
  sender_id: number;
  content: string;
  is_internal?: boolean;
  created_at: string;
  sender_name?: string;
}

export interface UserProfile {
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  location?: string;
  timezone?: string;
  institution?: string;
  degree?: string;
  graduationYear?: number;
  company?: string;
  jobTitle?: string;
  yearsExperience?: number;
  languages?: string[];
  availabilityStatus?: 'available' | 'busy' | 'away';
  responseTimeHours?: number;
}

export interface UserStats {
  rating: number;
  totalReviews: number;
  skillsTaught: number;
  skillsLearned: number;
  followers: number;
  following: number;
}

export interface Skill {
  id: string;
  userId: string;
  teacherName: string;
  teacherAvatar?: string;
  teacherType: UserType;
  title: string;
  description: string;
  category: string;
  ratePerHour: number;
  complexity: SkillComplexity;
  status: SkillStatus;
  createdAt: string;
}

export interface Booking {
  id: string;
  skillId: string;
  skillTitle: string;
  learnerId: string;
  learnerName: string;
  teacherId: string;
  teacherName: string;
  scheduledAt: string;
  duration: number;
  status: BookingStatus;
  creditsCost: number;
  createdAt: string;
  /** Payment release flow: learner confirmed session completed */
  learner_confirmed_completion?: boolean;
  /** Payment release flow: teacher confirmed session completed */
  teacher_confirmed_completion?: boolean;
  /** Payment released to teacher */
  credits_released?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  bookingId?: string;
  description: string;
  createdAt: string;
  /** For display: who the other party was (learner or teacher name) */
  otherPartyName?: string;
  skillTitle?: string;
  scheduledAt?: string;
  duration?: number;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  bookingId?: string;
  rating: number;
  reviewText?: string;
  reviewType: 'as_teacher' | 'as_learner';
  createdAt: string;
  reviewerName?: string;
  reviewerEmail?: string;
}

export interface SkillRequest {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category?: string;
  preferredRateMax?: number;
  urgency: 'low' | 'medium' | 'high';
  budget?: number;
  status: 'open' | 'in_progress' | 'filled' | 'closed';
  createdAt: string;
  userName?: string;
  userEmail?: string;
  userType?: UserType;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  bookingId?: string;
  lastMessageAt?: string;
  createdAt: string;
  otherUserId?: string;
  otherUserName?: string;
  otherUserEmail?: string;
  otherUserAvatar?: string;
  unreadCount?: number;
  lastMessage?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt?: string;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'booking' | 'review' | 'follow' | 'proposal' | 'system';
  title: string;
  content?: string;
  link?: string;
  readAt?: string;
  createdAt: string;
}

export const SKILL_CATEGORIES = [
  "Development",
  "Design",
  "Music",
  "Languages",
  "Business",
  "Marketing",
  "Photography",
  "Writing",
  "Fitness",
  "Cooking",
] as const;

export function calculateCreditCost(
  ratePerHour: number,
  duration: number,
  userType: UserType,
  transactionType: TransactionType
): number {
  const multiplier =
    userType === "student"
      ? transactionType === "earn"
        ? 1.2
        : 0.8
      : 1;
  return Math.round(ratePerHour * duration * multiplier);
}
