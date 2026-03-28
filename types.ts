export type UserRole = 'candidate' | 'recruiter' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'recruiter';
  company?: string;
  avatar?: string;
  skills?: string[];
  subscription?: RecruiterSubscription;
  settings?: {
    darkMode?: boolean;
    blindHiring?: boolean;
  };
}

export interface RecruiterSubscription {
  tier: 'Basic' | 'Pro' | 'Enterprise';
  status: 'active' | 'past_due' | 'none';
  renewsAt: string;
  usage: {
    activeAgents: number;
    maxAgents: number;
    outreachCredits: number;
    maxOutreachCredits: number;
  };
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  REVIEWING = 'REVIEWING',
  INTERVIEWING = 'INTERVIEWING',
  SCHEDULED = 'SCHEDULED',
  REJECTED = 'REJECTED',
  OFFER = 'OFFER'
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  postedAt: string;
  deadline?: string;
  status: 'Open' | 'Closed';
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  appliedAt: string;
  lastStatusUpdateAt?: string;
  status: ApplicationStatus;
  feedback?: string;
  feedbackRating?: number; // 1-5 rating from candidate
  resumeLink?: string;
  resumeSummary?: string;
  skills: string[];
  interviewDate?: string;
  interviewTime?: string;
  aiScore?: number;
  aiReason?: string;
  queuePosition?: number;
  totalApplicants?: number;
  isSharedWithHM?: boolean;
  hmFeedback?: 'approved' | 'rejected' | null;
}

export interface SourcingAgent {
  id: string;
  jobId: string;
  status: 'active' | 'paused';
  criteria: {
    seniority: string;
    industry: string;
    skills: string[];
  };
  outreachEnabled: boolean;
  lastScanAt: string;
  matchesFound: number;
}

export interface ExternalCandidate {
  id: string;
  name: string;
  email: string;
  skills: string[];
  experience: string;
  currentRole: string;
  location: string;
}

export interface FeedbackRequest {
  candidateName: string;
  jobTitle: string;
  reasons: string[];
  tone: 'gentle' | 'direct' | 'encouraging';
}

export interface AvailabilitySlot {
  id: string;
  date: string;
  times: string[];
}

export interface ReputationStats {
  responseRate: number;
  avgResponseTimeDays: number;
  totalApplications: number;
  totalResponded: number;
  feedbackQualityScore: number; // 0-5
  tier: 'Elite' | 'Consistent' | 'Responsive' | 'New';
}

export interface CareerMilestone {
  id: string;
  level: string;
  title: string;
  minSalary: number;
  maxSalary: number;
  avgYears: number;
  requiredSkills: string[];
  certifications: string[];
  description: string;
}

export interface CareerPath {
  id: string;
  name: string;
  industry: string;
  milestones: CareerMilestone[];
}