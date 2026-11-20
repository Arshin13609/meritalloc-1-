import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import type {
  AllocationResponse,
  Internship,
  InternshipCapabilityScore,
  Student,
  StudentAllocation,
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function clampPercent(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(100, Math.round(val)));
}

/**
 * Deterministic maximum-weight greedy/capacity-enforced seat allocator
 * using AI-scored capability percentages so seat limits are strictly respected.
 */
function assignSeatsFromCapabilities(
  students: Student[],
  internships: Internship[],
  aiScoresByStudent: Map<string, InternshipCapabilityScore[]>
): StudentAllocation[] {
  const remainingSeats = new Map<string, number>();
  for (const internship of internships) {
    remainingSeats.set(internship.id, Math.max(0, internship.seats));
  }

  // Build candidate (student, internship, score) edges
  interface Edge {
    studentId: string;
    internshipId: string;
    capabilityPercent: number;
    preferenceBonus: number;
  }

  const edges: Edge[] = [];
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const internshipMap = new Map(internships.map((i) => [i.id, i]));

  for (const student of students) {
    const scores = aiScoresByStudent.get(student.id) ?? [];
    for (const score of scores) {
      const internship = internshipMap.get(score.internshipId);
      if (!internship) continue;
      // Slight preference alignment tiebreaker (0-3 pts) if preferredTrack overlaps role/dept
      const prefLower = student.preferredTrack.toLowerCase();
      const roleLower = `${internship.title} ${internship.department}`.toLowerCase();
      const preferenceBonus =
        prefLower.split(/\s+/).some((tok) => tok.length > 3 && roleLower.includes(tok)) ? 2 : 0;

      edges.push({
        studentId: student.id,
        internshipId: score.internshipId,
        capabilityPercent: clampPercent(score.capabilityPercent),
        preferenceBonus,
      });
    }
  }

  // Sort highest capability (with preference tiebreaker) first
  edges.sort(
    (a, b) =>
      b.capabilityPercent + b.preferenceBonus - (a.capabilityPercent + a.preferenceBonus)
  );

  const assignedInternshipByStudent = new Map<string, { internshipId: string; capability: number }>();

  for (const edge of edges) {
    if (assignedInternshipByStudent.has(edge.studentId)) continue;
    const seatsLeft = remainingSeats.get(edge.internshipId) ?? 0;
    if (seatsLeft <= 0) continue;
    // Minimum viability threshold of 45% capability
    if (edge.capabilityPercent < 45) continue;

    assignedInternshipByStudent.set(edge.studentId, {
      internshipId: edge.internshipId,
      capability: edge.capabilityPercent,
    });
    remainingSeats.set(edge.internshipId, seatsLeft - 1);
  }

  return students.map((student) => {
    const scores = [...(aiScoresByStudent.get(student.id) ?? [])].sort(
      (a, b) => b.capabilityPercent - a.capabilityPercent
    );
    const assigned = assignedInternshipByStudent.get(student.id);
    const topScore = scores[0]?.capabilityPercent ?? 0;

    if (assigned) {
      return {
        studentId: student.id,
        assignedInternshipId: assigned.internshipId,
        status: 'Allocated',
        assignedCapabilityPercent: assigned.capability,
        rankedMatches: scores,
      };
    }

    return {
      studentId: student.id,
      assignedInternshipId: null,
      status: topScore >= 55 ? 'Waitlisted' : 'Unmatched',
      assignedCapabilityPercent: topScore,
      rankedMatches: scores,
    };
  });
}

const CAPABILITY_SCORE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    internshipId: { type: Type.STRING },
    capabilityPercent: {
      type: Type.INTEGER,
      description: 'Overall capability percentage from 0 to 100.',
    },
    coreSkillMatchPercent: {
      type: Type.INTEGER,
      description: 'Core and important skill proficiency alignment from 0 to 100.',
    },
    projectRelevancePercent: {
      type: Type.INTEGER,
      description: 'Relevance of student projects to the internship description from 0 to 100.',
    },
    readinessPercent: {
      type: Type.INTEGER,
      description: 'Academic GPA, availability, and immediate onboarding readiness from 0 to 100.',
    },
    matchedSkills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          studentLevel: { type: Type.INTEGER },
          requiredLevel: { type: Type.INTEGER },
          contributionPercent: { type: Type.INTEGER },
          note: { type: Type.STRING },
        },
        required: ['skill', 'studentLevel', 'requiredLevel', 'contributionPercent', 'note'],
      },
    },
    missingSkills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          requiredLevel: { type: Type.INTEGER },
          studentLevel: { type: Type.INTEGER },
          severity: { type: Type.STRING, description: 'High, Moderate, or Minor' },
          upskillingTip: { type: Type.STRING },
        },
        required: ['skill', 'requiredLevel', 'studentLevel', 'severity', 'upskillingTip'],
      },
    },
    aiRationale: {
      type: Type.STRING,
      description: 'Concise 1-2 sentence explanation of why the student received this capability percentage.',
    },
  },
  required: [
    'internshipId',
    'capabilityPercent',
    'coreSkillMatchPercent',
    'projectRelevancePercent',
    'readinessPercent',
    'matchedSkills',
    'missingSkills',
    'aiRationale',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, model: MODEL_NAME });
  });

  // 1. Full Cohort AI Allocation Endpoint
  app.post('/api/allocate', async (req: Request, res: Response) => {
    try {
      const { students, internships } = req.body as {
        students?: Student[];
        internships?: Internship[];
      };

      if (!Array.isArray(students) || students.length === 0) {
        res.status(400).json({ error: 'At least one student is required for allocation.' });
        return;
      }
      if (!Array.isArray(internships) || internships.length === 0) {
        res.status(400).json({ error: 'At least one internship is required for allocation.' });
        return;
      }

      const ai = getGeminiClient();

      const prompt = `Evaluate every student against every internship role based on skill match (including semantic equivalents like SQL <-> PostgreSQL, CSS <-> Tailwind CSS), project relevance, GPA vs minGpa, and track preference.

For EACH student, return capability evaluations for ALL ${internships.length} internships (every single internshipId must be evaluated for every student so optimal seat allocation can be computed).
Also provide a concise 2-sentence executiveInsight summarizing the overall cohort skill-to-role fit.

Scoring calibration:
- 90–100%: Meets or exceeds all Core and Important skills with directly relevant project proof.
- 75–89%: Meets Core skills with minor gaps in Important/Preferred skills.
- 55–74%: Partial overlap or strong adjacent fundamentals; needs ramp-up.
- Below 55%: Significant missing Core skills.
- Ensure matchedSkills contributionPercent values are realistic and notes are concise (under 8 words).
- Ensure severity in missingSkills is strictly one of: "High", "Moderate", or "Minor".

STUDENTS:
${JSON.stringify(students, null, 2)}

INTERNSHIPS:
${JSON.stringify(internships, null, 2)}`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an objective, precision technical talent allocation engine for university internship placements. Evaluate capability percentages rigorously and consistently without inflation.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              studentEvaluations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    studentId: { type: Type.STRING },
                    internshipScores: {
                      type: Type.ARRAY,
                      items: CAPABILITY_SCORE_SCHEMA,
                    },
                  },
                  required: ['studentId', 'internshipScores'],
                },
              },
              executiveInsight: { type: Type.STRING },
            },
            required: ['studentEvaluations', 'executiveInsight'],
          },
        },
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error('Gemini returned an empty allocation response.');
      }

      const parsed = JSON.parse(rawText) as {
        studentEvaluations: Array<{
          studentId: string;
          internshipScores: InternshipCapabilityScore[];
        }>;
        executiveInsight: string;
      };

      const aiScoresByStudent = new Map<string, InternshipCapabilityScore[]>();
      for (const item of parsed.studentEvaluations ?? []) {
        const sanitized = (item.internshipScores ?? []).map((sc) => ({
          ...sc,
          capabilityPercent: clampPercent(sc.capabilityPercent),
          coreSkillMatchPercent: clampPercent(sc.coreSkillMatchPercent),
          projectRelevancePercent: clampPercent(sc.projectRelevancePercent),
          readinessPercent: clampPercent(sc.readinessPercent),
          missingSkills: (sc.missingSkills ?? []).map((gap) => ({
            ...gap,
            severity:
              gap.severity === 'High' || gap.severity === 'Moderate' || gap.severity === 'Minor'
                ? gap.severity
                : 'Moderate',
          })),
        }));
        aiScoresByStudent.set(item.studentId, sanitized);
      }

      const allocations = assignSeatsFromCapabilities(students, internships, aiScoresByStudent);

      const allocatedList = allocations.filter((a) => a.status === 'Allocated');
      const totalSeatsAvailable = internships.reduce((sum, i) => sum + Math.max(0, i.seats), 0);
      const averageCapabilityPercent =
        allocatedList.length > 0
          ? Math.round(
              allocatedList.reduce((sum, a) => sum + a.assignedCapabilityPercent, 0) /
                allocatedList.length
            )
          : 0;
      const placementRatePercent = Math.round((allocatedList.length / students.length) * 100);

      const result: AllocationResponse = {
        allocations,
        summary: {
          averageCapabilityPercent,
          placementRatePercent,
          totalSeatsFilled: allocatedList.length,
          totalSeatsAvailable,
          executiveInsight:
            parsed.executiveInsight ||
            `Evaluated ${students.length} candidates across ${internships.length} internships with ${allocatedList.length} seat placements.`,
          evaluatedBy: 'gemini-4-hydrogen',
          evaluatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      };

      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to run AI allocation.';
      console.error('Allocation error:', err);
      res.status(500).json({ error: message });
    }
  });

  // 2. Single Student Capability Evaluation Endpoint
  app.post('/api/evaluate-student', async (req: Request, res: Response) => {
    try {
      const { student, internships } = req.body as {
        student?: Student;
        internships?: Internship[];
      };

      if (!student || !Array.isArray(internships) || internships.length === 0) {
        res.status(400).json({ error: 'Student profile and internships list are required.' });
        return;
      }

      const ai = getGeminiClient();

      const prompt = `Evaluate this single student against ALL ${internships.length} internships and return exact capability percentages, sub-scores, matchedSkills, missingSkills, and concise rationale for each internship.

STUDENT:
${JSON.stringify(student, null, 2)}

INTERNSHIPS:
${JSON.stringify(internships, null, 2)}`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a precision technical talent evaluator. Return calibrated 0-100 capability percentages for each internship based on concrete skill levels and project evidence.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              internshipScores: {
                type: Type.ARRAY,
                items: CAPABILITY_SCORE_SCHEMA,
              },
            },
            required: ['internshipScores'],
          },
        },
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error('Gemini returned an empty evaluation response.');
      }

      const parsed = JSON.parse(rawText) as {
        internshipScores: InternshipCapabilityScore[];
      };

      const rankedMatches = (parsed.internshipScores ?? [])
        .map((sc) => ({
          ...sc,
          capabilityPercent: clampPercent(sc.capabilityPercent),
          coreSkillMatchPercent: clampPercent(sc.coreSkillMatchPercent),
          projectRelevancePercent: clampPercent(sc.projectRelevancePercent),
          readinessPercent: clampPercent(sc.readinessPercent),
          missingSkills: (sc.missingSkills ?? []).map((gap) => ({
            ...gap,
            severity:
              gap.severity === 'High' || gap.severity === 'Moderate' || gap.severity === 'Minor'
                ? gap.severity
                : 'Moderate',
          })),
        }))
        .sort((a, b) => b.capabilityPercent - a.capabilityPercent);

      res.json({ studentId: student.id, rankedMatches });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to evaluate student capability.';
      console.error('Evaluate student error:', err);
      res.status(500).json({ error: message });
    }
  });

  // 2b. Single Recruiter Role Evaluation Endpoint (all students vs one posted role)
  app.post('/api/evaluate-role', async (req: Request, res: Response) => {
    try {
      const { internship, students } = req.body as {
        internship?: Internship;
        students?: Student[];
      };

      if (!internship || !Array.isArray(students) || students.length === 0) {
        res.status(400).json({ error: 'Internship role and at least one student are required.' });
        return;
      }

      const ai = getGeminiClient();

      const prompt = `Evaluate EVERY student in the list below against this single posted internship role and return calibrated 0-100 capability percentages, sub-scores, matchedSkills, missingSkills, and concise rationale for each student.

POSTED INTERNSHIP ROLE:
${JSON.stringify(internship, null, 2)}

STUDENTS:
${JSON.stringify(students, null, 2)}`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a precision technical talent evaluator for hiring recruiters. Return calibrated 0-100 capability percentages for every student against the posted role.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              studentScores: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    studentId: { type: Type.STRING },
                    capabilityPercent: { type: Type.INTEGER },
                    coreSkillMatchPercent: { type: Type.INTEGER },
                    projectRelevancePercent: { type: Type.INTEGER },
                    readinessPercent: { type: Type.INTEGER },
                    matchedSkills: CAPABILITY_SCORE_SCHEMA.properties.matchedSkills,
                    missingSkills: CAPABILITY_SCORE_SCHEMA.properties.missingSkills,
                    aiRationale: { type: Type.STRING },
                  },
                  required: [
                    'studentId',
                    'capabilityPercent',
                    'coreSkillMatchPercent',
                    'projectRelevancePercent',
                    'readinessPercent',
                    'matchedSkills',
                    'missingSkills',
                    'aiRationale',
                  ],
                },
              },
            },
            required: ['studentScores'],
          },
        },
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error('Gemini returned an empty role evaluation response.');
      }

      const parsed = JSON.parse(rawText) as {
        studentScores: Array<
          Omit<InternshipCapabilityScore, 'internshipId'> & { studentId: string }
        >;
      };

      const studentScores = (parsed.studentScores ?? [])
        .map((sc) => ({
          ...sc,
          internshipId: internship.id,
          capabilityPercent: clampPercent(sc.capabilityPercent),
          coreSkillMatchPercent: clampPercent(sc.coreSkillMatchPercent),
          projectRelevancePercent: clampPercent(sc.projectRelevancePercent),
          readinessPercent: clampPercent(sc.readinessPercent),
          missingSkills: (sc.missingSkills ?? []).map((gap) => ({
            ...gap,
            severity:
              gap.severity === 'High' || gap.severity === 'Moderate' || gap.severity === 'Minor'
                ? gap.severity
                : 'Moderate',
          })),
        }))
        .sort((a, b) => b.capabilityPercent - a.capabilityPercent);

      res.json({ internshipId: internship.id, studentScores });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to evaluate candidates for role.';
      console.error('Evaluate role error:', err);
      res.status(500).json({ error: message });
    }
  });

  // 3. Resume / Bio Skill Extractor Endpoint
  app.post('/api/parse-resume', async (req: Request, res: Response) => {
    try {
      const { resumeText } = req.body as { resumeText?: string };
      if (!resumeText || resumeText.trim().length < 20) {
        res.status(400).json({ error: 'Please provide at least a short resume or project summary.' });
        return;
      }

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Extract structured student profile fields and technical skills (with proficiency 1-5 based on depth of evidence) from the following resume or bio text:\n\n${resumeText}`,
        config: {
          systemInstruction:
            'Extract factual student details and calibrate skill levels 1 (introductory) to 5 (production/research mastery). Return valid JSON.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              university: { type: Type.STRING },
              major: { type: Type.STRING },
              graduationYear: { type: Type.INTEGER },
              gpa: { type: Type.NUMBER },
              preferredTrack: { type: Type.STRING },
              projectsSummary: { type: Type.STRING },
              skills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    level: { type: Type.INTEGER },
                  },
                  required: ['name', 'level'],
                },
              },
            },
            required: ['name', 'university', 'major', 'graduationYear', 'gpa', 'preferredTrack', 'projectsSummary', 'skills'],
          },
        },
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error('Gemini returned an empty parse response.');
      }

      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse resume text.';
      console.error('Resume parse error:', err);
      res.status(500).json({ error: message });
    }
  });

  // Vite middleware for dev, static dist for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MeritAlloc server listening on http://localhost:${PORT}`);
  });
}

startServer();
