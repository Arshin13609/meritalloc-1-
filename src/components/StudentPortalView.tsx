import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Search,
  ChevronRight,
  X,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
} from 'lucide-react';
import type {
  Internship,
  PersistedCapabilityEvaluation,
  Student,
  StudentSkill,
} from '../types';
import { CapabilityMeter, getCapabilityBand } from './CapabilityMeter';

interface StudentPortalViewProps {
  uid: string;
  defaultDisplayName: string;
  savedProfile: Student | null;
  internships: Internship[];
  evaluations: PersistedCapabilityEvaluation[];
  isSavingAndScoring: boolean;
  onSaveProfileAndEvaluate: (
    profile: Omit<Student, 'id' | 'uid' | 'email'>,
    hasExistingProfile: boolean
  ) => Promise<void>;
  onRecalculateAll: () => Promise<void>;
  onSeedStarterInternships: () => Promise<void>;
}

export function StudentPortalView({
  defaultDisplayName,
  savedProfile,
  internships,
  evaluations,
  isSavingAndScoring,
  onSaveProfileAndEvaluate,
  onRecalculateAll,
  onSeedStarterInternships,
}: StudentPortalViewProps) {
  const [subTab, setSubTab] = useState<'profile' | 'matches'>(
    savedProfile ? 'matches' : 'profile'
  );

  // Profile form state
  const [name, setName] = useState(savedProfile?.name ?? defaultDisplayName);
  const [university, setUniversity] = useState(savedProfile?.university ?? '');
  const [major, setMajor] = useState(savedProfile?.major ?? 'B.S. Computer Science');
  const [graduationYear, setGraduationYear] = useState(
    savedProfile?.graduationYear ?? 2027
  );
  const [gpa, setGpa] = useState(savedProfile?.gpa ?? 3.6);
  const [preferredTrack, setPreferredTrack] = useState(
    savedProfile?.preferredTrack ?? 'Software Engineering'
  );
  const [availability, setAvailability] = useState<Student['availability']>(
    savedProfile?.availability ?? 'Full-time (12 wks)'
  );
  const [projectsSummary, setProjectsSummary] = useState(
    savedProfile?.projectsSummary ?? ''
  );
  const [skills, setSkills] = useState<StudentSkill[]>(
    savedProfile?.skills ?? [
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

  // Matches filter & drawer
  const [searchQuery, setSearchQuery] = useState('');
  const [minFitFilter, setMinFitFilter] = useState<0 | 60 | 80>(0);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string | null>(null);
  const [isSeedingRoles, setIsSeedingRoles] = useState(false);

  // Sync form when savedProfile loads from Firestore
  useEffect(() => {
    if (savedProfile) {
      setName(savedProfile.name);
      setUniversity(savedProfile.university);
      setMajor(savedProfile.major);
      setGraduationYear(savedProfile.graduationYear);
      setGpa(savedProfile.gpa);
      setPreferredTrack(savedProfile.preferredTrack);
      setAvailability(savedProfile.availability);
      setProjectsSummary(savedProfile.projectsSummary);
      setSkills(savedProfile.skills);
    }
  }, [savedProfile]);

  const evalByInternshipId = useMemo(
    () => new Map(evaluations.map((e) => [e.internshipId, e])),
    [evaluations]
  );

  const rankedInternships = useMemo(() => {
    return internships
      .map((role) => ({
        role,
        evaluation: evalByInternshipId.get(role.id) ?? null,
      }))
      .filter(({ role, evaluation }) => {
        if (minFitFilter > 0 && (evaluation?.capabilityPercent ?? 0) < minFitFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const skillText = role.requiredSkills.map((r) => r.name.toLowerCase()).join(' ');
          return (
            role.title.toLowerCase().includes(q) ||
            role.company.toLowerCase().includes(q) ||
            role.department.toLowerCase().includes(q) ||
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
  }, [internships, evalByInternshipId, minFitFilter, searchQuery]);

  const bestCapability = useMemo(() => {
    if (evaluations.length === 0) return 0;
    return Math.max(...evaluations.map((e) => e.capabilityPercent));
  }, [evaluations]);

  const selectedDetail = useMemo(() => {
    if (!selectedInternshipId) return null;
    const role = internships.find((i) => i.id === selectedInternshipId) ?? null;
    if (!role) return null;
    return {
      role,
      evaluation: evalByInternshipId.get(role.id) ?? null,
    };
  }, [selectedInternshipId, internships, evalByInternshipId]);

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

  const handleParseResume = async () => {
    if (resumeText.trim().length < 20) {
      setParseError('Paste at least 20 characters of resume or project text.');
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
      if (!res.ok) throw new Error(data.error || 'Failed to extract skills.');
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

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !university.trim() || skills.length === 0) {
      setFormError('Full name, university, and at least one skill are required.');
      return;
    }
    setFormError(null);
    await onSaveProfileAndEvaluate(
      {
        name: name.trim(),
        university: university.trim(),
        major: major.trim() || 'Computer Science',
        graduationYear: Number(graduationYear) || 2027,
        gpa: Math.max(0, Math.min(4.0, Number(gpa) || 3.5)),
        preferredTrack: preferredTrack.trim() || 'Software Engineering',
        availability,
        projectsSummary:
          projectsSummary.trim() || 'Academic engineering coursework and capstone projects.',
        skills,
      },
      Boolean(savedProfile)
    );
    setSubTab('matches');
  };

  const handleLoadStarterRoles = async () => {
    setIsSeedingRoles(true);
    try {
      await onSeedStarterInternships();
    } finally {
      setIsSeedingRoles(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Workspace Header & Segmented Sub-Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Student Workspace</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Save your academic info and skills to see your AI-computed capability percentage for each open internship.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSubTab('profile')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Profile & Skills
          </button>
          <button
            type="button"
            onClick={() => setSubTab('matches')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'matches'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Internships & Capability % ({internships.length})
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500">Profile Status</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">
            {savedProfile ? 'Saved & Published' : 'Not Saved Yet'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {savedProfile
              ? `${savedProfile.skills.length} skills · ${savedProfile.gpa.toFixed(2)} GPA`
              : 'Complete your profile below to compute capability %'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500">Highest Internship Capability</p>
          <p className="text-2xl font-mono tabular-nums font-semibold text-emerald-700 mt-1">
            {evaluations.length > 0 ? `${bestCapability}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {evaluations.length > 0
              ? 'Peak match across open internships'
              : 'Save profile to calculate matches'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500">Open Internships Evaluated</p>
          <p className="text-2xl font-mono tabular-nums font-semibold text-slate-900 mt-1">
            {evaluations.length} / {internships.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {
              evaluations.filter(
                (e) => e.allocationStatus === 'Shortlisted' || e.allocationStatus === 'Allocated'
              ).length
            }{' '}
            shortlisted or allocated by recruiters
          </p>
        </div>
      </section>

      {subTab === 'profile' ? (
        <form
          onSubmit={handleSubmitProfile}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
        >
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Basic Information & Skill Profile
              </h3>
              <p className="text-xs text-slate-500">
                Your profile is saved to your account and evaluated against every open internship posting.
              </p>
            </div>
            {savedProfile && (
              <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved to Firestore
              </span>
            )}
          </div>

          {/* Optional AI Resume Helper */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="student-resume-paste" className="text-xs font-semibold text-slate-800">
                Quick Fill from Resume or Bio (Optional AI Extraction)
              </label>
              <button
                type="button"
                onClick={handleParseResume}
                disabled={isParsingResume}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isParsingResume ? 'Extracting...' : 'Extract Skills with AI'}
              </button>
            </div>
            <textarea
              id="student-resume-paste"
              rows={2}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume summary, coursework, or GitHub bio to auto-fill fields and 1–5 skill ratings..."
              className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {parseError && <p className="text-xs text-red-700">{parseError}</p>}
          </div>

          {formError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
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
                placeholder="e.g., Stanford University"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Degree / Major</label>
              <input
                type="text"
                required
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Grad Year
                </label>
                <input
                  type="number"
                  min={2020}
                  max={2035}
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(Number(e.target.value))}
                  className="w-full text-sm font-mono tabular-nums border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  GPA (4.0)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={4.0}
                  value={gpa}
                  onChange={(e) => setGpa(Number(e.target.value))}
                  className="w-full text-sm font-mono tabular-nums border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Preferred Internship Track
              </label>
              <input
                type="text"
                value={preferredTrack}
                onChange={(e) => setPreferredTrack(e.target.value)}
                placeholder="e.g., Frontend Systems, Applied ML"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as Student['availability'])}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Full-time (12 wks)">Full-time (12 wks)</option>
                <option value="Full-time (16 wks)">Full-time (16 wks)</option>
                <option value="Part-time (20 hrs/wk)">Part-time (20 hrs/wk)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Projects & Technical Experience
            </label>
            <textarea
              rows={3}
              value={projectsSummary}
              onChange={(e) => setProjectsSummary(e.target.value)}
              placeholder="Describe projects you have built, tools used, and measurable outcomes..."
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Technical Skills */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Your Technical Skills (1 = Beginner, 5 = Mastery)
              </label>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {skills.length} / 25 skills
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
                placeholder="Add skill (e.g., Python, React, PostgreSQL)"
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
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer whitespace-nowrap"
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
                    className="px-3.5 py-2 flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-medium text-slate-800">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={skill.level}
                        onChange={(e) =>
                          setSkills(
                            skills.map((s) =>
                              s.name === skill.name
                                ? {
                                    ...s,
                                    level: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                                  }
                                : s
                            )
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
                        onClick={() =>
                          setSkills(skills.filter((s) => s.name !== skill.name))
                        }
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
              type="submit"
              disabled={isSavingAndScoring}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSavingAndScoring
                ? 'Saving Profile & Scoring Internships...'
                : 'Save Profile & Calculate Internship Capability %'}
            </button>
          </div>
        </form>
      ) : (
        /* Student Matches & Capability % View */
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search internship, company, or skill..."
                  aria-label="Search internships"
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {([
                  { val: 0, label: 'All Roles' },
                  { val: 80, label: '80%+ High Fit' },
                  { val: 60, label: '60%+ Match' },
                ] as const).map((tab) => (
                  <button
                    key={tab.val}
                    type="button"
                    onClick={() => setMinFitFilter(tab.val)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      minFitFilter === tab.val
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onRecalculateAll}
              disabled={isSavingAndScoring || !savedProfile || internships.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSavingAndScoring ? 'animate-spin' : ''}`}
              />
              {isSavingAndScoring ? 'Scoring...' : 'Recalculate Capability %'}
            </button>
          </div>

          {internships.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-900">
                No open internships posted yet
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Recruiters have not posted internship roles yet. You can load 6 starter open internships to test your capability percentages right away.
              </p>
              <button
                type="button"
                onClick={handleLoadStarterRoles}
                disabled={isSeedingRoles}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
              >
                {isSeedingRoles ? 'Loading Roles...' : 'Load 6 Starter Open Internships'}
              </button>
            </div>
          ) : isSavingAndScoring ? (
            <div className="divide-y divide-slate-200">
              {Array.from({ length: Math.min(6, internships.length) }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
                  <div className="space-y-1.5">
                    <div className="h-4 w-48 bg-slate-200 rounded" />
                    <div className="h-3 w-64 bg-slate-100 rounded" />
                  </div>
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {!savedProfile && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Save your profile &amp; skills to calculate your capability percentage
                    </p>
                    <p className="text-xs text-slate-600">
                      You can browse all {internships.length} open internship roles below. Enter your academic info and skills to score your fit against every role.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubTab('profile')}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
                  >
                    Complete My Profile
                  </button>
                </div>
              )}

              {rankedInternships.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <p className="text-sm font-medium text-slate-900">
                    No internships match your filter
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setMinFitFilter(0);
                    }}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Show All Internships
                  </button>
                </div>
              ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                    <th className="py-2.5 px-4">Internship Role</th>
                    <th className="py-2.5 px-4">Required Skills</th>
                    <th className="py-2.5 px-4">Your Capability %</th>
                    <th className="py-2.5 px-4">Core Skills</th>
                    <th className="py-2.5 px-4">Recruiter Status</th>
                    <th className="py-2.5 px-4 text-right">Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {rankedInternships.map(({ role, evaluation }) => (
                    <tr
                      key={role.id}
                      onClick={() => setSelectedInternshipId(role.id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 min-w-[230px]">
                        <p className="font-semibold text-slate-900">{role.title}</p>
                        <p className="text-xs text-slate-500">
                          {role.company} · {role.location} · {role.stipend}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 max-w-[260px]">
                        <p className="text-xs text-slate-600 truncate">
                          {role.requiredSkills
                            .slice(0, 4)
                            .map((r) => r.name)
                            .join(' · ')}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {evaluation ? (
                          <CapabilityMeter percent={evaluation.capabilityPercent} compact />
                        ) : (
                          <span className="text-xs text-slate-400">Not scored</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-700">
                        {evaluation ? `${evaluation.coreSkillMatchPercent}%` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        {evaluation ? (
                          <span
                            className={
                              evaluation.allocationStatus === 'Allocated'
                                ? 'font-semibold text-emerald-700'
                                : evaluation.allocationStatus === 'Shortlisted'
                                  ? 'font-semibold text-blue-700'
                                  : 'text-slate-600'
                            }
                          >
                            {evaluation.allocationStatus}
                          </span>
                        ) : (
                          <span className="text-slate-400">Pending</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInternshipId(role.id);
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
            </>
          )}
        </section>
      )}

      {/* Internship Capability Breakdown Drawer */}
      {selectedDetail && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/30"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0"
            onClick={() => setSelectedInternshipId(null)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-full max-w-xl bg-white border-l border-slate-200 h-full overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 truncate">
                  {selectedDetail.role.title}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {selectedDetail.role.company} · {selectedDetail.role.department} ·{' '}
                  {selectedDetail.role.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInternshipId(null)}
                aria-label="Close detail panel"
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedDetail.evaluation ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Your Capability for This Role
                      </p>
                      <p
                        className={`text-4xl font-mono tabular-nums font-semibold mt-1 ${
                          getCapabilityBand(selectedDetail.evaluation.capabilityPercent)
                            .textColor
                        }`}
                      >
                        {selectedDetail.evaluation.capabilityPercent}%
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {
                          getCapabilityBand(selectedDetail.evaluation.capabilityPercent)
                            .label
                        }{' '}
                        · Status: {selectedDetail.evaluation.allocationStatus}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500 font-mono tabular-nums">
                      <p>{selectedDetail.role.seats} open seats</p>
                      <p>{selectedDetail.role.stipend}</p>
                      <p>Min {selectedDetail.role.minGpa.toFixed(1)} GPA</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Core Skills</p>
                      <CapabilityMeter
                        percent={selectedDetail.evaluation.coreSkillMatchPercent}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Project Fit</p>
                      <CapabilityMeter
                        percent={selectedDetail.evaluation.projectRelevancePercent}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Readiness</p>
                      <CapabilityMeter
                        percent={selectedDetail.evaluation.readinessPercent}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-800 mb-1">
                      AI Capability Assessment
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedDetail.evaluation.aiRationale}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      Matched Skills
                    </h4>
                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 text-xs">
                      {selectedDetail.evaluation.matchedSkills.map((ms) => (
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
                      {selectedDetail.evaluation.matchedSkills.length === 0 && (
                        <p className="px-3 py-3 text-slate-500">No overlapping skills.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Skill Gaps & How to Improve
                    </h4>
                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 text-xs">
                      {selectedDetail.evaluation.missingSkills.map((gap) => (
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
                      {selectedDetail.evaluation.missingSkills.length === 0 && (
                        <p className="px-3 py-3 text-emerald-700">
                          You meet or exceed every required skill for this internship.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    {savedProfile
                      ? 'This internship has not been scored against your current profile yet.'
                      : 'Save your basic info and skills first to compute your exact capability percentage for this role.'}
                  </p>
                  {savedProfile ? (
                    <button
                      type="button"
                      onClick={onRecalculateAll}
                      disabled={isSavingAndScoring}
                      className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                    >
                      Calculate My Capability %
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInternshipId(null);
                        setSubTab('profile');
                      }}
                      className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
                    >
                      Go to My Profile &amp; Skills
                    </button>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <h4 className="text-xs font-semibold text-slate-800">Role Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedDetail.role.description}
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
