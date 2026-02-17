import { User, Skill, Booking, Transaction } from "./types";

export const mockUsers: User[] = [
  { id: "u1", email: "alex@example.com", fullName: "Alex Chen", userType: "professional", creditBalance: 340, avatarUrl: "", bio: "Full-stack developer with 8 years of experience.", joinedAt: "2025-06-15", rating: 4.9, skillsTaught: 24, skillsLearned: 8 },
  { id: "u2", email: "maya@example.com", fullName: "Maya Johnson", userType: "student", creditBalance: 180, avatarUrl: "", bio: "Design student passionate about UI/UX.", joinedAt: "2025-08-02", rating: 4.7, skillsTaught: 6, skillsLearned: 15 },
  { id: "u3", email: "sam@example.com", fullName: "Sam Patel", userType: "professional", creditBalance: 520, avatarUrl: "", bio: "Music producer and guitar instructor.", joinedAt: "2025-05-20", rating: 5.0, skillsTaught: 32, skillsLearned: 4 },
  { id: "u4", email: "lena@example.com", fullName: "Lena Müller", userType: "student", creditBalance: 90, avatarUrl: "", bio: "Learning web development and data science.", joinedAt: "2025-09-10", rating: 4.5, skillsTaught: 3, skillsLearned: 12 },
  { id: "u5", email: "jordan@example.com", fullName: "Jordan Lee", userType: "professional", creditBalance: 410, avatarUrl: "", bio: "Marketing strategist and copywriter.", joinedAt: "2025-04-01", rating: 4.8, skillsTaught: 18, skillsLearned: 7 },
  { id: "u6", email: "priya@example.com", fullName: "Priya Sharma", userType: "student", creditBalance: 150, avatarUrl: "", bio: "Aspiring photographer and videographer.", joinedAt: "2025-10-05", rating: 4.6, skillsTaught: 5, skillsLearned: 9 },
];

export const mockSkills: Skill[] = [
  { id: "s1", userId: "u1", teacherName: "Alex Chen", teacherType: "professional", title: "React & TypeScript Fundamentals", description: "Learn modern React with TypeScript, hooks, state management, and best practices for building scalable web apps.", category: "Development", ratePerHour: 25, complexity: "moderate", status: "active", createdAt: "2025-07-01" },
  { id: "s2", userId: "u2", teacherName: "Maya Johnson", teacherType: "student", title: "Figma UI Design Basics", description: "Master Figma from scratch — components, auto-layout, prototyping, and design systems.", category: "Design", ratePerHour: 15, complexity: "simple", status: "active", createdAt: "2025-08-15" },
  { id: "s3", userId: "u3", teacherName: "Sam Patel", teacherType: "professional", title: "Guitar for Beginners", description: "Acoustic guitar fundamentals: chords, strumming patterns, fingerpicking, and your first songs.", category: "Music", ratePerHour: 20, complexity: "simple", status: "active", createdAt: "2025-06-10" },
  { id: "s4", userId: "u1", teacherName: "Alex Chen", teacherType: "professional", title: "Node.js Backend Development", description: "Build REST APIs with Express, authentication, database integration, and deployment strategies.", category: "Development", ratePerHour: 30, complexity: "complex", status: "active", createdAt: "2025-07-20" },
  { id: "s5", userId: "u5", teacherName: "Jordan Lee", teacherType: "professional", title: "Content Marketing Strategy", description: "Create compelling content strategies, SEO copywriting, and social media planning.", category: "Marketing", ratePerHour: 22, complexity: "moderate", status: "active", createdAt: "2025-05-15" },
  { id: "s6", userId: "u3", teacherName: "Sam Patel", teacherType: "professional", title: "Music Production with Ableton", description: "Learn Ableton Live from beat-making to mixing and mastering your own tracks.", category: "Music", ratePerHour: 28, complexity: "complex", status: "active", createdAt: "2025-06-25" },
  { id: "s7", userId: "u4", teacherName: "Lena Müller", teacherType: "student", title: "Conversational German", description: "Practice everyday German conversation, grammar basics, and pronunciation.", category: "Languages", ratePerHour: 12, complexity: "simple", status: "active", createdAt: "2025-09-20" },
  { id: "s8", userId: "u6", teacherName: "Priya Sharma", teacherType: "student", title: "Mobile Photography Tips", description: "Composition, lighting, editing with free apps, and building your photography portfolio.", category: "Photography", ratePerHour: 10, complexity: "simple", status: "active", createdAt: "2025-10-15" },
  { id: "s9", userId: "u5", teacherName: "Jordan Lee", teacherType: "professional", title: "Business Writing & Copywriting", description: "Write persuasive copy for websites, emails, and ads. Includes headline formulas and frameworks.", category: "Writing", ratePerHour: 20, complexity: "moderate", status: "active", createdAt: "2025-05-30" },
  { id: "s10", userId: "u2", teacherName: "Maya Johnson", teacherType: "student", title: "Watercolor Illustration", description: "Explore watercolor techniques for illustration: washes, layering, color mixing, and composition.", category: "Design", ratePerHour: 14, complexity: "moderate", status: "active", createdAt: "2025-09-01" },
  { id: "s11", userId: "u1", teacherName: "Alex Chen", teacherType: "professional", title: "Python Data Analysis", description: "Pandas, NumPy, and Matplotlib for data cleaning, analysis, and visualization.", category: "Development", ratePerHour: 28, complexity: "complex", status: "active", createdAt: "2025-08-01" },
  { id: "s12", userId: "u4", teacherName: "Lena Müller", teacherType: "student", title: "Intro to Machine Learning", description: "Understand ML concepts, supervised learning, and build your first model with scikit-learn.", category: "Development", ratePerHour: 18, complexity: "complex", status: "active", createdAt: "2025-10-01" },
];

export const mockBookings: Booking[] = [
  { id: "b1", skillId: "s1", skillTitle: "React & TypeScript Fundamentals", learnerId: "u2", learnerName: "Maya Johnson", teacherId: "u1", teacherName: "Alex Chen", scheduledAt: "2026-02-20T14:00:00", duration: 2, status: "confirmed", creditsCost: 40, createdAt: "2026-02-10" },
  { id: "b2", skillId: "s3", skillTitle: "Guitar for Beginners", learnerId: "u4", learnerName: "Lena Müller", teacherId: "u3", teacherName: "Sam Patel", scheduledAt: "2026-02-22T10:00:00", duration: 1, status: "pending", creditsCost: 16, createdAt: "2026-02-12" },
  { id: "b3", skillId: "s5", skillTitle: "Content Marketing Strategy", learnerId: "u6", learnerName: "Priya Sharma", teacherId: "u5", teacherName: "Jordan Lee", scheduledAt: "2026-01-15T16:00:00", duration: 1.5, status: "completed", creditsCost: 26, createdAt: "2026-01-05" },
  { id: "b4", skillId: "s2", skillTitle: "Figma UI Design Basics", learnerId: "u1", learnerName: "Alex Chen", teacherId: "u2", teacherName: "Maya Johnson", scheduledAt: "2026-02-25T11:00:00", duration: 1, status: "confirmed", creditsCost: 15, createdAt: "2026-02-14" },
  { id: "b5", skillId: "s7", skillTitle: "Conversational German", learnerId: "u5", learnerName: "Jordan Lee", teacherId: "u4", teacherName: "Lena Müller", scheduledAt: "2025-12-20T09:00:00", duration: 1, status: "cancelled", creditsCost: 10, createdAt: "2025-12-10" },
];

export const mockTransactions: Transaction[] = [
  { id: "t1", userId: "u1", type: "earn", amount: 50, bookingId: "b1", description: "Taught React & TypeScript to Maya", createdAt: "2026-02-10" },
  { id: "t2", userId: "u1", type: "spend", amount: 15, bookingId: "b4", description: "Learned Figma UI Design from Maya", createdAt: "2026-02-14" },
  { id: "t3", userId: "u1", type: "earn", amount: 60, description: "Taught Node.js Backend to Jordan", createdAt: "2026-01-20" },
  { id: "t4", userId: "u1", type: "spend", amount: 28, description: "Learned Python Data Analysis workshop", createdAt: "2026-01-05" },
  { id: "t5", userId: "u1", type: "earn", amount: 25, description: "Taught React basics to Lena", createdAt: "2025-12-15" },
  { id: "t6", userId: "u1", type: "spend", amount: 20, description: "Learned Content Marketing from Jordan", createdAt: "2025-12-01" },
  { id: "t7", userId: "u1", type: "earn", amount: 75, description: "Taught full-stack workshop (3 hrs)", createdAt: "2025-11-20" },
  { id: "t8", userId: "u1", type: "spend", amount: 12, description: "Learned Conversational German from Lena", createdAt: "2025-11-10" },
];

export const currentUser: User = mockUsers[0];
