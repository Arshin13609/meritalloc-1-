import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const bootData = JSON.parse(document.getElementById('boot-data').textContent);
const firebaseConfig = bootData.firebaseConfig || {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const state = {
  authMode: 'signin',
  authRole: 'student',
  user: null,
  activeRole: 'student',
  studentSubTab: 'profile',
  ownProfile: null,
  openInternships: [],
  myInternships: [],
  publishedStudents: [],
  studentEvaluations: [],
  recruiterEvaluations: [],
  selectedRoleId: '',
  isScoring: false,
  unsubs: [],
};

// UI Helpers
const $ = (id) => document.getElementById(id);

function showError(msg) {
  $('api-error-text').textContent = msg;
  $('api-error-banner').classList.remove('hidden');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function capabilityColor(pct) {
  if (pct >= 80) return 'text-emerald-700';
  if (pct >= 60) return 'text-blue-700';
  return 'text-amber-700';
}

// Auth Gate Controls
document.querySelectorAll('.auth-mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.authMode = btn.dataset.authMode;
    document.querySelectorAll('.auth-mode-btn').forEach((b) => {
      const active = b.dataset.authMode === state.authMode;
      b.className = `auth-mode-btn py-1.5 text-xs font-medium rounded-md cursor-pointer ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
      }`;
    });
    $('auth-submit-btn').textContent =
      state.authMode === 'signup' ? 'Create Account' : 'Sign In';
  });
});

document.querySelectorAll('.auth-role-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.authRole = btn.dataset.authRole;
    document.querySelectorAll('.auth-role-btn').forEach((b) => {
      const active = b.dataset.authRole === state.authRole;
      b.className = `auth-role-btn py-2 px-3 text-xs font-medium rounded-lg border cursor-pointer ${
        active
          ? 'border-blue-700 bg-blue-50 text-blue-800'
          : 'border-slate-300 bg-white text-slate-700'
      }`;
    });
  });
});

$('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('auth-error').classList.add('hidden');
  const username = $('auth-username').value.trim().toLowerCase();
  const password = $('auth-password').value;
  const email = username.includes('@') ? username : `${username}@meritalloc.app`;
  sessionStorage.setItem('meritalloc_pending_role', state.authRole);

  try {
    if (state.authMode === 'signup') {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username });
      await ensureUserAccount(cred.user, state.authRole);
    } else {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserAccount(cred.user, state.authRole);
    }
  } catch (err) {
    sessionStorage.removeItem('meritalloc_pending_role');
    $('auth-error').textContent = err.message || 'Authentication failed.';
    $('auth-error').classList.remove('hidden');
  }
});

async function ensureUserAccount(user, preferredRole) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    if (preferredRole && data.activeRole !== preferredRole) {
      await updateDoc(ref, { activeRole: preferredRole, updatedAt: serverTimestamp() });
      return { ...data, activeRole: preferredRole };
    }
    return data;
  }
  const acct = {
    uid: user.uid,
    email: user.email || `${user.uid}@meritalloc.app`,
    displayName: user.displayName || user.email || 'User',
    activeRole: preferredRole || 'student',
  };
  await setDoc(ref, {
    ...acct,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return acct;
}

async function seedStarterDataIfNeeded(uid, displayName, includeCohort) {
  const roleRecruiters = new Map();
  for (const role of bootData.starterInternships) {
    const ref = doc(db, 'internships', role.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        recruiterId: uid,
        recruiterName: displayName || 'Campus Partner',
        title: role.title,
        company: role.company,
        department: role.department,
        location: role.location,
        duration: role.duration,
        stipend: role.stipend,
        seats: role.seats,
        minGpa: role.minGpa,
        description: role.description,
        requiredSkills: role.requiredSkills,
        isOpen: true,
        isStarterRole: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      roleRecruiters.set(role.id, uid);
    } else {
      roleRecruiters.set(role.id, snap.data().recruiterId || uid);
    }
  }

  if (!includeCohort) return;
  for (const stu of bootData.starterStudents) {
    const ref = doc(db, 'studentProfiles', stu.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        name: stu.name,
        university: stu.university,
        major: stu.major,
        graduationYear: stu.graduationYear,
        gpa: stu.gpa,
        preferredTrack: stu.preferredTrack,
        availability: stu.availability,
        projectsSummary: stu.projectsSummary,
        skills: stu.skills,
        isPublished: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}

function attachListeners(uid) {
  state.unsubs.forEach((u) => u());
  state.unsubs = [];

  state.unsubs.push(
    onSnapshot(doc(db, 'studentProfiles', uid), (snap) => {
      state.ownProfile = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      if (state.ownProfile && state.studentSubTab === 'profile' && state.studentEvaluations.length > 0) {
        state.studentSubTab = 'matches';
      }
      render();
    })
  );

  state.unsubs.push(
    onSnapshot(query(collection(db, 'internships'), where('isOpen', '==', true)), (snap) => {
      state.openInternships = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    })
  );

  state.unsubs.push(
    onSnapshot(query(collection(db, 'internships'), where('recruiterId', '==', uid)), (snap) => {
      state.myInternships = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    })
  );

  state.unsubs.push(
    onSnapshot(query(collection(db, 'studentProfiles'), where('isPublished', '==', true)), (snap) => {
      state.publishedStudents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    })
  );

  state.unsubs.push(
    onSnapshot(query(collection(db, 'capabilityEvaluations'), where('studentId', '==', uid)), (snap) => {
      state.studentEvaluations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    })
  );

  state.unsubs.push(
    onSnapshot(query(collection(db, 'capabilityEvaluations'), where('isStarterRole', '==', true)), (snap) => {
      const starter = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      mergeRecruiterEvaluations(starter, null);
    })
  );

  state.unsubs.push(
    onSnapshot(query(collection(db, 'capabilityEvaluations'), where('recruiterId', '==', uid)), (snap) => {
      const own = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      mergeRecruiterEvaluations(null, own);
    })
  );
}

let cachedStarterEvals = [];
let cachedOwnEvals = [];
function mergeRecruiterEvaluations(starter, own) {
  if (starter !== null) cachedStarterEvals = starter;
  if (own !== null) cachedOwnEvals = own;
  const map = new Map();
  for (const e of cachedStarterEvals) map.set(e.id, e);
  for (const e of cachedOwnEvals) map.set(e.id, e);
  state.recruiterEvaluations = Array.from(map.values());
  render();
}

async function persistEvaluation(studentId, role, score, status = 'Evaluated') {
  const evalId = `${studentId}__${role.id}`;
  const ref = doc(db, 'capabilityEvaluations', evalId);
  const snap = await getDoc(ref);
  const payload = {
    capabilityPercent: Math.max(0, Math.min(100, Math.round(score.capabilityPercent))),
    coreSkillMatchPercent: Math.max(0, Math.min(100, Math.round(score.coreSkillMatchPercent))),
    projectRelevancePercent: Math.max(0, Math.min(100, Math.round(score.projectRelevancePercent))),
    readinessPercent: Math.max(0, Math.min(100, Math.round(score.readinessPercent))),
    matchedSkills: (score.matchedSkills || []).slice(0, 25),
    missingSkills: (score.missingSkills || []).slice(0, 25),
    aiRationale: String(score.aiRationale || '').slice(0, 1500),
    allocationStatus: status,
    updatedAt: serverTimestamp(),
  };

  if (snap.exists()) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, {
      studentId,
      internshipId: role.id,
      recruiterId: role.recruiterId,
      isStarterRole: Boolean(role.isStarterRole),
      ...payload,
    });
  }
}

function getRecruiterVisibleRoles() {
  const map = new Map();
  for (const r of state.openInternships) {
    if (r.isStarterRole || r.recruiterId === state.user?.uid) map.set(r.id, r);
  }
  for (const r of state.myInternships) map.set(r.id, r);
  return Array.from(map.values());
}

function render() {
  if (!state.user) return;
  const isStudent = state.activeRole === 'student';

  $('switch-student-btn').className = `py-1.5 text-xs font-medium rounded-md cursor-pointer ${
    isStudent ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
  }`;
  $('switch-recruiter-btn').className = `py-1.5 text-xs font-medium rounded-md cursor-pointer ${
    !isStudent ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
  }`;

  $('sidebar-username').textContent = state.user.displayName || state.user.email;
  $('sidebar-role-label').textContent = `Signed in as ${isStudent ? 'Student' : 'Recruiter'}`;
  $('header-portal-name').textContent = isStudent ? 'Student Portal' : 'Recruiter Portal';
  $('header-title').textContent = isStudent
    ? 'Internship Capability & Profile'
    : 'Posted Roles & Candidate Capability';
  $('header-action-btn').textContent = isStudent
    ? state.isScoring
      ? 'Scoring...'
      : 'Refresh Capability %'
    : 'Post Role';

  $('student-view').classList.toggle('hidden', !isStudent);
  $('recruiter-view').classList.toggle('hidden', isStudent);

  if (isStudent) {
    renderStudentView();
  } else {
    renderRecruiterView();
  }
}

function renderStudentView() {
  const evalMap = new Map(state.studentEvaluations.map((e) => [e.internshipId, e]));
  const profile = state.ownProfile;
  const skillsText = (profile?.skills || [{ name: 'Python', level: 4 }, { name: 'Flask', level: 4 }])
    .map((s) => `${s.name}:${s.level}`)
    .join(', ');

  const sortedRoles = [...state.openInternships].sort(
    (a, b) => (evalMap.get(b.id)?.capabilityPercent ?? -1) - (evalMap.get(a.id)?.capabilityPercent ?? -1)
  );

  $('student-view').innerHTML = `
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">Student Workspace</h2>
        <p class="text-xs text-slate-500">Save your info &amp; skills to calculate your AI capability % for each posted internship.</p>
      </div>
      <div class="flex gap-1 p-1 bg-slate-200/70 rounded-lg">
        <button type="button" id="tab-stu-profile" class="px-3.5 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
          state.studentSubTab === 'profile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
        }">My Profile &amp; Skills</button>
        <button type="button" id="tab-stu-matches" class="px-3.5 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
          state.studentSubTab === 'matches' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
        }">Internships &amp; Capability % (${state.openInternships.length})</button>
      </div>
    </div>

    ${
      state.studentSubTab === 'profile'
        ? `
      <form id="student-profile-form" class="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 class="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">Basic Information &amp; Technical Skills</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
            <input name="name" required value="${escapeHtml(profile?.name || state.user.displayName || '')}" class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">University</label>
            <input name="university" required value="${escapeHtml(profile?.university || '')}" placeholder="e.g., Stanford University" class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Major</label>
            <input name="major" required value="${escapeHtml(profile?.major || 'B.S. Computer Science')}" class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">GPA (4.0)</label>
            <input name="gpa" type="number" step="0.01" min="0" max="4" value="${profile?.gpa ?? 3.6}" class="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Technical Skills (Format: Skill:Level, e.g. Python:5, Flask:4, SQL:4)</label>
          <input name="skills" required value="${escapeHtml(skillsText)}" class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Projects Summary</label>
          <textarea name="projectsSummary" rows="3" class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2">${escapeHtml(profile?.projectsSummary || '')}</textarea>
        </div>
        <div class="flex justify-end">
          <button type="submit" ${state.isScoring ? 'disabled' : ''} class="px-5 py-2.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer">
            ${state.isScoring ? 'Saving &amp; Scoring...' : 'Save Profile &amp; Calculate Capability %'}
          </button>
        </div>
      </form>`
        : `
      <section class="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
              <th class="py-2.5 px-4">Internship Role</th>
              <th class="py-2.5 px-4">Required Skills</th>
              <th class="py-2.5 px-4">Your Capability %</th>
              <th class="py-2.5 px-4">AI Rationale</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 text-sm">
            ${sortedRoles
              .map((role) => {
                const ev = evalMap.get(role.id);
                return `
                <tr class="hover:bg-slate-50">
                  <td class="py-3 px-4">
                    <p class="font-semibold text-slate-900">${escapeHtml(role.title)}</p>
                    <p class="text-xs text-slate-500">${escapeHtml(role.company)} · ${escapeHtml(role.location)} · ${escapeHtml(role.stipend)}</p>
                  </td>
                  <td class="py-3 px-4 text-xs text-slate-600">${escapeHtml((role.requiredSkills || []).map((r) => r.name).join(' · '))}</td>
                  <td class="py-3 px-4 font-mono font-semibold ${ev ? capabilityColor(ev.capabilityPercent) : 'text-slate-400'}">
                    ${ev ? `${ev.capabilityPercent}%` : 'Save profile to score'}
                  </td>
                  <td class="py-3 px-4 text-xs text-slate-600 max-w-md">${escapeHtml(ev?.aiRationale || '—')}</td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </section>`
    }
  `;

  $('tab-stu-profile').onclick = () => {
    state.studentSubTab = 'profile';
    render();
  };
  $('tab-stu-matches').onclick = () => {
    state.studentSubTab = 'matches';
    render();
  };

  const form = $('student-profile-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const parsedSkills = String(fd.get('skills') || '')
        .split(',')
        .map((chunk) => {
          const [rawName, rawLvl] = chunk.split(':');
          return {
            name: (rawName || '').trim(),
            level: Math.max(1, Math.min(5, parseInt(rawLvl || '3', 10) || 3)),
          };
        })
        .filter((s) => s.name.length > 0);

      const profilePayload = {
        uid: state.user.uid,
        name: String(fd.get('name') || '').trim(),
        university: String(fd.get('university') || '').trim(),
        major: String(fd.get('major') || '').trim(),
        graduationYear: 2027,
        gpa: Math.max(0, Math.min(4.0, parseFloat(fd.get('gpa') || '3.5') || 3.5)),
        preferredTrack: 'Software Engineering',
        availability: 'Full-time (12 wks)',
        projectsSummary: String(fd.get('projectsSummary') || '').trim() || 'Academic engineering projects.',
        skills: parsedSkills,
        isPublished: true,
        updatedAt: serverTimestamp(),
      };

      state.isScoring = true;
      render();
      try {
        const ref = doc(db, 'studentProfiles', state.user.uid);
        if (state.ownProfile) {
          const { uid: _u, ...upd } = profilePayload;
          await updateDoc(ref, upd);
        } else {
          await setDoc(ref, { ...profilePayload, createdAt: serverTimestamp() });
        }
        await scoreStudentAgainstOpenRoles({ id: state.user.uid, ...profilePayload });
        state.studentSubTab = 'matches';
      } catch (err) {
        showError(err.message || 'Unable to save and score student profile.');
      } finally {
        state.isScoring = false;
        render();
      }
    };
  }
}

async function scoreStudentAgainstOpenRoles(student) {
  if (state.openInternships.length === 0) return;
  const res = await fetch('/api/evaluate-student', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student, internships: state.openInternships }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Evaluation failed.');
  for (const score of data.rankedMatches || []) {
    const role = state.openInternships.find((r) => r.id === score.internshipId);
    if (role) await persistEvaluation(student.id, role, score, 'Evaluated');
  }
}

function renderRecruiterView() {
  const roles = getRecruiterVisibleRoles();
  if (!state.selectedRoleId && roles.length > 0) state.selectedRoleId = roles[0].id;
  const activeRole = roles.find((r) => r.id === state.selectedRoleId) || roles[0] || null;
  const roleEvalMap = new Map(
    state.recruiterEvaluations
      .filter((e) => activeRole && e.internshipId === activeRole.id)
      .map((e) => [e.studentId, e])
  );

  const sortedStudents = [...state.publishedStudents].sort(
    (a, b) => (roleEvalMap.get(b.id)?.capabilityPercent ?? -1) - (roleEvalMap.get(a.id)?.capabilityPercent ?? -1)
  );

  $('recruiter-view').innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <aside class="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-200 font-semibold text-xs text-slate-800">
          Posted Internship Roles (${roles.length})
        </div>
        <div class="divide-y divide-slate-200">
          ${roles
            .map((role) => {
              const selected = activeRole?.id === role.id;
              return `
              <button type="button" data-select-role="${role.id}" class="w-full text-left p-4 cursor-pointer ${
                selected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-900'
              }">
                <p class="text-sm font-semibold">${escapeHtml(role.title)}</p>
                <p class="text-xs ${selected ? 'text-slate-300' : 'text-slate-500'}">${escapeHtml(role.company)} · ${escapeHtml(role.location)}</p>
              </button>`;
            })
            .join('')}
        </div>
      </aside>

      <section class="lg:col-span-8 space-y-4">
        ${
          activeRole
            ? `
          <div class="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-4">
            <div>
              <h3 class="text-base font-semibold text-slate-900">${escapeHtml(activeRole.title)} — ${escapeHtml(activeRole.company)}</h3>
              <p class="text-xs text-slate-500 mt-1">${escapeHtml(activeRole.description)}</p>
            </div>
            <button type="button" id="score-role-btn" ${state.isScoring ? 'disabled' : ''} class="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer whitespace-nowrap">
              ${state.isScoring ? 'Scoring...' : `Score All Students (${state.publishedStudents.length})`}
            </button>
          </div>
          <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th class="py-2.5 px-4">Student</th>
                  <th class="py-2.5 px-4">Skills</th>
                  <th class="py-2.5 px-4">Capability %</th>
                  <th class="py-2.5 px-4">Decision</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 text-sm">
                ${sortedStudents
                  .map((stu) => {
                    const ev = roleEvalMap.get(stu.id);
                    return `
                    <tr>
                      <td class="py-3 px-4">
                        <p class="font-medium text-slate-900">${escapeHtml(stu.name)}</p>
                        <p class="text-xs text-slate-500">${escapeHtml(stu.university)} · ${Number(stu.gpa).toFixed(2)} GPA</p>
                      </td>
                      <td class="py-3 px-4 text-xs text-slate-600">${escapeHtml((stu.skills || []).slice(0, 4).map((s) => s.name).join(' · '))}</td>
                      <td class="py-3 px-4 font-mono font-semibold ${ev ? capabilityColor(ev.capabilityPercent) : 'text-slate-400'}">
                        ${ev ? `${ev.capabilityPercent}%` : 'Click Score All'}
                      </td>
                      <td class="py-3 px-4">
                        ${
                          ev
                            ? `<select data-eval-id="${ev.id}" class="eval-status-select text-xs border border-slate-300 rounded px-2 py-1 bg-white">
                                <option value="Evaluated" ${ev.allocationStatus === 'Evaluated' ? 'selected' : ''}>Evaluated</option>
                                <option value="Shortlisted" ${ev.allocationStatus === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
                                <option value="Allocated" ${ev.allocationStatus === 'Allocated' ? 'selected' : ''}>Allocated</option>
                              </select>`
                            : '—'
                        }
                      </td>
                    </tr>`;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>`
            : ''
        }
      </section>
    </div>
  `;

  document.querySelectorAll('[data-select-role]').forEach((btn) => {
    btn.onclick = () => {
      state.selectedRoleId = btn.dataset.selectRole;
      render();
    };
  });

  const scoreRoleBtn = $('score-role-btn');
  if (scoreRoleBtn && activeRole) {
    scoreRoleBtn.onclick = async () => {
      state.isScoring = true;
      render();
      try {
        const res = await fetch('/api/evaluate-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ internship: activeRole, students: state.publishedStudents }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Role scoring failed.');
        for (const sc of data.studentScores || []) {
          await persistEvaluation(sc.studentId, activeRole, sc, 'Evaluated');
        }
      } catch (err) {
        showError(err.message);
      } finally {
        state.isScoring = false;
        render();
      }
    };
  }

  document.querySelectorAll('.eval-status-select').forEach((sel) => {
    sel.onchange = async () => {
      try {
        await updateDoc(doc(db, 'capabilityEvaluations', sel.dataset.evalId), {
          allocationStatus: sel.value,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        showError(err.message);
      }
    };
  });
}

// Global Navigation & Role Controls
$('switch-student-btn').onclick = async () => {
  await updateDoc(doc(db, 'users', state.user.uid), { activeRole: 'student', updatedAt: serverTimestamp() });
  state.activeRole = 'student';
  render();
};

$('switch-recruiter-btn').onclick = async () => {
  await updateDoc(doc(db, 'users', state.user.uid), { activeRole: 'recruiter', updatedAt: serverTimestamp() });
  state.activeRole = 'recruiter';
  await seedStarterDataIfNeeded(state.user.uid, state.user.displayName, true);
  render();
};

$('header-action-btn').onclick = async () => {
  if (state.activeRole === 'recruiter') {
    $('role-modal').classList.remove('hidden');
  } else if (state.ownProfile) {
    state.isScoring = true;
    render();
    try {
      await scoreStudentAgainstOpenRoles(state.ownProfile);
    } catch (err) {
      showError(err.message);
    } finally {
      state.isScoring = false;
      render();
    }
  }
};

$('close-role-modal').onclick = () => $('role-modal').classList.add('hidden');
$('dismiss-error-btn').onclick = () => $('api-error-banner').classList.add('hidden');
$('signout-btn').onclick = () => signOut(auth);

$('post-role-form').onsubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const roleId = `int_${state.user.uid.slice(0, 8)}_${Date.now()}`;
  const requiredSkills = String(fd.get('skills') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name, idx) => ({
      name,
      minLevel: 3,
      weight: idx < 2 ? 'Core' : 'Important',
    }));

  try {
    await setDoc(doc(db, 'internships', roleId), {
      recruiterId: state.user.uid,
      recruiterName: state.user.displayName || 'Recruiter',
      title: String(fd.get('title') || '').trim(),
      company: String(fd.get('company') || '').trim(),
      department: 'Engineering',
      location: String(fd.get('location') || 'Remote').trim(),
      duration: '12 Weeks',
      stipend: String(fd.get('stipend') || '$40/hr').trim(),
      seats: Math.max(1, parseInt(fd.get('seats') || '1', 10) || 1),
      minGpa: 3.2,
      description: String(fd.get('description') || '').trim(),
      requiredSkills,
      isOpen: true,
      isStarterRole: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    e.target.reset();
    $('role-modal').classList.add('hidden');
  } catch (err) {
    showError(err.message);
  }
};

onAuthStateChanged(auth, async (user) => {
  state.user = user;
  if (!user) {
    state.unsubs.forEach((u) => u());
    state.unsubs = [];
    $('auth-gate').classList.remove('hidden');
    $('app-shell').classList.add('hidden');
    return;
  }

  const pendingRole = sessionStorage.getItem('meritalloc_pending_role') || undefined;
  sessionStorage.removeItem('meritalloc_pending_role');
  const acct = await ensureUserAccount(user, pendingRole);
  state.activeRole = acct.activeRole || 'student';

  $('auth-gate').classList.add('hidden');
  $('app-shell').classList.remove('hidden');

  await seedStarterDataIfNeeded(user.uid, acct.displayName, state.activeRole === 'recruiter');
  attachListeners(user.uid);
  render();
});
