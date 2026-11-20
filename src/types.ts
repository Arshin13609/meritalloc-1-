export type UserRole = 'student' | 'recruiter';

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  activeRole: UserRole;
}

export interface StudentSkill {
  name: string;
  level: 1 | 2 | 3 | 4 | 5; // 1 = Beginner, 5 = Expert
}

export interface Student {
  id: string;
  uid?: string;
  name: string;
  email?: string;
  university: string;
  major: string;
  graduationYear: number;
  gpa: number;
  preferredTrack: string;
  availability: 'Full-time (12 wks)' | 'Full-time (16 wks)' | 'Part-time (20 hrs/wk)';
  projectsSummary: string;
  skills: StudentSkill[];
  avatarUrl?: string;
  isPublished?: boolean;
}

export interface RequiredSkill {
  name: string;
  minLevel: 1 | 2 | 3 | 4 | 5;
  weight: 'Core' | 'Important' | 'Preferred';
}

export interface Internship {
  id: string;
  recruiterId?: string;
  recruiterName?: string;
  title: string;
  company: string;
  department: string;
  location: string;
  duration: string;
  stipend: string;
  seats: number;
  minGpa: number;
  description: string;
  requiredSkills: RequiredSkill[];
  isOpen?: boolean;
  isStarterRole?: boolean;
}

export interface SkillMatchDetail {
  skill: string;
  studentLevel: number;
  requiredLevel: number;
  contributionPercent: number;
  note: string;
}

export interface SkillGapDetail {
  skill: string;
  requiredLevel: number;
  studentLevel: number;
  severity: 'High' | 'Moderate' | 'Minor';
  upskillingTip: string;
}

export interface InternshipCapabilityScore {
  internshipId: string;
  capabilityPercent: number;
  coreSkillMatchPercent: number;
  projectRelevancePercent: number;
  readinessPercent: number;
  matchedSkills: SkillMatchDetail[];
  missingSkills: SkillGapDetail[];
  aiRationale: string;
}

export interface PersistedCapabilityEvaluation extends InternshipCapabilityScore {
  id: string;
  studentId: string;
  recruiterId: string;
  isStarterRole?: boolean;
  allocationStatus: 'Evaluated' | 'Shortlisted' | 'Allocated';
}

export type AllocationStatus = 'Allocated' | 'Waitlisted' | 'Unmatched';

export interface StudentAllocation {
  studentId: string;
  assignedInternshipId: string | null;
  status: AllocationStatus;
  assignedCapabilityPercent: number;
  rankedMatches: InternshipCapabilityScore[];
}

export interface CohortSummary {
  averageCapabilityPercent: number;
  placementRatePercent: number;
  totalSeatsFilled: number;
  totalSeatsAvailable: number;
  executiveInsight: string;
  evaluatedBy: 'gemini-4-hydrogen' | 'baseline-cohort';
  evaluatedAt: string;
}

export interface AllocationResponse {
  allocations: StudentAllocation[];
  summary: CohortSummary;
}
