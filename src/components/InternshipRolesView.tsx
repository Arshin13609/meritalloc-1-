import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { AllocationResponse, Internship, Student } from '../types';

interface InternshipRolesViewProps {
  internships: Internship[];
  students: Student[];
  allocationData: AllocationResponse;
  onAddInternship: () => void;
  onEditInternship: (internship: Internship) => void;
  onDeleteInternship: (internshipId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export function InternshipRolesView({
  internships,
  students,
  allocationData,
  onAddInternship,
  onEditInternship,
  onDeleteInternship,
  onSelectStudent,
}: InternshipRolesViewProps) {
  const studentMap = new Map(students.map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Open Internship Roles
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Define required technical skills, target proficiency levels, and seat capacities for AI matching.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddInternship}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Internship Role
        </button>
      </div>

      {internships.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
          <p className="text-sm font-medium text-slate-900">No internship roles defined</p>
          <p className="text-xs text-slate-500">
            Add your first host internship role with required skills and seat counts.
          </p>
          <button
            type="button"
            onClick={onAddInternship}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
          >
            Create Internship Role
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {internships.map((role) => {
            const assignedAllocations = allocationData.allocations.filter(
              (a) => a.assignedInternshipId === role.id && a.status === 'Allocated'
            );
            const filledSeats = assignedAllocations.length;
            const fillPercent = Math.min(
              100,
              Math.round((filledSeats / Math.max(1, role.seats)) * 100)
            );

            return (
              <article
                key={role.id}
                className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-900">
                        {role.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {role.company} · {role.department} · {role.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditInternship(role)}
                        aria-label={`Edit ${role.title}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteInternship(role.id)}
                        aria-label={`Delete ${role.title}`}
                        className="p-1.5 text-slate-400 hover:text-red-700 rounded-md hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="text-xs text-slate-500 font-mono tabular-nums">
                    {role.duration} · {role.stipend} · Min {role.minGpa.toFixed(1)} GPA
                  </div>

                  {/* Required Skills Table */}
                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-xs font-medium text-slate-700 mb-2">
                      Required Skills & Target Proficiency
                    </p>
                    <div className="space-y-1 text-xs">
                      {role.requiredSkills.map((req) => (
                        <div
                          key={req.name}
                          className="flex items-center justify-between text-slate-700"
                        >
                          <span>
                            {req.name}{' '}
                            <span className="text-slate-400">· {req.weight}</span>
                          </span>
                          <span className="font-mono tabular-nums text-slate-600">
                            {req.minLevel}/5
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Seat Capacity & Allocated Students */}
                <div className="border-t border-slate-200 pt-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">Seat Allocation</span>
                    <span className="font-mono tabular-nums text-slate-900 font-medium">
                      {filledSeats} / {role.seats} filled
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-blue-700 transition-transform duration-200"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>

                  {assignedAllocations.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      {assignedAllocations.map((alloc) => {
                        const stu = studentMap.get(alloc.studentId);
                        if (!stu) return null;
                        return (
                          <button
                            key={stu.id}
                            type="button"
                            onClick={() => onSelectStudent(stu.id)}
                            className="w-full flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-50 text-left cursor-pointer"
                          >
                            <span className="font-medium text-slate-800">{stu.name}</span>
                            <span className="font-mono tabular-nums text-emerald-700 font-semibold">
                              {alloc.assignedCapabilityPercent}% capable
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No students assigned yet</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
