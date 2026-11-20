import { X, RefreshCw, ArrowUpRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Internship, Student, StudentAllocation } from '../types';
import { StudentAvatar } from './StudentAvatar';
import { CapabilityMeter, getCapabilityBand } from './CapabilityMeter';

interface AllocationDrawerProps {
  student: Student | null;
  allocation: StudentAllocation | null;
  internships: Internship[];
  isEvaluating: boolean;
  onClose: () => void;
  onEvaluateStudent: (student: Student) => void;
  onManualAssign: (studentId: string, internshipId: string, capabilityPercent: number) => void;
}

export function AllocationDrawer({
  student,
  allocation,
  internships,
  isEvaluating,
  onClose,
  onEvaluateStudent,
  onManualAssign,
}: AllocationDrawerProps) {
  if (!student || !allocation) return null;

  const internshipMap = new Map(internships.map((i) => [i.id, i]));
  const assignedInternship = allocation.assignedInternshipId
    ? internshipMap.get(allocation.assignedInternshipId) ?? null
    : null;

  const primaryMatch =
    (allocation.assignedInternshipId
      ? allocation.rankedMatches.find((m) => m.internshipId === allocation.assignedInternshipId)
      : allocation.rankedMatches[0]) ?? allocation.rankedMatches[0];

  const alternativeMatches = allocation.rankedMatches.filter(
    (m) => m.internshipId !== primaryMatch?.internshipId
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-student-name"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <aside className="relative z-10 w-full max-w-2xl bg-white border-l border-slate-200 h-full overflow-y-auto flex flex-col">
        {/* Top Drawer Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <StudentAvatar name={student.name} avatarUrl={student.avatarUrl} size="lg" />
            <div className="min-w-0">
              <h2
                id="drawer-student-name"
                className="text-lg font-semibold text-slate-900 truncate"
              >
                {student.name}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {student.university} · {student.major} · {student.gpa.toFixed(2)} GPA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEvaluateStudent(student)}
              disabled={isEvaluating}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
              {isEvaluating ? 'Evaluating...' : 'Re-Evaluate with AI'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close detail panel"
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Primary Assignment & Overall Capability */}
          <section className="space-y-4">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">
                  {allocation.status === 'Allocated' ? 'Allocated Internship' : 'Top Recommended Role'}
                </p>
                <h3 className="text-xl font-semibold text-slate-900">
                  {assignedInternship
                    ? `${assignedInternship.title} — ${assignedInternship.company}`
                    : primaryMatch && internshipMap.get(primaryMatch.internshipId)
                      ? `${internshipMap.get(primaryMatch.internshipId)!.title} — ${internshipMap.get(primaryMatch.internshipId)!.company}`
                      : 'No role evaluated yet'}
                </h3>
                {assignedInternship && (
                  <p className="text-xs text-slate-500">
                    {assignedInternship.department} · {assignedInternship.location} · {assignedInternship.duration} · {assignedInternship.stipend}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-slate-500">Overall Capability</p>
                <p
                  className={`text-3xl font-mono tabular-nums font-semibold ${
                    getCapabilityBand(primaryMatch?.capabilityPercent ?? allocation.assignedCapabilityPercent).textColor
                  }`}
                >
                  {primaryMatch?.capabilityPercent ?? allocation.assignedCapabilityPercent}%
                </p>
                <p className="text-xs text-slate-500">
                  Status: <span className="font-medium text-slate-800">{allocation.status}</span>
                </p>
              </div>
            </div>

            {primaryMatch && (
              <>
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Core Skill Match</p>
                    <CapabilityMeter percent={primaryMatch.coreSkillMatchPercent} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Project Relevance</p>
                    <CapabilityMeter percent={primaryMatch.projectRelevancePercent} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Onboarding Readiness</p>
                    <CapabilityMeter percent={primaryMatch.readinessPercent} />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-slate-700 mb-1">
                    AI Capability Assessment
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {primaryMatch.aiRationale}
                  </p>
                </div>
              </>
            )}
          </section>

          {/* Skill Alignment Table */}
          {primaryMatch && (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-semibold text-slate-900">
                  Matched Skill Breakdown
                </h4>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {primaryMatch.matchedSkills.length} verified skills
                </span>
              </div>

              {primaryMatch.matchedSkills.length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                        <th className="py-2.5 px-3">Skill</th>
                        <th className="py-2.5 px-3 text-right">Student</th>
                        <th className="py-2.5 px-3 text-right">Target</th>
                        <th className="py-2.5 px-3 text-right">Weight</th>
                        <th className="py-2.5 px-3">Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {primaryMatch.matchedSkills.map((ms) => (
                        <tr key={ms.skill} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-medium text-slate-900">{ms.skill}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {ms.studentLevel}/5
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                            {ms.requiredLevel}/5
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-medium">
                            +{ms.contributionPercent}%
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{ms.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No overlapping matched skills recorded.</p>
              )}
            </section>
          )}

          {/* Missing Skills & Upskilling */}
          {primaryMatch && (
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Identified Skill Gaps
              </h4>
              {primaryMatch.missingSkills.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/60 border border-emerald-200 rounded-lg px-3.5 py-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No critical skill gaps detected for this role.</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {primaryMatch.missingSkills.map((gap) => (
                    <div key={gap.skill} className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          {gap.skill}
                        </span>
                        <span className="font-mono tabular-nums text-slate-600">
                          {gap.studentLevel}/5 vs {gap.requiredLevel}/5 target ·{' '}
                          <span
                            className={
                              gap.severity === 'High'
                                ? 'text-red-700 font-semibold'
                                : gap.severity === 'Moderate'
                                  ? 'text-amber-700 font-semibold'
                                  : 'text-slate-700 font-medium'
                            }
                          >
                            {gap.severity} Gap
                          </span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{gap.upskillingTip}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Student Project Evidence */}
          <section className="space-y-2 pt-2 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900">Student Portfolio & Skills</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{student.projectsSummary}</p>
            <p className="text-xs text-slate-500">
              Declared Skills:{' '}
              <span className="font-mono text-slate-700">
                {student.skills.map((s) => `${s.name} (${s.level}/5)`).join(' · ')}
              </span>
            </p>
          </section>

          {/* Alternative Internship Fits */}
          {alternativeMatches.length > 0 && (
            <section className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-semibold text-slate-900">
                  Capability Across Other Internships
                </h4>
                <span className="text-xs text-slate-500">Ranked by capability %</span>
              </div>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {alternativeMatches.map((match) => {
                  const role = internshipMap.get(match.internshipId);
                  if (!role) return null;
                  return (
                    <div
                      key={match.internshipId}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {role.title} · {role.company}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {match.aiRationale}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <CapabilityMeter percent={match.capabilityPercent} compact />
                        <button
                          type="button"
                          onClick={() =>
                            onManualAssign(student.id, role.id, match.capabilityPercent)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Assign
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
