import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Internship, RequiredSkill } from '../types';

interface InternshipModalProps {
  initialInternship: Internship | null;
  onClose: () => void;
  onSave: (internship: Internship) => void;
}

export function InternshipModal({
  initialInternship,
  onClose,
  onSave,
}: InternshipModalProps) {
  const isEditing = Boolean(initialInternship);

  const [title, setTitle] = useState(initialInternship?.title ?? '');
  const [company, setCompany] = useState(initialInternship?.company ?? '');
  const [department, setDepartment] = useState(
    initialInternship?.department ?? 'Engineering'
  );
  const [location, setLocation] = useState(
    initialInternship?.location ?? 'San Francisco · Hybrid'
  );
  const [duration, setDuration] = useState(initialInternship?.duration ?? '12 Weeks');
  const [stipend, setStipend] = useState(initialInternship?.stipend ?? '$42/hr');
  const [seats, setSeats] = useState(initialInternship?.seats ?? 2);
  const [minGpa, setMinGpa] = useState(initialInternship?.minGpa ?? 3.3);
  const [description, setDescription] = useState(initialInternship?.description ?? '');
  const [requiredSkills, setRequiredSkills] = useState<RequiredSkill[]>(
    initialInternship?.requiredSkills ?? [
      { name: 'TypeScript', minLevel: 4, weight: 'Core' },
      { name: 'React', minLevel: 4, weight: 'Core' },
    ]
  );

  const [newSkillName, setNewSkillName] = useState('');
  const [newMinLevel, setNewMinLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [newWeight, setNewWeight] = useState<RequiredSkill['weight']>('Core');
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddSkill = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    if (requiredSkills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillName('');
      return;
    }
    setRequiredSkills([
      ...requiredSkills,
      { name: trimmed, minLevel: newMinLevel, weight: newWeight },
    ]);
    setNewSkillName('');
    setNewMinLevel(3);
    setNewWeight('Important');
  };

  const handleRemoveSkill = (skillName: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s.name !== skillName));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || requiredSkills.length === 0) {
      setFormError('Role title, company, and at least one required skill are needed.');
      return;
    }
    onSave({
      id: initialInternship?.id ?? `int-${Date.now()}`,
      title: title.trim(),
      company: company.trim(),
      department: department.trim() || 'Engineering',
      location: location.trim() || 'Remote',
      duration: duration.trim() || '12 Weeks',
      stipend: stipend.trim() || '$40/hr',
      seats: Math.max(1, Math.round(Number(seats) || 1)),
      minGpa: Math.max(0, Math.min(4.0, Number(minGpa) || 3.0)),
      description: description.trim() || 'Internship placement role.',
      requiredSkills,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="internship-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 id="internship-modal-title" className="text-lg font-semibold text-slate-900">
            {isEditing ? `Edit Internship — ${initialInternship?.title}` : 'Create Internship Role'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Role Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Robotics Perception Intern"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Host Company</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Waypoint Autonomy"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Available Seats
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="w-full text-sm font-mono tabular-nums border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Minimum GPA Target
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="4.0"
                value={minGpa}
                onChange={(e) => setMinGpa(Number(e.target.value))}
                className="w-full text-sm font-mono tabular-nums border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Stipend</label>
              <input
                type="text"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Role Responsibilities & Scope
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the work the intern will ship and technical context..."
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Required Skills Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Required Skills & Target Proficiency
              </label>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {requiredSkills.length} requirements
              </span>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Required skill (e.g., C++, ROS2, SQL)"
                className="flex-1 min-w-[160px] text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <select
                value={newMinLevel}
                onChange={(e) =>
                  setNewMinLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                }
                className="text-sm font-mono border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
              >
                <option value={1}>Min 1/5</option>
                <option value={2}>Min 2/5</option>
                <option value={3}>Min 3/5</option>
                <option value={4}>Min 4/5</option>
                <option value={5}>Min 5/5</option>
              </select>
              <select
                value={newWeight}
                onChange={(e) =>
                  setNewWeight(e.target.value as RequiredSkill['weight'])
                }
                className="text-sm border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
              >
                <option value="Core">Core</option>
                <option value="Important">Important</option>
                <option value="Preferred">Preferred</option>
              </select>
              <button
                type="button"
                onClick={handleAddSkill}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {requiredSkills.length > 0 && (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {requiredSkills.map((req) => (
                  <div
                    key={req.name}
                    className="px-3 py-2 flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-medium text-slate-800">{req.name}</span>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span className="font-mono tabular-nums">Target {req.minLevel}/5</span>
                      <span>{req.weight}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(req.name)}
                        aria-label={`Remove ${req.name}`}
                        className="p-1 text-slate-400 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              Save Internship Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
