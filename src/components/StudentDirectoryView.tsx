import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react';
import type { AllocationResponse, Internship, Student } from '../types';
import { StudentAvatar } from './StudentAvatar';
import { CapabilityMeter } from './CapabilityMeter';

interface StudentDirectoryViewProps {
  students: Student[];
  internships: Internship[];
  allocationData: AllocationResponse;
  evaluatingStudentId: string | null;
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onEvaluateStudent: (student: Student) => void;
  onSelectStudentDrawer: (studentId: string) => void;
}

export function StudentDirectoryView({
  students,
  internships,
  allocationData,
  evaluatingStudentId,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onEvaluateStudent,
  onSelectStudentDrawer,
}: StudentDirectoryViewProps) {
  const [query, setQuery] = useState('');

  const internshipMap = new Map(internships.map((i) => [i.id, i]));
  const allocationMap = new Map(
    allocationData.allocations.map((a) => [a.studentId, a])
  );

  const filtered = students.filter((stu) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      stu.name.toLowerCase().includes(q) ||
      stu.university.toLowerCase().includes(q) ||
      stu.major.toLowerCase().includes(q) ||
      stu.skills.some((s) => s.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Student Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage candidate profiles, calibrated 1–5 skill ratings, and project portfolios.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddStudent}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Student Candidate
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, university, or skill..."
              aria-label="Filter students"
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
            {filtered.length} of {students.length} students
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-medium text-slate-900">
              No student profiles found
            </p>
            <p className="text-xs text-slate-500">
              Clear your search filter or add a new student candidate.
            </p>
            <button
              type="button"
              onClick={onAddStudent}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              Add Student Candidate
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filtered.map((student) => {
              const alloc = allocationMap.get(student.id);
              const assignedRole = alloc?.assignedInternshipId
                ? internshipMap.get(alloc.assignedInternshipId)
                : null;
              const isEvaluating = evaluatingStudentId === student.id;

              return (
                <div
                  key={student.id}
                  className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <StudentAvatar
                      name={student.name}
                      avatarUrl={student.avatarUrl}
                      size="md"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <button
                          type="button"
                          onClick={() => onSelectStudentDrawer(student.id)}
                          className="text-sm font-semibold text-slate-900 hover:text-blue-700 cursor-pointer text-left"
                        >
                          {student.name}
                        </button>
                        <span className="text-xs text-slate-500">
                          {student.university} · {student.major} · Class of{' '}
                          <span className="font-mono tabular-nums">{student.graduationYear}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1">
                        {student.projectsSummary}
                      </p>

                      <p className="text-xs text-slate-500 font-mono">
                        {student.skills
                          .map((s) => `${s.name} (${s.level}/5)`)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 shrink-0">
                    <div className="min-w-[170px]">
                      <p className="text-[11px] text-slate-500">
                        {assignedRole ? assignedRole.title : 'Best Evaluated Fit'}
                      </p>
                      {alloc && alloc.rankedMatches.length > 0 ? (
                        <CapabilityMeter
                          percent={alloc.assignedCapabilityPercent}
                          compact
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Not evaluated</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEvaluateStudent(student)}
                        disabled={isEvaluating}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${isEvaluating ? 'animate-spin' : ''}`}
                        />
                        {isEvaluating ? 'Scoring...' : 'Evaluate Fit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditStudent(student)}
                        aria-label={`Edit ${student.name}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteStudent(student.id)}
                        aria-label={`Delete ${student.name}`}
                        className="p-1.5 text-slate-400 hover:text-red-700 rounded-md hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
