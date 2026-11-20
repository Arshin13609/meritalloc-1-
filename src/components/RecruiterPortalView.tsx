import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Search,
  ChevronRight,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react';
import type {
  Internship,
  PersistedCapabilityEvaluation,
  Student,
} from '../types';
import { StudentAvatar } from './StudentAvatar';
import { CapabilityMeter, getCapabilityBand } from './CapabilityMeter';

interface RecruiterPortalViewProps {
  recruiterId: string;
  myInternships: Internship[];
  students: Student[];
  evaluations: PersistedCapabilityEvaluation[];
  isEvaluatingRole: boolean;
  onPostNewRole: () => void;
  onEditRole: (role: Internship) => void;
  onDeleteRole: (roleId: string) => Promise<void>;
  onEvaluateRoleCandidates: (role: Internship) => Promise<void>;
  onUpdateCandidateStatus: (
    evalId: string,
    status: PersistedCapabilityEvaluation['allocationStatus']
  ) => Promise<void>;
  onSeedStarterRoles: () => Promise<void>;
  onSeedSampleStudents: () => Promise<void>;
}

export function RecruiterPortalView({
  recruiterId,
  myInternships,
  students,
  evaluations,
  isEvaluatingRole,
  onPostNewRole,
  onEditRole,
  onDeleteRole,
  onEvaluateRoleCandidates,
  onUpdateCandidateStatus,
  onSeedStarterRoles,
  onSeedSampleStudents,
}: RecruiterPortalViewProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    myInternships[0]?.id ?? ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [minCapabilityFilter, setMinCapabilityFilter] = useState<0 | 60 | 80>(0);
  const [inspectStudentId, setInspectStudentId] = useState<string | null>(null);
  const [isSeedingRoles, setIsSeedingRoles] = useState(false);
  const [isSeedingStudents, setIsSeedingStudents] = useState(false);

  useEffect(() => {
    if (
      myInternships.length > 0 &&
      !myInternships.some((r) => r.id === selectedRoleId)
    ) {
      setSelectedRoleId(myInternships[0].id);
    }
  }, [myInternships, selectedRoleId]);

  const activeRole = useMemo(
    () => myInternships.find((r) => r.id === selectedRoleId) ?? myInternships[0] ?? null,
    [myInternships, selectedRoleId]
  );

  const evalByStudentForRole = useMemo(() => {
    if (!activeRole) return new Map<string, PersistedCapabilityEvaluation>();
    const map = new Map<string, PersistedCapabilityEvaluation>();
    for (const ev of evaluations) {
      if (ev.internshipId === activeRole.id) {
        map.set(ev.studentId, ev);
      }
    }
    return map;
  }, [evaluations, activeRole]);

  const rankedCandidates = useMemo(() => {
    return students
      .map((stu) => ({
        student: stu,
        evaluation: evalByStudentForRole.get(stu.id) ?? null,
      }))
      .filter(({ student, evaluation }) => {
        if (
          minCapabilityFilter > 0 &&
          (evaluation?.capabilityPercent ?? 0) < minCapabilityFilter
        ) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const skillText = student.skills.map((s) => s.name.toLowerCase()).join(' ');
          return (
            student.name.toLowerCase().includes(q) ||
            student.university.toLowerCase().includes(q) ||
            student.major.toLowerCase().includes(q) ||
            skillText.includes(q)
          );
        }
        return true;
      })
      .sort(
        (a, b) =>
          (b.evaluation?.capabilityPercent ?? -1) -
          (a.evaluation?.capabilityPercent ?? -1)
      );
  }, [students, evalByStudentForRole, minCapabilityFilter, searchQuery]);

  const inspectDetail = useMemo(() => {
    if (!inspectStudentId || !activeRole) return null;
    const student = students.find((s) => s.id === inspectStudentId) ?? null;
    if (!student) return null;
    return {
      student,
      evaluation: evalByStudentForRole.get(student.id) ?? null,
    };
  }, [inspectStudentId, activeRole, students, evalByStudentForRole]);

  const allocatedCountForRole = Array.from(evalByStudentForRole.values()).filter(
    (e) => e.allocationStatus === 'Allocated'
  ).length;

  const shortlistedCountForRole = Array.from(evalByStudentForRole.values()).filter(
    (e) => e.allocationStatus === 'Shortlisted'
  ).length;

  return (
    <div className="space-y-6">
      {/* Recruiter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Recruiter Talent Evaluation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Post internship roles and inspect every student ranked by how capable they are for the role you posted.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {students.length === 0 && (
            <button
              type="button"
              onClick={async () => {
                setIsSeedingStudents(true);
                try {
                  await onSeedSampleStudents();
                } finally {
                  setIsSeedingStudents(false);
                }
              }}
              disabled={isSeedingStudents}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {isSeedingStudents ? 'Loading Candidates...' : 'Load Sample Students'}
            </button>
          )}
          <button
            type="button"
            onClick={onPostNewRole}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Post Internship Role
          </button>
        </div>
      </div>

      {myInternships.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4">
          <p className="text-base font-semibold text-slate-900">
            You haven&rsquo;t posted any internship roles yet
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Post an internship role with required skills and seat counts, or load 6 starter roles to start evaluating student capability percentages immediately.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onPostNewRole}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              Post Your First Role
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsSeedingRoles(true);
                try {
                  await onSeedStarterRoles();
                } finally {
                  setIsSeedingRoles(false);
                }
              }}
              disabled={isSeedingRoles}
              className="px-4 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              {isSeedingRoles ? 'Loading...' : 'Load 6 Starter Roles'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Posted Roles Selector */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800">
                Posted Internship Roles ({myInternships.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-200 max-h-[540px] overflow-y-auto">
              {myInternships.map((role) => {
                const selected = activeRole?.id === role.id;
                const isOwnedByMe = role.recruiterId === recruiterId;
                const roleEvals = evaluations.filter((e) => e.internshipId === role.id);
                const roleAllocated = roleEvals.filter(
                  (e) => e.allocationStatus === 'Allocated'
                ).length;

                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{role.title}</p>
                        <p
                          className={`text-xs truncate mt-0.5 ${
                            selected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {role.company} · {role.location}
                        </p>
                      </div>
                      {isOwnedByMe && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditRole(role);
                            }}
                            aria-label={`Edit ${role.title}`}
                            className={`p-1 rounded ${
                              selected
                                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200'
                            } cursor-pointer`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRole(role.id);
                            }}
                            aria-label={`Delete ${role.title}`}
                            className={`p-1 rounded ${
                              selected
                                ? 'text-slate-300 hover:text-red-300 hover:bg-slate-800'
                                : 'text-slate-400 hover:text-red-700 hover:bg-red-50'
                            } cursor-pointer`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      className={`mt-2.5 flex items-center justify-between text-xs font-mono tabular-nums ${
                        selected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <span>
                        {roleAllocated} / {role.seats} seats allocated
                      </span>
                      <span>{roleEvals.length} scored</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Column: Candidate Capability Ranking for Selected Posted Role */}
          {activeRole && (
            <section className="lg:col-span-8 space-y-4">
              {/* Active Role Overview Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900">
                      {activeRole.title} — {activeRole.company}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeRole.department} · {activeRole.duration} · {activeRole.stipend} ·{' '}
                      <span className="font-mono tabular-nums">
                        {allocatedCountForRole}/{activeRole.seats} seats filled
                      </span>{' '}
                      ·{' '}
                      <span className="font-mono tabular-nums">
                        {shortlistedCountForRole} shortlisted
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEvaluateRoleCandidates(activeRole)}
                    disabled={isEvaluatingRole || students.length === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isEvaluatingRole
                      ? 'Scoring Students...'
                      : `Score All Students for This Role (${students.length})`}
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeRole.description}
                </p>

                <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Role Requirements: </span>
                  <span className="font-mono">
                    {activeRole.requiredSkills
                      .map((r) => `${r.name} (${r.minLevel}/5 · ${r.weight})`)
                      .join(' · ')}
                  </span>
                </div>
              </div>

              {/* Ranked Candidates Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter students or skills..."
                      aria-label="Filter candidates"
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
                    {([
                      { val: 0, label: 'All' },
                      { val: 80, label: '80%+' },
                      { val: 60, label: '60%+' },
                    ] as const).map((tab) => (
                      <button
                        key={tab.val}
                        type="button"
                        onClick={() => setMinCapabilityFilter(tab.val)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          minCapabilityFilter === tab.val
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {students.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <Users className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-medium text-slate-900">
                      No published student candidates yet
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Students who save their profile will appear here automatically, or you can load 8 sample candidates to test capability scoring right now.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsSeedingStudents(true);
                        try {
                          await onSeedSampleStudents();
                        } finally {
                          setIsSeedingStudents(false);
                        }
                      }}
                      disabled={isSeedingStudents}
                      className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                    >
                      {isSeedingStudents ? 'Loading...' : 'Load 8 Sample Student Candidates'}
                    </button>
                  </div>
                ) : isEvaluatingRole ? (
                  <div className="divide-y divide-slate-200">
                    {Array.from({ length: Math.min(6, students.length) }).map((_, i) => (
                      <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-36 bg-slate-200 rounded" />
                            <div className="h-3 w-48 bg-slate-100 rounded" />
                          </div>
                        </div>
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : rankedCandidates.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <p className="text-sm font-medium text-slate-900">
                      No candidates match the current filter
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setMinCapabilityFilter(0);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                          <th className="py-2.5 px-4">Student Candidate</th>
                          <th className="py-2.5 px-4">Skills</th>
                          <th className="py-2.5 px-4">Capability %</th>
                          <th className="py-2.5 px-4">Decision</th>
                          <th className="py-2.5 px-4 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm">
                        {rankedCandidates.map(({ student, evaluation }) => (
                          <tr
                            key={student.id}
                            onClick={() => setInspectStudentId(student.id)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <StudentAvatar
                                  name={student.name}
                                  avatarUrl={student.avatarUrl}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900 truncate">
                                    {student.name}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate">
                                    {student.university} ·{' '}
                                    <span className="font-mono tabular-nums">
                                      {student.gpa.toFixed(2)}
                                    </span>{' '}
                                    GPA
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 max-w-[210px]">
                              <p className="text-xs text-slate-600 truncate">
                                {student.skills
                                  .slice(0, 3)
                                  .map((s) => s.name)
                                  .join(' · ')}
                              </p>
                            </td>

                            <td className="py-3 px-4">
                              {evaluation ? (
                                <CapabilityMeter
                                  percent={evaluation.capabilityPercent}
                                  compact
                                />
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Click &ldquo;Score All&rdquo;
                                </span>
                              )}
                            </td>

                            <td
                              className="py-3 px-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {evaluation ? (
                                <select
                                  value={evaluation.allocationStatus}
                                  aria-label={`Decision for ${student.name}`}
                                  onChange={(e) =>
                                    onUpdateCandidateStatus(
                                      evaluation.id,
                                      e.target.value as
                                        | 'Evaluated'
                                        | 'Shortlisted'
                                        | 'Allocated'
                                    )
                                  }
                                  className={`text-xs font-medium border border-slate-300 rounded-md px-2 py-1 bg-white ${
                                    evaluation.allocationStatus === 'Allocated'
                                      ? 'text-emerald-700'
                                      : evaluation.allocationStatus === 'Shortlisted'
                                        ? 'text-blue-700'
                                        : 'text-slate-700'
                                  }`}
                                >
                                  <option value="Evaluated">Evaluated</option>
                                  <option value="Shortlisted">Shortlisted</option>
                                  <option value="Allocated">Allocated Seat</option>
                                </select>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectStudentId(student.id);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 cursor-pointer whitespace-nowrap"
                              >
                                Inspect
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Candidate Capability Breakdown Drawer for Active Posted Role */}
      {inspectDetail && activeRole && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/30"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0"
            onClick={() => setInspectStudentId(null)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-full max-w-xl bg-white border-l border-slate-200 h-full overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <StudentAvatar
                  name={inspectDetail.student.name}
                  avatarUrl={inspectDetail.student.avatarUrl}
                  size="md"
                />
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 truncate">
                    {inspectDetail.student.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {inspectDetail.student.university} · {inspectDetail.student.major} ·{' '}
                    {inspectDetail.student.gpa.toFixed(2)} GPA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectStudentId(null)}
                aria-label="Close detail panel"
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {inspectDetail.evaluation ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Capability for {activeRole.title}
                      </p>
                      <p
                        className={`text-4xl font-mono tabular-nums font-semibold mt-1 ${
                          getCapabilityBand(inspectDetail.evaluation.capabilityPercent)
                            .textColor
                        }`}
                      >
                        {inspectDetail.evaluation.capabilityPercent}%
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {
                          getCapabilityBand(inspectDetail.evaluation.capabilityPercent)
                            .label
                        }
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCandidateStatus(
                            inspectDetail.evaluation!.id,
                            'Shortlisted'
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                          inspectDetail.evaluation.allocationStatus === 'Shortlisted'
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Shortlist
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCandidateStatus(
                            inspectDetail.evaluation!.id,
                            'Allocated'
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                          inspectDetail.evaluation.allocationStatus === 'Allocated'
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        {inspectDetail.evaluation.allocationStatus === 'Allocated'
                          ? 'Seat Allocated'
                          : 'Allocate Seat'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Core Skill Match</p>
                      <CapabilityMeter
                        percent={inspectDetail.evaluation.coreSkillMatchPercent}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Project Relevance</p>
                      <CapabilityMeter
                        percent={inspectDetail.evaluation.projectRelevancePercent}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Readiness</p>
                      <CapabilityMeter
                        percent={inspectDetail.evaluation.readinessPercent}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-800 mb-1">
                      AI Evaluation Rationale
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {inspectDetail.evaluation.aiRationale}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      Matched Skills
                    </h4>
                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 text-xs">
                      {inspectDetail.evaluation.matchedSkills.map((ms) => (
                        <div
                          key={ms.skill}
                          className="px-3 py-2.5 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-medium text-slate-900">{ms.skill}</span>
                            <span className="text-slate-500 ml-2">{ms.note}</span>
                          </div>
                          <span className="font-mono tabular-nums text-emerald-700 font-medium shrink-0">
                            {ms.studentLevel}/{ms.requiredLevel} (+{ms.contributionPercent}%)
                          </span>
                        </div>
                      ))}
                      {inspectDetail.evaluation.matchedSkills.length === 0 && (
                        <p className="px-3 py-3 text-slate-500">
                          No matched skills found.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Skill Gaps
                    </h4>
                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 text-xs">
                      {inspectDetail.evaluation.missingSkills.map((gap) => (
                        <div key={gap.skill} className="px-3 py-2.5 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900">{gap.skill}</span>
                            <span className="font-mono tabular-nums text-slate-600">
                              {gap.studentLevel}/{gap.requiredLevel} · {gap.severity}
                            </span>
                          </div>
                          <p className="text-slate-600">{gap.upskillingTip}</p>
                        </div>
                      ))}
                      {inspectDetail.evaluation.missingSkills.length === 0 && (
                        <p className="px-3 py-3 text-emerald-700">
                          No skill gaps identified for this role.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Click &ldquo;Score All Students for This Role&rdquo; to evaluate{' '}
                    {inspectDetail.student.name} against {activeRole.title}.
                  </p>
                  <button
                    type="button"
                    onClick={() => onEvaluateRoleCandidates(activeRole)}
                    disabled={isEvaluatingRole}
                    className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    Score Candidates Now
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <h4 className="text-xs font-semibold text-slate-800">
                  Candidate Portfolio & Skills
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {inspectDetail.student.projectsSummary}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {inspectDetail.student.skills
                    .map((s) => `${s.name} (${s.level}/5)`)
                    .join(' · ')}
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
