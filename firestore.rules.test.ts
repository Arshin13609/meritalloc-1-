/**
 * Security Verification Specification for MeritAlloc Firestore Rules.
 * Covers all 12 adversarial payloads ("Dirty Dozen") against firestore.rules.
 */
export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: 'users' | 'studentProfiles' | 'internships' | 'capabilityEvaluations';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  rationale: string;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Cross-user PII read on /users/{userId}',
    collection: 'users',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    rationale: 'Only request.auth.uid == userId can get /users/{userId}.',
  },
  {
    id: 2,
    name: 'Collection list query on /users',
    collection: 'users',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    rationale: 'allow list: if false prevents PII enumeration.',
  },
  {
    id: 3,
    name: 'Ghost field injection on /studentProfiles',
    collection: 'studentProfiles',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'data.keys().hasOnly(...) rejects unknown properties.',
  },
  {
    id: 4,
    name: 'Identity spoofing on /studentProfiles/{studentId}',
    collection: 'studentProfiles',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'studentId == request.auth.uid && incoming().uid == request.auth.uid enforced.',
  },
  {
    id: 5,
    name: 'Unverified email write on /internships',
    collection: 'internships',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'isVerified() mandates request.auth.token.email_verified == true.',
  },
  {
    id: 6,
    name: 'Recruiter hijack update on another recruiter role',
    collection: 'internships',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'existing().recruiterId == request.auth.uid enforced.',
  },
  {
    id: 7,
    name: 'Immutable createdAt / uid mutation on update',
    collection: 'studentProfiles',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'incoming().uid == existing().uid && incoming().createdAt == existing().createdAt.',
  },
  {
    id: 8,
    name: 'Client-spoofed timestamp on create',
    collection: 'internships',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'incoming().createdAt == request.time && incoming().updatedAt == request.time.',
  },
  {
    id: 9,
    name: 'Path variable ID poisoning (>128 chars or invalid chars)',
    collection: 'internships',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'isValidId(internshipId) enforces regex and length <= 128.',
  },
  {
    id: 10,
    name: 'Array exhaustion (>25 skills)',
    collection: 'studentProfiles',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'data.skills.size() <= 25 bounds array length.',
  },
  {
    id: 11,
    name: 'Third-party evaluation spoofing',
    collection: 'capabilityEvaluations',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'Requires studentId == request.auth.uid or verified recruiterId == request.auth.uid.',
  },
  {
    id: 12,
    name: 'Student self-allocation privilege escalation',
    collection: 'capabilityEvaluations',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'Students may only set allocationStatus == "Evaluated"; only owning recruiter may shortlist or allocate.',
  },
];
