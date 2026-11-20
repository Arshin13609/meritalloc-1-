import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { INITIAL_ALLOCATION_RESULT } from '../data/seedData';
import type {
  Internship,
  InternshipCapabilityScore,
  PersistedCapabilityEvaluation,
  Student,
  UserAccount,
  UserRole,
} from '../types';

function clampStr(val: string | undefined, max: number, fallback = ''): string {
  const clean = (val ?? '').trim();
  const resolved = clean.length > 0 ? clean : fallback.trim();
  return resolved.slice(0, max);
}

export async function ensureUserAccount(
  user: User,
  preferredRole?: UserRole
): Promise<UserAccount> {
  const path = `users/${user.uid}`;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as UserAccount;
      if (preferredRole && data.activeRole !== preferredRole) {
        await updateDoc(ref, {
          activeRole: preferredRole,
          updatedAt: serverTimestamp(),
        });
        return { ...data, activeRole: preferredRole };
      }
      return data;
    }

    const newAccount: UserAccount = {
      uid: user.uid,
      email: clampStr(user.email ?? 'user@example.com', 200),
      displayName: clampStr(user.displayName ?? user.email ?? 'User', 120, 'User'),
      activeRole: preferredRole ?? 'student',
    };

    await setDoc(ref, {
      ...newAccount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newAccount;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateUserActiveRole(uid: string, activeRole: UserRole): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      activeRole,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function saveStudentProfile(
  uid: string,
  profileId: string,
  student: Omit<Student, 'id' | 'uid' | 'email'>,
  isExisting: boolean
): Promise<void> {
  const path = `studentProfiles/${profileId}`;
  const boundedSkills = student.skills.slice(0, 25).map((s) => ({
    name: clampStr(s.name, 80, 'Skill'),
    level: Math.max(1, Math.min(5, Math.round(Number(s.level) || 3))) as 1 | 2 | 3 | 4 | 5,
  }));

  const payload: Record<string, unknown> = {
    uid,
    name: clampStr(student.name, 120, 'Student'),
    university: clampStr(student.university, 150, 'University'),
    major: clampStr(student.major, 150, 'Computer Science'),
    graduationYear: Math.max(2020, Math.min(2035, Math.round(Number(student.graduationYear) || 2027))),
    gpa: Math.max(0, Math.min(4.0, Number(student.gpa) || 3.5)),
    preferredTrack: clampStr(student.preferredTrack, 120, 'Software Engineering'),
    availability: student.availability,
    projectsSummary: clampStr(student.projectsSummary, 2000, 'Academic and engineering projects.'),
    skills: boundedSkills,
    isPublished: true,
    updatedAt: serverTimestamp(),
  };

  if (student.avatarUrl && student.avatarUrl.trim().length > 0) {
    payload.avatarUrl = clampStr(student.avatarUrl, 500);
  }

  try {
    const ref = doc(db, 'studentProfiles', profileId);
    if (isExisting) {
      const { uid: _omitUid, ...updateFields } = payload;
      await updateDoc(ref, updateFields);
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteStudentProfile(profileId: string): Promise<void> {
  const path = `studentProfiles/${profileId}`;
  try {
    await deleteDoc(doc(db, 'studentProfiles', profileId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveInternshipRole(
  uid: string,
  recruiterName: string,
  internship: Internship,
  isExisting: boolean
): Promise<string> {
  const safeId = isExisting
    ? internship.id
    : `int_${uid.slice(0, 8)}_${Date.now()}`;
  const path = `internships/${safeId}`;

  const boundedSkills = internship.requiredSkills.slice(0, 20).map((r) => ({
    name: clampStr(r.name, 80, 'Skill'),
    minLevel: Math.max(1, Math.min(5, Math.round(Number(r.minLevel) || 3))) as 1 | 2 | 3 | 4 | 5,
    weight: r.weight,
  }));

  const payload = {
    recruiterId: uid,
    recruiterName: clampStr(recruiterName, 120, 'Recruiter'),
    title: clampStr(internship.title, 150, 'Engineering Intern'),
    company: clampStr(internship.company, 150, 'Company'),
    department: clampStr(internship.department, 120, 'Engineering'),
    location: clampStr(internship.location, 120, 'Remote'),
    duration: clampStr(internship.duration, 60, '12 Weeks'),
    stipend: clampStr(internship.stipend, 60, '$40/hr'),
    seats: Math.max(1, Math.min(100, Math.round(Number(internship.seats) || 1))),
    minGpa: Math.max(0, Math.min(4.0, Number(internship.minGpa) || 3.0)),
    description: clampStr(internship.description, 2500, 'Internship role.'),
    requiredSkills: boundedSkills,
    isOpen: internship.isOpen ?? true,
    isStarterRole: isExisting ? Boolean(internship.isStarterRole) : false,
    updatedAt: serverTimestamp(),
  };

  try {
    const ref = doc(db, 'internships', safeId);
    if (isExisting) {
      const { recruiterId: _omit, isStarterRole: _omitStarter, ...updateFields } = payload;
      await updateDoc(ref, updateFields);
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
    return safeId;
  } catch (err) {
    handleFirestoreError(err, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteInternshipRole(internshipId: string): Promise<void> {
  const path = `internships/${internshipId}`;
  try {
    await deleteDoc(doc(db, 'internships', internshipId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function persistCapabilityEvaluation(
  studentId: string,
  internship: Internship,
  score: InternshipCapabilityScore,
  existingStatus?: PersistedCapabilityEvaluation['allocationStatus'],
  overrideStatus?: PersistedCapabilityEvaluation['allocationStatus']
): Promise<void> {
  if (!internship.recruiterId) return;
  const evalId = `${studentId}__${internship.id}`;
  const path = `capabilityEvaluations/${evalId}`;

  const payload = {
    studentId,
    internshipId: internship.id,
    recruiterId: internship.recruiterId,
    isStarterRole: Boolean(internship.isStarterRole),
    capabilityPercent: Math.max(0, Math.min(100, Math.round(score.capabilityPercent))),
    coreSkillMatchPercent: Math.max(0, Math.min(100, Math.round(score.coreSkillMatchPercent))),
    projectRelevancePercent: Math.max(0, Math.min(100, Math.round(score.projectRelevancePercent))),
    readinessPercent: Math.max(0, Math.min(100, Math.round(score.readinessPercent))),
    matchedSkills: (score.matchedSkills ?? []).slice(0, 25),
    missingSkills: (score.missingSkills ?? []).slice(0, 25),
    aiRationale: clampStr(score.aiRationale, 1500, 'Evaluated based on skill alignment.'),
    allocationStatus: overrideStatus ?? existingStatus ?? 'Evaluated',
    updatedAt: serverTimestamp(),
  };

  try {
    const ref = doc(db, 'capabilityEvaluations', evalId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const {
        studentId: _s,
        internshipId: _i,
        recruiterId: _r,
        isStarterRole: _sr,
        ...updateFields
      } = payload;
      await updateDoc(ref, updateFields);
    } else {
      await setDoc(ref, payload);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateEvaluationAllocationStatus(
  evalId: string,
  allocationStatus: PersistedCapabilityEvaluation['allocationStatus']
): Promise<void> {
  const path = `capabilityEvaluations/${evalId}`;
  try {
    await updateDoc(doc(db, 'capabilityEvaluations', evalId), {
      allocationStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Ensures the shared pre-posted internship roles, sample student cohort, and baseline
 * capability percentages exist in Firestore so both Recruiter View and Student View
 * show the exact same posted roles and capability percentages immediately.
 */
export async function ensureStarterPlatformData(
  uid: string,
  displayName: string,
  starterInternships: Internship[],
  starterStudents: Student[],
  includeStudentsAndScores: boolean
): Promise<void> {
  const roleRecruiterById = new Map<string, string>();

  // 1. Ensure shared starter internship roles exist with deterministic IDs
  for (const sample of starterInternships) {
    const path = `internships/${sample.id}`;
    const ref = doc(db, 'internships', sample.id);
    let snap;
    try {
      snap = await getDoc(ref);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }

    if (!snap.exists()) {
      try {
        await setDoc(ref, {
          recruiterId: uid,
          recruiterName: clampStr(displayName, 120, 'Campus Partner'),
          title: clampStr(sample.title, 150, 'Engineering Intern'),
          company: clampStr(sample.company, 150, 'Partner Company'),
          department: clampStr(sample.department, 120),
          location: clampStr(sample.location, 120),
          duration: clampStr(sample.duration, 60),
          stipend: clampStr(sample.stipend, 60),
          seats: sample.seats,
          minGpa: sample.minGpa,
          description: clampStr(sample.description, 2500),
          requiredSkills: sample.requiredSkills.slice(0, 20),
          isOpen: true,
          isStarterRole: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        roleRecruiterById.set(sample.id, uid);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } else {
      const existingData = snap.data() as { recruiterId?: string };
      roleRecruiterById.set(sample.id, existingData.recruiterId ?? uid);
    }
  }

  if (!includeStudentsAndScores) return;

  // 2. Ensure sample student cohort exists with deterministic IDs
  for (const stu of starterStudents) {
    const path = `studentProfiles/${stu.id}`;
    const ref = doc(db, 'studentProfiles', stu.id);
    let snap;
    try {
      snap = await getDoc(ref);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }

    if (!snap.exists()) {
      try {
        await setDoc(ref, {
          uid,
          name: clampStr(stu.name, 120, 'Student'),
          university: clampStr(stu.university, 150, 'University'),
          major: clampStr(stu.major, 150, 'Computer Science'),
          graduationYear: stu.graduationYear,
          gpa: stu.gpa,
          preferredTrack: clampStr(stu.preferredTrack, 120),
          availability: stu.availability,
          projectsSummary: clampStr(stu.projectsSummary, 2000),
          skills: stu.skills.slice(0, 25),
          ...(stu.avatarUrl ? { avatarUrl: clampStr(stu.avatarUrl, 500) } : {}),
          isPublished: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  }

  // 3. Seed baseline capability evaluations for the starter roles & cohort
  for (const alloc of INITIAL_ALLOCATION_RESULT.allocations) {
    for (const match of alloc.rankedMatches) {
      const roleRecruiterId = roleRecruiterById.get(match.internshipId);
      if (!roleRecruiterId) continue;

      const evalId = `${alloc.studentId}__${match.internshipId}`;
      const path = `capabilityEvaluations/${evalId}`;
      const isAllocated =
        alloc.status === 'Allocated' &&
        alloc.assignedInternshipId === match.internshipId;

      const ref = doc(db, 'capabilityEvaluations', evalId);
      let snap;
      try {
        snap = await getDoc(ref);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }

      if (!snap.exists()) {
        try {
          await setDoc(ref, {
            studentId: alloc.studentId,
            internshipId: match.internshipId,
            recruiterId: roleRecruiterId,
            isStarterRole: true,
            capabilityPercent: Math.max(0, Math.min(100, Math.round(match.capabilityPercent))),
            coreSkillMatchPercent: Math.max(0, Math.min(100, Math.round(match.coreSkillMatchPercent))),
            projectRelevancePercent: Math.max(0, Math.min(100, Math.round(match.projectRelevancePercent))),
            readinessPercent: Math.max(0, Math.min(100, Math.round(match.readinessPercent))),
            matchedSkills: (match.matchedSkills ?? []).slice(0, 25),
            missingSkills: (match.missingSkills ?? []).slice(0, 25),
            aiRationale: clampStr(match.aiRationale, 1500),
            allocationStatus: isAllocated ? 'Allocated' : 'Evaluated',
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
    }
  }
}

export async function seedSampleInternshipsToFirestore(
  uid: string,
  recruiterName: string,
  samples: Internship[]
): Promise<void> {
  await ensureStarterPlatformData(uid, recruiterName, samples, [], false);
}

export async function seedSampleStudentsToFirestore(
  uid: string,
  samples: Student[]
): Promise<void> {
  await ensureStarterPlatformData(uid, 'Campus Partner', [], samples, true);
}
