import { useMemo, useState } from 'react';
import { Search, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type {
  AllocationResponse,
  AllocationStatus,
  Internship,
  Student,
  StudentAllocation,
} from '../types';
import { StudentAvatar } from './StudentAvatar';
import { CapabilityMeter } from './CapabilityMeter';

interface OverviewAllocationViewProps {
  students: Student[];
  internships: Internship[];
  allocationData: AllocationResponse;
  isAllocating: boolean;
  onSelectStudent: (studentId: string) => void;
  onRunAllocation: () => void;
  onOpenAddStudent: () => void;
}

export function OverviewAllocationView({
  students,
  internships,
  allocationData,
  isAllocating,
  onSelectStudent,
  onRunAllocation,
  onOpenAddStudent,
}: OverviewAllocationViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AllocationStatus>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  const internshipMap = useMemo(
    () => new Map(internships.map((i) => [i.id, i])),
    [internships]
  );

  const allocationMap = useMemo(
    () => new Map(allocationData.allocations.map((a) => [a.studentId, a])),
    [allocationData.allocations]
  );

  const rows = useMemo(() => {
    return students
      .map((student) => {
        const allocation: StudentAllocation = allocationMap.get(student.id) ?? {
          studentId: student.id,
          assignedInternshipId: null,
          status: 'Unmatched',
          assignedCapabilityPercent: 0,
          rankedMatches: [],
        };
        const assignedRole = allocation.assignedInternshipId
          ? internshipMap.get(allocation.assignedInternshipId) ?? null
          : null;
        const runnerUp = allocation.rankedMatches.find(
          (m) => m.internshipId !== allocation.assignedInternshipId
        );
        const runnerUpRole = runnerUp ? internshipMap.get(runnerUp.internshipId) ?? null : null;

        return { student, allocation, assignedRole, runnerUp, runnerUpRole };
      })
      .filter(({ student, allocation, assignedRole }) => {
        if (statusFilter !== 'All' && allocation.status !== statusFilter) return false;
        if (roleFilter !== 'All' && allocation.assignedInternshipId !== roleFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const skillNames = student.skills.map((s) => s.name.toLowerCase()).join(' ');
          const roleText = assignedRole
            ? `${assignedRole.title} ${assignedRole.company}`.toLowerCase()
            : '';
          return (
            student.name.toLowerCase().includes(q) ||
            student.university.toLowerCase().includes(q) ||
            skillNames.includes(q) ||
            roleText.includes(q)
          );
        }
        return true;
      });
  }, [students, allocationMap, internshipMap, statusFilter, roleFilter, searchQuery]);

  const { summary } = allocationData;

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500">Mean Cohort Capability</p>
          <p className="text-2xl font-mono tabular-nums font-semibold text-slate-900 mt-1">
            {summary.averageCapabilityPercent}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Weighted across placed seats</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500">Skill-Based Placement Rate</p>
          <p className="text-2xl font-mono tabular-nums font-semibold text-slate-900 mt-1">
            {summary.placementRatePercent}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {allocationData.allocations.filter((a) => a.status === 'Allocated').length} of{' '}
            {students.length} students assigned
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500">Internship Seat Utilization</p>
          <p className="text-2xl font-mono tabular-nums font-semibold text-slate-900 mt-1">
            {summary.totalSeatsFilled} / {summary.totalSeatsAvailable}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Across {internships.length} open internship roles
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500">High-Capability Matches (80%+)</p>
          <p className="text-2xl font-mono tabular-nums font-semibold text-emerald-700 mt-1">
            {
              allocationData.allocations.filter(
                (a) => a.status === 'Allocated' && a.assignedCapabilityPercent >= 80
              ).length
            }{' '}
            / {students.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Meets or exceeds core role bar</p>
        </div>
      </section>

      {/* Executive Cohort Insight */}
      <section className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">Allocation Summary</span>
            <span aria-hidden="true">·</span>
            <span>
              {summary.evaluatedBy === 'gemini-4-hydrogen'
                ? `AI Evaluated at ${summary.evaluatedAt}`
                : summary.evaluatedAt}
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed max-w-4xl">
            {summary.executiveInsight}
          </p>
        </div>
        <button
          type="button"
          onClick={onRunAllocation}
          disabled={isAllocating}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-center"
        >
          {isAllocating ? 'Running AI Allocation...' : 'Re-Run AI Allocation'}
        </button>
      </section>

      {/* Filter & Search Toolbar */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student, skill, or role..."
                aria-label="Search allocations"
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['All', 'Allocated', 'Waitlisted', 'Unmatched'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === status
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="role-filter" className="text-xs text-slate-500 whitespace-nowrap">
              Filter by Role:
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Internships</option>
              {internships.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title} ({role.company})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Allocation Data Table */}
        {isAllocating ? (
          <div className="divide-y divide-slate-200" aria-busy="true" aria-label="Calculating AI allocations">
            {Array.from({ length: Math.max(4, students.length) }).map((_, idx) => (
              <div key={idx} className="px-4 py-3.5 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-36 bg-slate-200 rounded" />
                    <div className="h-3 w-48 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-3.5 w-44 bg-slate-200 rounded hidden md:block" />
                <div className="h-3.5 w-24 bg-slate-200 rounded" />
                <div className="h-3.5 w-20 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <p className="text-sm font-medium text-slate-900">
              No student allocations match the current filters
            </p>
            <p className="text-xs text-slate-500">
              Adjust your search query or add a new student candidate to evaluate.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setRoleFilter('All');
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={onOpenAddStudent}
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
              >
                Add Student
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-2.5 px-4">Student Candidate</th>
                  <th className="py-2.5 px-4">Verified Top Skills</th>
                  <th className="py-2.5 px-4">Allocated Internship</th>
                  <th className="py-2.5 px-4">Capability %</th>
                  <th className="py-2.5 px-4">Runner-Up Fit</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {rows.map(({ student, allocation, assignedRole, runnerUp, runnerUpRole }) => (
                  <tr
                    key={student.id}
                    onClick={() => onSelectStudent(student.id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <StudentAvatar
                          name={student.name}
                          avatarUrl={student.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{student.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {student.university} ·{' '}
                            <span className="font-mono tabular-nums">{student.gpa.toFixed(2)}</span> GPA
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-[240px]">
                      <p className="text-xs text-slate-700 truncate">
                        {student.skills
                          .slice(0, 3)
                          .map((s) => s.name)
                          .join(' · ')}
                        {student.skills.length > 3 && (
                          <span className="text-slate-400">
                            {' '}
                            +{student.skills.length - 3}
                          </span>
                        )}
                      </p>
                    </td>

                    <td className="py-3 px-4 min-w-[210px]">
                      {assignedRole ? (
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {assignedRole.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {assignedRole.company} · {assignedRole.location}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Pending placement</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <CapabilityMeter percent={allocation.assignedCapabilityPercent} compact />
                    </td>

                    <td className="py-3 px-4 min-w-[170px]">
                      {runnerUp && runnerUpRole ? (
                        <p className="text-xs text-slate-600 truncate">
                          {runnerUpRole.title}{' '}
                          <span className="font-mono tabular-nums text-slate-900 font-medium">
                            ({runnerUp.capabilityPercent}%)
                          </span>
                        </p>
                      ) : (
                        <span className="text-xs text-slate-400">Run AI to rank all</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {allocation.status === 'Allocated' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          Allocated
                        </span>
                      ) : allocation.status === 'Waitlisted' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          Waitlisted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Unmatched
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(student.id);
                        }}
                        aria-label={`Inspect ${student.name} capability breakdown`}
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
      </section>
    </div>
  );
}
