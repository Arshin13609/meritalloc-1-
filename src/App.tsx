import { useState, useEffect, useMemo, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  GraduationCap,
  Briefcase,
  LayoutGrid,
  LogOut,
  Menu,
  X,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  ensureUserAccount,
  updateUserActiveRole,
  saveStudentProfile,
  saveInternshipRole,
  deleteInternshipRole,
  persistCapabilityEvaluation,
  updateEvaluationAllocationStatus,
  ensureStarterPlatformData,
  seedSampleInternshipsToFirestore,
  seedSampleStudentsToFirestore,
} from './services/firestoreService';
import { INITIAL_INTERNSHIPS, INITIAL_STUDENTS } from './data/seedData';
import type {
  AllocationResponse,
  Internship,
  InternshipCapabilityScore,
  PersistedCapabilityEvaluation,
  Student,
  UserAccount,
  UserRole,
} from './types';
import { AuthGate } from './components/AuthGate';
import { StudentPortalView } from './components/StudentPortalView';
import { RecruiterPortalView } from './components/RecruiterPortalView';
import { OverviewAllocationView } from './components/OverviewAllocationView';
import { AllocationDrawer } from './components/AllocationDrawer';
import { InternshipModal } from './components/InternshipModal';
import { StudentModal } from './components/StudentModal';

type RecruiterTab = 'roles' | 'cohort';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('student');
  const [recruiterTab, setRecruiterTab] = useState<RecruiterTab>('roles');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firestore synced collections
  const [ownStudentProfile, setOwnStudentProfile] = useState<Student | null>(null);
  const [openInternships, setOpenInternships] = useState<Internship[]>([]);
  const [myPostedInternships, setMyPostedInternships] = useState<Internship[]>([]);
  const [publishedStudents, setPublishedStudents] = useState<Student[]>([]);
  const [studentEvaluations, setStudentEvaluations] = useState<
    PersistedCapabilityEvaluation[]
  >([]);
  const [ownRecruiterEvaluations, setOwnRecruiterEvaluations] = useState<
    PersistedCapabilityEvaluation[]
  >([]);
  const [starterRoleEvaluations, setStarterRoleEvaluations] = useState<
    PersistedCapabilityEvaluation[]
  >([]);

  const seededRolesForUidRef = useRef<string | null>(null);
  const seededCohortForUidRef = useRef<string | null>(null);

  // Action states
  const [isScoringStudent, setIsScoringStudent] = useState(false);
  const [isEvaluatingRole, setIsEvaluatingRole] = useState(false);
  const [isAllocatingCohort, setIsAllocatingCohort] = useState(false);
  const [evaluatingSingleId, setEvaluatingSingleId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modals / drawers for Recruiter Cohort Matrix
  const [internshipModalTarget, setInternshipModalTarget] = useState<
    Internship | null | 'new'
  >(null);
  const [studentModalTarget, setStudentModalTarget] = useState<Student | null | 'new'>(
    null
  );
  const [drawerStudentId, setDrawerStudentId] = useState<string | null>(null);
  const [cohortAllocationOverride, setCohortAllocationOverride] =
    useState<AllocationResponse | null>(null);

  // 1. Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const pendingRole = (sessionStorage.getItem('meritalloc_pending_role') as UserRole | null) ?? undefined;
          sessionStorage.removeItem('meritalloc_pending_role');
          const acct = await ensureUserAccount(user, pendingRole);
          setUserAccount(acct);
          setActiveRole(acct.activeRole);
        } catch (err) {
          setAuthError(
            err instanceof Error ? err.message : 'Unable to load user account.'
          );
        }
      } else {
        setUserAccount(null);
        setOwnStudentProfile(null);
        setOpenInternships([]);
        setMyPostedInternships([]);
        setPublishedStudents([]);
        setStudentEvaluations([]);
        setOwnRecruiterEvaluations([]);
        setStarterRoleEvaluations([]);
        seededRolesForUidRef.current = null;
        seededCohortForUidRef.current = null;
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // 2. Ensure shared already-posted roles (and sample cohort in Recruiter view) exist in Firestore
  useEffect(() => {
    if (!authReady || !firebaseUser || !userAccount) return;
    const uid = firebaseUser.uid;
    const displayName =
      userAccount.displayName || firebaseUser.displayName || 'Campus Partner';

    const shouldSeedRoles = seededRolesForUidRef.current !== uid;
    const shouldSeedCohort =
      activeRole === 'recruiter' &&
      userAccount.activeRole === 'recruiter' &&
      seededCohortForUidRef.current !== uid;

    if (!shouldSeedRoles && !shouldSeedCohort) return;

    if (shouldSeedRoles) seededRolesForUidRef.current = uid;
    if (shouldSeedCohort) seededCohortForUidRef.current = uid;

    ensureStarterPlatformData(
      uid,
      displayName,
      INITIAL_INTERNSHIPS,
      INITIAL_STUDENTS,
      shouldSeedCohort
    ).catch((err) => {
      console.error('Starter platform seed check failed:', err);
    });
  }, [authReady, firebaseUser, activeRole, userAccount]);

  // 3. Firestore real-time listeners (strictly gated on authReady && firebaseUser)
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const uid = firebaseUser.uid;

    // Own student profile
    const unsubOwnProfile = onSnapshot(
      doc(db, 'studentProfiles', uid),
      (snap) => {
        if (snap.exists()) {
          setOwnStudentProfile({ id: snap.id, ...(snap.data() as Omit<Student, 'id'>) });
        } else {
          setOwnStudentProfile(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `studentProfiles/${uid}`)
    );

    // All open internships (shared across Student View and Recruiter View)
    const unsubOpenInternships = onSnapshot(
      query(collection(db, 'internships'), where('isOpen', '==', true)),
      (snap) => {
        setOpenInternships(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Internship, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'internships')
    );

    // Recruiter's own posted internships (including closed ones)
    const unsubMyInternships = onSnapshot(
      query(collection(db, 'internships'), where('recruiterId', '==', uid)),
      (snap) => {
        setMyPostedInternships(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Internship, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'internships')
    );

    // All published students (for Recruiter View)
    const unsubStudents = onSnapshot(
      query(collection(db, 'studentProfiles'), where('isPublished', '==', true)),
      (snap) => {
        setPublishedStudents(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'studentProfiles')
    );

    // Evaluations for this student
    const unsubStudentEvals = onSnapshot(
      query(collection(db, 'capabilityEvaluations'), where('studentId', '==', uid)),
      (snap) => {
        setStudentEvaluations(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PersistedCapabilityEvaluation, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'capabilityEvaluations')
    );

    // Evaluations for roles posted by this recruiter
    const unsubRecruiterEvals = onSnapshot(
      query(collection(db, 'capabilityEvaluations'), where('recruiterId', '==', uid)),
      (snap) => {
        setOwnRecruiterEvaluations(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PersistedCapabilityEvaluation, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'capabilityEvaluations')
    );

    // Evaluations for shared already-posted starter roles
    const unsubStarterEvals = onSnapshot(
      query(collection(db, 'capabilityEvaluations'), where('isStarterRole', '==', true)),
      (snap) => {
        setStarterRoleEvaluations(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PersistedCapabilityEvaluation, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'capabilityEvaluations')
    );

    return () => {
      unsubOwnProfile();
      unsubOpenInternships();
      unsubMyInternships();
      unsubStudents();
      unsubStudentEvals();
      unsubRecruiterEvals();
      unsubStarterEvals();
    };
  }, [authReady, firebaseUser]);

  // Unified posted roles list: shared starter roles + recruiter's own posted roles (deduplicated)
  const recruiterVisibleRoles = useMemo(() => {
    const map = new Map<string, Internship>();
    for (const r of openInternships) {
      if (r.isStarterRole || r.recruiterId === firebaseUser?.uid) {
        map.set(r.id, r);
      }
    }
    for (const r of myPostedInternships) map.set(r.id, r);
    return Array.from(map.values());
  }, [openInternships, myPostedInternships, firebaseUser?.uid]);

  // Unified evaluations list for Recruiter View
  const recruiterEvaluations = useMemo(() => {
    const map = new Map<string, PersistedCapabilityEvaluation>();
    for (const e of starterRoleEvaluations) map.set(e.id, e);
    for (const e of ownRecruiterEvaluations) map.set(e.id, e);
    return Array.from(map.values());
  }, [starterRoleEvaluations, ownRecruiterEvaluations]);

  // Build AllocationResponse from Firestore data for Recruiter Cohort Matrix tab
  const derivedCohortAllocation = useMemo<AllocationResponse>(() => {
    if (cohortAllocationOverride) return cohortAllocationOverride;

    const allocations = publishedStudents.map((stu) => {
      const stuEvals = recruiterEvaluations
        .filter((e) => e.studentId === stu.id)
        .sort((a, b) => b.capabilityPercent - a.capabilityPercent);

      const allocatedEval = stuEvals.find((e) => e.allocationStatus === 'Allocated');
      const topEval = allocatedEval ?? stuEvals[0];

      return {
        studentId: stu.id,
        assignedInternshipId: allocatedEval ? allocatedEval.internshipId : null,
        status: allocatedEval
          ? ('Allocated' as const)
          : topEval && topEval.capabilityPercent >= 55
            ? ('Waitlisted' as const)
            : ('Unmatched' as const),
        assignedCapabilityPercent: topEval?.capabilityPercent ?? 0,
        rankedMatches: stuEvals,
      };
    });

    const allocated = allocations.filter((a) => a.status === 'Allocated');
    const totalSeats = recruiterVisibleRoles.reduce((s, i) => s + i.seats, 0);
    const avgCap =
      allocated.length > 0
        ? Math.round(
            allocated.reduce((s, a) => s + a.assignedCapabilityPercent, 0) /
              allocated.length
          )
        : 0;

    return {
      allocations,
      summary: {
        averageCapabilityPercent: avgCap,
        placementRatePercent:
          publishedStudents.length > 0
            ? Math.round((allocated.length / publishedStudents.length) * 100)
            : 0,
        totalSeatsFilled: allocated.length,
        totalSeatsAvailable: totalSeats,
        executiveInsight:
          recruiterVisibleRoles.length === 0
            ? 'Post an internship role to begin scoring candidate capability percentages.'
            : `Tracking ${publishedStudents.length} published students across ${recruiterVisibleRoles.length} posted roles.`,
        evaluatedBy: 'gemini-4-hydrogen',
        evaluatedAt: 'Synced with Firestore',
      },
    };
  }, [
    cohortAllocationOverride,
    publishedStudents,
    recruiterEvaluations,
    recruiterVisibleRoles,
  ]);

  const handleSubmitCredentials = async ({
    mode,
    username,
    password,
    role,
  }: {
    mode: 'signin' | 'signup';
    username: string;
    password: string;
    role: UserRole;
  }) => {
    setAuthError(null);
    const cleanUsername = username.trim().toLowerCase();
    const authEmail = cleanUsername.includes('@')
      ? cleanUsername
      : `${cleanUsername}@meritalloc.app`;

    sessionStorage.setItem('meritalloc_pending_role', role);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, authEmail, password);
        await updateProfile(cred.user, { displayName: username.trim() });
        const acct = await ensureUserAccount(
          { ...cred.user, displayName: username.trim() } as User,
          role
        );
        setUserAccount(acct);
        setActiveRole(acct.activeRole);
      } else {
        const cred = await signInWithEmailAndPassword(auth, authEmail, password);
        const acct = await ensureUserAccount(cred.user, role);
        setUserAccount(acct);
        setActiveRole(acct.activeRole);
      }
    } catch (err: unknown) {
      sessionStorage.removeItem('meritalloc_pending_role');
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/operation-not-allowed') {
        setAuthError(
          'Email/Password sign-in is not enabled yet in Firebase Console. Enable Authentication > Sign-in method > Email/Password for project nth-instrument-c7cvm.'
        );
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setAuthError(
          'Invalid username or password. If you are new, switch to "Create Account".'
        );
      } else if (code === 'auth/email-already-in-use') {
        setAuthError('That username is already taken. Switch to "Sign In" or choose another username.');
      } else if (code === 'auth/weak-password') {
        setAuthError('Password must be at least 6 characters.');
      } else {
        setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
      }
    }
  };

  const handleSwitchRole = async (nextRole: UserRole) => {
    if (firebaseUser) {
      try {
        await updateUserActiveRole(firebaseUser.uid, nextRole);
        setUserAccount((prev) => (prev ? { ...prev, activeRole: nextRole } : prev));
        setActiveRole(nextRole);
      } catch (err: unknown) {
        setApiError(err instanceof Error ? err.message : 'Could not update role.');
      }
    } else {
      setActiveRole(nextRole);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  // Student Action: Save profile + score against all open internships
  const handleSaveStudentProfileAndEvaluate = async (
    profile: Omit<Student, 'id' | 'uid' | 'email'>,
    hasExistingProfile: boolean
  ) => {
    if (!firebaseUser) return;
    setApiError(null);
    setIsScoringStudent(true);
    try {
      await saveStudentProfile(firebaseUser.uid, firebaseUser.uid, profile, hasExistingProfile);

      if (openInternships.length > 0) {
        const fullStudent: Student = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          ...profile,
        };
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/evaluate-student`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student: fullStudent,
            internships: openInternships,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to score internship capability.');
        }

        const rankedMatches = (data.rankedMatches ?? []) as InternshipCapabilityScore[];
        const existingMap = new Map(
          studentEvaluations.map((e) => [e.internshipId, e.allocationStatus])
        );

        await Promise.all(
          rankedMatches.map((score) => {
            const role = openInternships.find((i) => i.id === score.internshipId);
            if (!role) return Promise.resolve();
            return persistCapabilityEvaluation(
              firebaseUser.uid,
              role,
              score,
              existingMap.get(role.id) ?? 'Evaluated'
            );
          })
        );
      }
    } catch (err: unknown) {
      setApiError(
        err instanceof Error ? err.message : 'Failed to save and score profile.'
      );
    } finally {
      setIsScoringStudent(false);
    }
  };

  // Student Action: Recalculate capability % for existing saved profile
  const handleRecalculateStudentMatches = async () => {
    if (!firebaseUser || !ownStudentProfile || openInternships.length === 0) return;
    setApiError(null);
    setIsScoringStudent(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/evaluate-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: ownStudentProfile,
          internships: openInternships,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to score internships.');

      const rankedMatches = (data.rankedMatches ?? []) as InternshipCapabilityScore[];
      const existingMap = new Map(
        studentEvaluations.map((e) => [e.internshipId, e.allocationStatus])
      );

      await Promise.all(
        rankedMatches.map((score) => {
          const role = openInternships.find((i) => i.id === score.internshipId);
          if (!role) return Promise.resolve();
          return persistCapabilityEvaluation(
            firebaseUser.uid,
            role,
            score,
            existingMap.get(role.id) ?? 'Evaluated'
          );
        })
      );
    } catch (err: unknown) {
      setApiError(
        err instanceof Error ? err.message : 'Unable to recalculate capability percentages.'
      );
    } finally {
      setIsScoringStudent(false);
    }
  };

  // Recruiter Action: Evaluate all published students for a specific posted role
  const handleEvaluateRoleCandidates = async (role: Internship) => {
    if (!firebaseUser || publishedStudents.length === 0) return;
    setApiError(null);
    setIsEvaluatingRole(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/evaluate-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internship: role,
          students: publishedStudents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to score candidates for this role.');
      }

      const studentScores = (data.studentScores ?? []) as Array<
        InternshipCapabilityScore & { studentId: string }
      >;

      const existingStatusMap = new Map(
        recruiterEvaluations
          .filter((e) => e.internshipId === role.id)
          .map((e) => [e.studentId, e.allocationStatus])
      );

      await Promise.all(
        studentScores.map((score) =>
          persistCapabilityEvaluation(
            score.studentId,
            role,
            score,
            existingStatusMap.get(score.studentId) ?? 'Evaluated'
          )
        )
      );
    } catch (err: unknown) {
      setApiError(
        err instanceof Error ? err.message : 'Failed to score candidates for role.'
      );
    } finally {
      setIsEvaluatingRole(false);
    }
  };

  // Recruiter Action: Full Cohort AI Allocation across posted roles
  const handleRunCohortAllocation = async () => {
    if (
      !firebaseUser ||
      recruiterVisibleRoles.length === 0 ||
      publishedStudents.length === 0
    ) {
      setApiError(
        'Ensure you have at least one posted internship role and one published student candidate.'
      );
      return;
    }
    setApiError(null);
    setIsAllocatingCohort(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: publishedStudents,
          internships: recruiterVisibleRoles,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Allocation failed.');
      const result = data as AllocationResponse;
      setCohortAllocationOverride(result);

      // Persist evaluations & allocated statuses back to Firestore
      await Promise.all(
        result.allocations.flatMap((alloc) =>
          alloc.rankedMatches.map((score) => {
            const role = recruiterVisibleRoles.find((r) => r.id === score.internshipId);
            if (!role) return Promise.resolve();
            const isAssigned =
              alloc.status === 'Allocated' &&
              alloc.assignedInternshipId === score.internshipId;
            return persistCapabilityEvaluation(
              alloc.studentId,
              role,
              score,
              undefined,
              isAssigned ? 'Allocated' : 'Evaluated'
            );
          })
        )
      );
    } catch (err: unknown) {
      setApiError(
        err instanceof Error ? err.message : 'Failed to run cohort allocation.'
      );
    } finally {
      setIsAllocatingCohort(false);
    }
  };

  // Recruiter Action: Save new or edited internship role
  const handleSaveInternshipRole = async (internship: Internship) => {
    if (!firebaseUser) return;
    setApiError(null);
    const isExisting = recruiterVisibleRoles.some((i) => i.id === internship.id);
    try {
      await saveInternshipRole(
        firebaseUser.uid,
        userAccount?.displayName || firebaseUser.displayName || 'Recruiter',
        internship,
        isExisting
      );
      setInternshipModalTarget(null);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to save internship role.');
    }
  };

  // Recruiter Action: Add candidate manually in Cohort Matrix
  const handleSaveCandidateFromRecruiter = async (
    student: Student,
    runAiEvaluate: boolean
  ) => {
    if (!firebaseUser) return;
    setApiError(null);
    const isExisting = publishedStudents.some((s) => s.id === student.id);
    const profileId = isExisting
      ? student.id
      : `cand_${firebaseUser.uid.slice(0, 8)}_${Date.now()}`;
    try {
      await saveStudentProfile(firebaseUser.uid, profileId, student, isExisting);
      setStudentModalTarget(null);

      if (runAiEvaluate && recruiterVisibleRoles.length > 0) {
        setEvaluatingSingleId(profileId);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/evaluate-student`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student: { ...student, id: profileId },
            internships: recruiterVisibleRoles,
          }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.rankedMatches)) {
          await Promise.all(
            (data.rankedMatches as InternshipCapabilityScore[]).map((score) => {
              const role = recruiterVisibleRoles.find((r) => r.id === score.internshipId);
              if (!role) return Promise.resolve();
              return persistCapabilityEvaluation(profileId, role, score, 'Evaluated');
            })
          );
        }
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to save candidate.');
    } finally {
      setEvaluatingSingleId(null);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-sm text-slate-600">Loading MeritAlloc...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <AuthGate
        onSubmitCredentials={handleSubmitCredentials}
        authError={authError}
      />
    );
  }

  const drawerStudent =
    publishedStudents.find((s) => s.id === drawerStudentId) ?? null;
  const drawerAllocation =
    derivedCohortAllocation.allocations.find(
      (a) => a.studentId === drawerStudentId
    ) ?? null;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
      {/* Left Sidebar */}
      <aside className="hidden md:flex md:w-[260px] md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            MeritAlloc
          </span>
        </div>

        <div className="p-4 border-b border-slate-200 space-y-2">
          <p className="text-[11px] font-semibold text-slate-500">Workspace Role</p>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => handleSwitchRole('student')}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeRole === 'student'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              Student
            </button>
            <button
              type="button"
              onClick={() => handleSwitchRole('recruiter')}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeRole === 'recruiter'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              Recruiter
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1" aria-label="Role navigation">
          {activeRole === 'student' ? (
            <div className="px-3 py-2 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-900">Student View Active</p>
              <p className="leading-relaxed">
                Edit your profile &amp; skills to compute capability percentages across all open internships.
              </p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setRecruiterTab('roles')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  recruiterTab === 'roles'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4 shrink-0" />
                <span>Posted Roles &amp; Fit</span>
              </button>
              <button
                type="button"
                onClick={() => setRecruiterTab('cohort')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  recruiterTab === 'cohort'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span>Allocation Matrix</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {userAccount?.displayName || firebaseUser.displayName || 'Signed-in User'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              Signed in as {activeRole === 'student' ? 'Student' : 'Recruiter'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-white h-full border-r border-slate-200 flex flex-col">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
              <span className="font-display text-lg font-bold text-slate-900">
                MeritAlloc
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 space-y-2">
              <p className="text-[11px] font-semibold text-slate-500">Workspace Role</p>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    handleSwitchRole('student');
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1.5 text-xs font-medium rounded-md ${
                    activeRole === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSwitchRole('recruiter');
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1.5 text-xs font-medium rounded-md ${
                    activeRole === 'recruiter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Recruiter
                </button>
              </div>
            </div>

            {activeRole === 'recruiter' && (
              <nav className="flex-1 p-4 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setRecruiterTab('roles');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                    recruiterTab === 'roles' ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  Posted Roles &amp; Fit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecruiterTab('cohort');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                    recruiterTab === 'cohort' ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  Allocation Matrix
                </button>
              </nav>
            )}

            <div className="mt-auto p-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 md:pl-[260px] flex flex-col min-w-0">
        {/* Top Bar Contract */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 whitespace-nowrap hidden sm:inline">
                {activeRole === 'student' ? 'Student Portal' : 'Recruiter Portal'}
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-semibold text-slate-900 truncate">
                {activeRole === 'student'
                  ? 'Internship Capability & Profile'
                  : recruiterTab === 'roles'
                    ? 'Posted Roles & Candidate Capability'
                    : 'Cohort Allocation Matrix'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {activeRole === 'recruiter' ? (
              <button
                type="button"
                onClick={() => setInternshipModalTarget('new')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Post Role
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRecalculateStudentMatches}
                disabled={isScoringStudent || !ownStudentProfile || openInternships.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isScoringStudent ? 'Scoring...' : 'Refresh Capability %'}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto space-y-6">
          {apiError && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start justify-between gap-4 text-xs text-red-800"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Action Could Not Complete</p>
                  <p className="mt-0.5 text-red-700">{apiError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApiError(null)}
                aria-label="Dismiss error"
                className="text-red-700 hover:text-red-900 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeRole === 'student' ? (
            <StudentPortalView
              uid={firebaseUser.uid}
              defaultDisplayName={
                firebaseUser.displayName || userAccount?.displayName || ''
              }
              savedProfile={ownStudentProfile}
              internships={openInternships}
              evaluations={studentEvaluations}
              isSavingAndScoring={isScoringStudent}
              onSaveProfileAndEvaluate={handleSaveStudentProfileAndEvaluate}
              onRecalculateAll={handleRecalculateStudentMatches}
              onSeedStarterInternships={() =>
                seedSampleInternshipsToFirestore(
                  firebaseUser.uid,
                  firebaseUser.displayName || 'Campus Partner',
                  INITIAL_INTERNSHIPS
                )
              }
            />
          ) : recruiterTab === 'roles' ? (
            <RecruiterPortalView
              recruiterId={firebaseUser.uid}
              myInternships={recruiterVisibleRoles}
              students={publishedStudents}
              evaluations={recruiterEvaluations}
              isEvaluatingRole={isEvaluatingRole}
              onPostNewRole={() => setInternshipModalTarget('new')}
              onEditRole={(role) => setInternshipModalTarget(role)}
              onDeleteRole={async (roleId) => {
                try {
                  await deleteInternshipRole(roleId);
                } catch (err: unknown) {
                  setApiError(
                    err instanceof Error ? err.message : 'Failed to delete role.'
                  );
                }
              }}
              onEvaluateRoleCandidates={handleEvaluateRoleCandidates}
              onUpdateCandidateStatus={async (evalId, status) => {
                try {
                  await updateEvaluationAllocationStatus(evalId, status);
                } catch (err: unknown) {
                  setApiError(
                    err instanceof Error ? err.message : 'Failed to update status.'
                  );
                }
              }}
              onSeedStarterRoles={() =>
                seedSampleInternshipsToFirestore(
                  firebaseUser.uid,
                  userAccount?.displayName || firebaseUser.displayName || 'Recruiter',
                  INITIAL_INTERNSHIPS
                )
              }
              onSeedSampleStudents={() =>
                seedSampleStudentsToFirestore(firebaseUser.uid, INITIAL_STUDENTS)
              }
            />
          ) : (
            <OverviewAllocationView
              students={publishedStudents}
              internships={recruiterVisibleRoles}
              allocationData={derivedCohortAllocation}
              isAllocating={isAllocatingCohort}
              onSelectStudent={(id) => setDrawerStudentId(id)}
              onRunAllocation={handleRunCohortAllocation}
              onOpenAddStudent={() => setStudentModalTarget('new')}
            />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      {internshipModalTarget !== null && (
        <InternshipModal
          initialInternship={
            internshipModalTarget === 'new' ? null : internshipModalTarget
          }
          onClose={() => setInternshipModalTarget(null)}
          onSave={handleSaveInternshipRole}
        />
      )}

      {studentModalTarget !== null && (
        <StudentModal
          initialStudent={studentModalTarget === 'new' ? null : studentModalTarget}
          onClose={() => setStudentModalTarget(null)}
          onSave={handleSaveCandidateFromRecruiter}
        />
      )}

      <AllocationDrawer
        student={drawerStudent}
        allocation={drawerAllocation}
        internships={recruiterVisibleRoles}
        isEvaluating={drawerStudent ? evaluatingSingleId === drawerStudent.id : false}
        onClose={() => setDrawerStudentId(null)}
        onEvaluateStudent={async (stu) => {
          if (!firebaseUser || recruiterVisibleRoles.length === 0) return;
          setEvaluatingSingleId(stu.id);
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/evaluate-student`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ student: stu, internships: recruiterVisibleRoles }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Evaluation failed.');
            await Promise.all(
              ((data.rankedMatches ?? []) as InternshipCapabilityScore[]).map((score) => {
                const role = recruiterVisibleRoles.find((r) => r.id === score.internshipId);
                if (!role) return Promise.resolve();
                return persistCapabilityEvaluation(stu.id, role, score, 'Evaluated');
              })
            );
          } catch (err: unknown) {
            setApiError(
              err instanceof Error ? err.message : 'Unable to evaluate student.'
            );
          } finally {
            setEvaluatingSingleId(null);
          }
        }}
        onManualAssign={async (studentId, internshipId, _cap) => {
          const evalId = `${studentId}__${internshipId}`;
          const existing = recruiterEvaluations.find((e) => e.id === evalId);
          if (existing) {
            await updateEvaluationAllocationStatus(evalId, 'Allocated');
          }
        }}
      />
    </div>
  );
}
