import { useState, useMemo } from 'react';
import { RefreshCw, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { AllocationResponse, Internship, Student } from '../types';
import { StudentAvatar } from './StudentAvatar';
import { CapabilityMeter, getCapabilityBand } from './CapabilityMeter';

interface CapabilityExplorerViewProps {
  students: Student[];
  internships: Internship[];
  allocationData: AllocationResponse;
  evaluatingStudentId: string | null;
  onEvaluateStudent: (student: Student) => void;
  onSelectStudentDrawer: (studentId: string) => void;
}

export function CapabilityExplorerView({
  students,
  internships,
  allocationData,
  evaluatingStudentId,
  onEvaluateStudent,
  onSelectStudentDrawer,
}: CapabilityExplorerViewProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id ?? ''
  );
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>(
    internships[0]?.id ?? ''
  );

  const student = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? students[0] ?? null,
    [students, selectedStudentId]
  );

  const internship = useMemo(
    () => internships.find((i) => i.id === selectedInternshipId) ?? internships[0] ?? null,
    [internships, selectedInternshipId]
  );

  const allocationMap = useMemo(
    () => new Map(allocationData.allocations.map((a) => [a.studentId, a])),
    [allocationData.allocations]
  );

  const currentAllocation = student ? allocationMap.get(student.id) : undefined;
  const pairEvaluation = currentAllocation?.rankedMatches.find(
    (m) => m.internshipId === internship?.id
  );

  const isEvaluatingThis = student ? evaluatingStudentId === student.id : false;

  if (!student || !internship) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <p className="text-sm font-medium text-slate-900">
          Add at least one student and one internship role to explore capability percentages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Interactive 1-on-1 Pairing Simulator */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              1-on-1 Capability Percentage Simulator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare any student against any internship role to inspect exact skill overlap and readiness %.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEvaluateStudent(student)}
            disabled={isEvaluatingThis}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluatingThis ? 'animate-spin' : ''}`} />
            {isEvaluatingThis
              ? `Scoring ${student.name}...`
              : `Evaluate ${student.name.split(' ')[0]} Across All Roles`}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
          {/* Student Selector */}
          <div className="lg:col-span-5 space-y-2">
            <label
              htmlFor="explorer-student"
              className="block text-xs font-medium text-slate-600"
            >
              Select Student Candidate
            </label>
            <select
              id="explorer-student"
              value={student.id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.university} ({s.gpa.toFixed(2)} GPA)
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3 pt-1">
              <StudentAvatar name={student.name} avatarUrl={student.avatarUrl} size="sm" />
              <p className="text-xs text-slate-600 truncate">
                {student.skills.map((sk) => `${sk.name} (${sk.level}/5)`).join(' · ')}
              </p>
            </div>
          </div>

          <div className="lg:col-span-1 flex justify-center">
            <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 lg:rotate-0" />
          </div>

          {/* Internship Selector */}
          <div className="lg:col-span-5 space-y-2">
            <label
              htmlFor="explorer-internship"
              className="block text-xs font-medium text-slate-600"
            >
              Select Target Internship Role
            </label>
            <select
              id="explorer-internship"
              value={internship.id}
              onChange={(e) => setSelectedInternshipId(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {internships.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title} — {i.company} ({i.seats} {i.seats === 1 ? 'seat' : 'seats'})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-600 truncate pt-1">
              Requires:{' '}
              {internship.requiredSkills
                .map((r) => `${r.name} (${r.minLevel}/5)`)
                .join(' · ')}
            </p>
          </div>
        </div>

        {/* Pair Result Output */}
        {pairEvaluation ? (
          <div className="pt-4 border-t border-slate-200 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <div className="md:col-span-1">
                <p className="text-xs font-medium text-slate-500">Pair Capability Score</p>
                <p
                  className={`text-4xl font-mono tabular-nums font-semibold mt-1 ${
                    getCapabilityBand(pairEvaluation.capabilityPercent).textColor
                  }`}
                >
                  {pairEvaluation.capabilityPercent}%
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {getCapabilityBand(pairEvaluation.capabilityPercent).label}
                </p>
              </div>

              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Core Skill Alignment</p>
                  <CapabilityMeter percent={pairEvaluation.coreSkillMatchPercent} showLabel />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Project Relevance</p>
                  <CapabilityMeter percent={pairEvaluation.projectRelevancePercent} showLabel />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Academic & Readiness</p>
                  <CapabilityMeter percent={pairEvaluation.readinessPercent} showLabel />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-800 mb-1">AI Rationale</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {pairEvaluation.aiRationale}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-800 mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Matched Skills ({pairEvaluation.matchedSkills.length})
                </h3>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                  {pairEvaluation.matchedSkills.map((ms) => (
                    <div
                      key={ms.skill}
                      className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
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
                  {pairEvaluation.matchedSkills.length === 0 && (
                    <p className="px-3 py-3 text-xs text-slate-500">
                      No direct skill overlap found.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-800 mb-2.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Skill Gaps ({pairEvaluation.missingSkills.length})
                </h3>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                  {pairEvaluation.missingSkills.map((gap) => (
                    <div key={gap.skill} className="px-3 py-2 space-y-0.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">{gap.skill}</span>
                        <span className="font-mono tabular-nums text-slate-600">
                          {gap.studentLevel}/{gap.requiredLevel} · {gap.severity}
                        </span>
                      </div>
                      <p className="text-slate-600">{gap.upskillingTip}</p>
                    </div>
                  ))}
                  {pairEvaluation.missingSkills.length === 0 && (
                    <p className="px-3 py-3 text-xs text-emerald-700">
                      No skill gaps identified for this role.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 rounded-lg p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900">
                Pair not yet scored for {student.name} × {internship.title}
              </p>
              <p className="text-xs text-slate-500">
                Click &ldquo;Evaluate {student.name.split(' ')[0]} Across All Roles&rdquo; to compute exact AI capability percentages for all {internships.length} internships.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEvaluateStudent(student)}
              disabled={isEvaluatingThis}
              className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isEvaluatingThis ? 'Scoring...' : 'Calculate Capability %'}
            </button>
          </div>
        )}
      </section>

      {/* Full Cohort x Role Capability Matrix */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-baseline justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Cohort Capability Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluated capability percentages across internships (highlighted cells indicate current seat allocation).
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="py-2.5 px-4 sticky left-0 bg-slate-50">Student</th>
                {internships.map((role) => (
                  <th key={role.id} className="py-2.5 px-3 text-right min-w-[130px]">
                    <span className="block text-slate-800 truncate max-w-[140px] ml-auto">
                      {role.title}
                    </span>
                    <span className="block text-[11px] text-slate-400 font-normal">
                      {role.company}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {students.map((stu) => {
                const alloc = allocationMap.get(stu.id);
                return (
                  <tr key={stu.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-medium text-slate-900 sticky left-0 bg-white">
                      <button
                        type="button"
                        onClick={() => onSelectStudentDrawer(stu.id)}
                        className="text-left hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        {stu.name}
                      </button>
                    </td>
                    {internships.map((role) => {
                      const score = alloc?.rankedMatches.find(
                        (m) => m.internshipId === role.id
                      );
                      const isAssigned = alloc?.assignedInternshipId === role.id;
                      const pct = score?.capabilityPercent;

                      return (
                        <td
                          key={role.id}
                          onClick={() => {
                            setSelectedStudentId(stu.id);
                            setSelectedInternshipId(role.id);
                          }}
                          className={`py-2.5 px-3 text-right font-mono tabular-nums cursor-pointer transition-colors ${
                            isAssigned
                              ? 'bg-emerald-50/80 text-emerald-800 font-semibold'
                              : 'hover:bg-slate-100/70'
                          }`}
                        >
                          {pct !== undefined ? (
                            <span
                              className={
                                isAssigned
                                  ? 'text-emerald-800'
                                  : pct >= 80
                                    ? 'text-slate-900 font-medium'
                                    : 'text-slate-500'
                              }
                            >
                              {pct}%{isAssigned ? ' · Assigned' : ''}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
