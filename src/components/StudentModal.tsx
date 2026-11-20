import { useState } from 'react';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import type { Student, StudentSkill } from '../types';

interface StudentModalProps {
  initialStudent: Student | null;
  onClose: () => void;
  onSave: (student: Student, runAiEvaluate: boolean) => void;
}

export function StudentModal({ initialStudent, onClose, onSave }: StudentModalProps) {
  const isEditing = Boolean(initialStudent);

  const [name, setName] = useState(initialStudent?.name ?? '');
  const [email, setEmail] = useState(initialStudent?.email ?? '');
  const [university, setUniversity] = useState(initialStudent?.university ?? '');
  const [major, setMajor] = useState(initialStudent?.major ?? 'B.S. Computer Science');
  const [graduationYear, setGraduationYear] = useState(
    initialStudent?.graduationYear ?? 2027
  );
  const [gpa, setGpa] = useState(initialStudent?.gpa ?? 3.7);
  const [preferredTrack, setPreferredTrack] = useState(
    initialStudent?.preferredTrack ?? 'Software Engineering'
  );
  const [availability, setAvailability] = useState<Student['availability']>(
    initialStudent?.availability ?? 'Full-time (12 wks)'
  );
  const [projectsSummary, setProjectsSummary] = useState(
    initialStudent?.projectsSummary ?? ''
  );
  const [skills, setSkills] = useState<StudentSkill[]>(
    initialStudent?.skills ?? [
      { name: 'TypeScript', level: 4 },
      { name: 'React', level: 4 },
    ]
  );

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<1 | 2 | 3 | 4 | 5>(3);

  const [resumeText, setResumeText] = useState('');
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddSkill = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillName('');
      return;
    }
    setSkills([...skills, { name: trimmed, level: newSkillLevel }]);
    setNewSkillName('');
    setNewSkillLevel(3);
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkills(skills.filter((s) => s.name !== skillName));
  };

  const handleUpdateSkillLevel = (skillName: string, level: 1 | 2 | 3 | 4 | 5) => {
    setSkills(skills.map((s) => (s.name === skillName ? { ...s, level } : s)));
  };

  const handleParseResume = async () => {
    if (resumeText.trim().length < 20) {
      setParseError('Paste at least 20 characters of resume or bio text.');
      return;
    }
    setParseError(null);
    setIsParsingResume(true);
    try {
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse resume text.');
      }
      if (data.name) setName(data.name);
      if (data.university) setUniversity(data.university);
      if (data.major) setMajor(data.major);
      if (data.graduationYear) setGraduationYear(Number(data.graduationYear));
      if (data.gpa) setGpa(Number(data.gpa));
      if (data.preferredTrack) setPreferredTrack(data.preferredTrack);
      if (data.projectsSummary) setProjectsSummary(data.projectsSummary);
      if (Array.isArray(data.skills) && data.skills.length > 0) {
        setSkills(
          data.skills.map((sk: { name: string; level: number }) => ({
            name: sk.name,
            level: Math.max(1, Math.min(5, Math.round(sk.level))) as 1 | 2 | 3 | 4 | 5,
          }))
        );
      }
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Unable to parse resume.');
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleSubmit = (e: React.FormEvent, evaluateNow: boolean) => {
    e.preventDefault();
    if (!name.trim() || !university.trim() || skills.length === 0) {
      setFormError('Student name, university, and at least one skill are required.');
      return;
    }
    const student: Student = {
      id: initialStudent?.id ?? `stu-${Date.now()}`,
      name: name.trim(),
      email:
        email.trim() ||
        `${name.trim().toLowerCase().replace(/\s+/g, '.')}@university.edu`,
      university: university.trim(),
      major: major.trim() || 'Computer Science',
      graduationYear: Number(graduationYear) || 2027,
      gpa: Math.max(0, Math.min(4.0, Number(gpa) || 3.5)),
      preferredTrack: preferredTrack.trim() || 'General Engineering',
      availability,
      projectsSummary:
        projectsSummary.trim() || 'Coursework and capstone engineering projects.',
      skills,
      avatarUrl: initialStudent?.avatarUrl,
    };
    onSave(student, evaluateNow);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 id="student-modal-title" className="text-lg font-semibold text-slate-900">
            {isEditing ? `Edit Candidate — ${initialStudent?.name}` : 'Add Student Candidate'}
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

        <form onSubmit={(e) => handleSubmit(e, true)} className="p-6 space-y-6">
          {/* AI Resume Extraction Helper */}
          {!isEditing && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="resume-paste"
                  className="text-xs font-semibold text-slate-800"
                >
                  Paste Resume or Project Bio (AI Skill Extraction)
                </label>
                <button
                  type="button"
                  onClick={handleParseResume}
                  disabled={isParsingResume}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isParsingResume ? 'Extracting...' : 'Extract Skills with AI'}
                </button>
              </div>
              <textarea
                id="resume-paste"
                rows={3}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste a student's resume snippet, GitHub bio, or project list to automatically populate profile fields and calibrated 1-5 skill levels..."
                className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {parseError && <p className="text-xs text-red-700">{parseError}</p>}
            </div>
          )}

          {formError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Jordan Patel"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="j.patel@university.edu"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">University</label>
              <input
                type="text"
                required
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g., Purdue University"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Degree / Major</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Cumulative GPA (4.0 scale)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                value={gpa}
                onChange={(e) => setGpa(Number(e.target.value))}
                className="w-full text-sm font-mono tabular-nums border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Availability</label>
              <select
                value={availability}
                onChange={(e) =>
                  setAvailability(e.target.value as Student['availability'])
                }
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Full-time (12 wks)">Full-time (12 wks)</option>
                <option value="Full-time (16 wks)">Full-time (16 wks)</option>
                <option value="Part-time (20 hrs/wk)">Part-time (20 hrs/wk)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Preferred Internship Track
              </label>
              <input
                type="text"
                value={preferredTrack}
                onChange={(e) => setPreferredTrack(e.target.value)}
                placeholder="e.g., Backend & Distributed Systems"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Graduation Year
              </label>
              <input
                type="number"
                min="2025"
                max="2031"
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                className="w-full text-sm font-mono tabular-nums border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Key Projects & Technical Experience
            </label>
            <textarea
              rows={2}
              value={projectsSummary}
              onChange={(e) => setProjectsSummary(e.target.value)}
              placeholder="Summarize notable engineering projects, research, or prior internships..."
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Skills Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Technical Skills & Proficiency (1 = Intro, 5 = Mastery)
              </label>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {skills.length} skills
              </span>
            </div>

            <div className="flex gap-2">
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
                placeholder="Add skill (e.g., Python, Kubernetes, Figma)"
                className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <select
                value={newSkillLevel}
                onChange={(e) =>
                  setNewSkillLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                }
                className="text-sm font-mono border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
              >
                <option value={1}>1 / 5</option>
                <option value={2}>2 / 5</option>
                <option value={3}>3 / 5</option>
                <option value={4}>4 / 5</option>
                <option value={5}>5 / 5</option>
              </select>
              <button
                type="button"
                onClick={handleAddSkill}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {skills.length > 0 && (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="px-3 py-2 flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-medium text-slate-800">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={skill.level}
                        onChange={(e) =>
                          handleUpdateSkillLevel(
                            skill.name,
                            Number(e.target.value) as 1 | 2 | 3 | 4 | 5
                          )
                        }
                        className="text-xs font-mono border border-slate-300 rounded px-2 py-1 bg-white"
                      >
                        <option value={1}>Level 1</option>
                        <option value={2}>Level 2</option>
                        <option value={3}>Level 3</option>
                        <option value={4}>Level 4</option>
                        <option value={5}>Level 5</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill.name)}
                        aria-label={`Remove ${skill.name}`}
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
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              className="px-4 py-2 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              Save Only
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              Save & Calculate AI Capability %
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
