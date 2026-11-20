import { AllocationResponse, Internship, Student } from '../types';

export const INITIAL_INTERNSHIPS: Internship[] = [
  {
    id: 'int-frontend-sys',
    title: 'Frontend Systems Intern',
    company: 'Vektor Cloud',
    department: 'Product Engineering',
    location: 'San Francisco · Hybrid',
    duration: '12 Weeks',
    stipend: '$44/hr',
    seats: 2,
    minGpa: 3.3,
    description:
      'Build high-density telemetry dashboards, accessible design system primitives, and real-time state visualizations using React and TypeScript.',
    requiredSkills: [
      { name: 'TypeScript', minLevel: 4, weight: 'Core' },
      { name: 'React', minLevel: 4, weight: 'Core' },
      { name: 'Tailwind CSS', minLevel: 3, weight: 'Important' },
      { name: 'REST / GraphQL APIs', minLevel: 3, weight: 'Important' },
      { name: 'Web Accessibility', minLevel: 3, weight: 'Preferred' },
    ],
  },
  {
    id: 'int-ml-pipelines',
    title: 'Applied ML & Data Intern',
    company: 'Northstar BioLabs',
    department: 'Computational AI',
    location: 'Boston · On-site',
    duration: '16 Weeks',
    stipend: '$48/hr',
    seats: 2,
    minGpa: 3.5,
    description:
      'Train and evaluate tabular and NLP scoring pipelines in PyTorch, optimize SQL feature stores, and benchmark model calibration.',
    requiredSkills: [
      { name: 'Python', minLevel: 4, weight: 'Core' },
      { name: 'PyTorch', minLevel: 4, weight: 'Core' },
      { name: 'SQL', minLevel: 3, weight: 'Important' },
      { name: 'Statistical Modeling', minLevel: 3, weight: 'Important' },
      { name: 'Docker', minLevel: 2, weight: 'Preferred' },
    ],
  },
  {
    id: 'int-cloud-infra',
    title: 'Cloud Infrastructure Intern',
    company: 'Strata Mesh',
    department: 'Platform Reliability',
    location: 'Seattle · Hybrid',
    duration: '12 Weeks',
    stipend: '$46/hr',
    seats: 1,
    minGpa: 3.4,
    description:
      'Automate Kubernetes workload scheduling, write Go observability agents, and harden Terraform multi-region deployments.',
    requiredSkills: [
      { name: 'Go', minLevel: 3, weight: 'Core' },
      { name: 'Kubernetes', minLevel: 3, weight: 'Core' },
      { name: 'Linux Systems', minLevel: 4, weight: 'Important' },
      { name: 'Terraform', minLevel: 3, weight: 'Important' },
      { name: 'CI/CD Pipelines', minLevel: 3, weight: 'Preferred' },
    ],
  },
  {
    id: 'int-product-design',
    title: 'Product Design Engineering Intern',
    company: 'Atelier Financial',
    department: 'Design Systems',
    location: 'New York · Hybrid',
    duration: '12 Weeks',
    stipend: '$40/hr',
    seats: 1,
    minGpa: 3.2,
    description:
      'Bridge Figma component libraries and production React prototypes, run usability audits, and maintain typography and spacing tokens.',
    requiredSkills: [
      { name: 'Figma', minLevel: 4, weight: 'Core' },
      { name: 'Design Systems', minLevel: 4, weight: 'Core' },
      { name: 'HTML / CSS', minLevel: 4, weight: 'Important' },
      { name: 'React', minLevel: 3, weight: 'Important' },
      { name: 'User Research', minLevel: 3, weight: 'Preferred' },
    ],
  },
  {
    id: 'int-backend-api',
    title: 'Distributed Backend Intern',
    company: 'LedgerFlow',
    department: 'Core Payments',
    location: 'Austin · Remote',
    duration: '12 Weeks',
    stipend: '$45/hr',
    seats: 2,
    minGpa: 3.4,
    description:
      'Design idempotent Node.js/TypeScript and PostgreSQL microservices handling high-throughput financial ledger reconciliation.',
    requiredSkills: [
      { name: 'Node.js', minLevel: 4, weight: 'Core' },
      { name: 'PostgreSQL', minLevel: 4, weight: 'Core' },
      { name: 'TypeScript', minLevel: 3, weight: 'Important' },
      { name: 'Redis / Caching', minLevel: 3, weight: 'Important' },
      { name: 'System Design', minLevel: 3, weight: 'Preferred' },
    ],
  },
  {
    id: 'int-security-eng',
    title: 'Application Security Intern',
    company: 'Bastion Defense',
    department: 'Trust & Security',
    location: 'Washington DC · On-site',
    duration: '12 Weeks',
    stipend: '$47/hr',
    seats: 1,
    minGpa: 3.5,
    description:
      'Conduct automated SAST/DAST triage, audit OAuth 2.1 and RBAC boundaries, and author Python threat-detection analyzers.',
    requiredSkills: [
      { name: 'AppSec Auditing', minLevel: 4, weight: 'Core' },
      { name: 'Python', minLevel: 3, weight: 'Core' },
      { name: 'OAuth / IAM', minLevel: 3, weight: 'Important' },
      { name: 'Linux Systems', minLevel: 3, weight: 'Important' },
      { name: 'Network Protocols', minLevel: 3, weight: 'Preferred' },
    ],
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu-ananya',
    name: 'Ananya Deshmukh',
    email: 'a.deshmukh@stanford.edu',
    university: 'Stanford University',
    major: 'B.S. Computer Science',
    graduationYear: 2027,
    gpa: 3.91,
    preferredTrack: 'Frontend & UI Systems',
    availability: 'Full-time (12 wks)',
    avatarUrl: '/src/assets/images/student_portrait_one_1794931169196.jpg',
    projectsSummary:
      'Built an accessible real-time lab telemetry workbench in React, TypeScript, and Tailwind CSS with 99/100 Lighthouse accessibility scores and GraphQL subscriptions.',
    skills: [
      { name: 'TypeScript', level: 5 },
      { name: 'React', level: 5 },
      { name: 'Tailwind CSS', level: 4 },
      { name: 'REST / GraphQL APIs', level: 4 },
      { name: 'Web Accessibility', level: 4 },
      { name: 'Node.js', level: 3 },
    ],
  },
  {
    id: 'stu-kenji',
    name: 'Kenji Takahashi',
    email: 'ktakahashi@berkeley.edu',
    university: 'UC Berkeley',
    major: 'B.S. Electrical Engineering & CS',
    graduationYear: 2027,
    gpa: 3.84,
    preferredTrack: 'Cloud Infrastructure & Backend',
    availability: 'Full-time (12 wks)',
    avatarUrl: '/src/assets/images/student_portrait_two_1794931170846.jpg',
    projectsSummary:
      'Authored a Go-based Kubernetes pod autoscaler for university compute clusters and automated multi-env Terraform modules with GitHub Actions.',
    skills: [
      { name: 'Go', level: 4 },
      { name: 'Kubernetes', level: 4 },
      { name: 'Linux Systems', level: 5 },
      { name: 'Terraform', level: 4 },
      { name: 'CI/CD Pipelines', level: 4 },
      { name: 'PostgreSQL', level: 3 },
    ],
  },
  {
    id: 'stu-amara',
    name: 'Amara Okafor',
    email: 'aokafor@mit.edu',
    university: 'MIT',
    major: 'M.Eng. Data Science & AI',
    graduationYear: 2027,
    gpa: 3.95,
    preferredTrack: 'Machine Learning & Data',
    availability: 'Full-time (16 wks)',
    avatarUrl: '/src/assets/images/student_portrait_three_1794931170114.jpg',
    projectsSummary:
      'Published clinical NLP calibration benchmarks in PyTorch with DuckDB/SQL feature pipelines and containerized inference services.',
    skills: [
      { name: 'Python', level: 5 },
      { name: 'PyTorch', level: 5 },
      { name: 'SQL', level: 4 },
      { name: 'Statistical Modeling', level: 5 },
      { name: 'Docker', level: 3 },
      { name: 'PostgreSQL', level: 3 },
    ],
  },
  {
    id: 'stu-mateo',
    name: 'Mateo Alvarez',
    email: 'malvarez@cmu.edu',
    university: 'Carnegie Mellon University',
    major: 'B.Des. & Human-Computer Interaction',
    graduationYear: 2027,
    gpa: 3.76,
    preferredTrack: 'Design Engineering',
    availability: 'Full-time (12 wks)',
    avatarUrl: '/src/assets/images/student_portrait_four_1794931171190.jpg',
    projectsSummary:
      'Maintained a 45-component multi-brand Figma token system synced via Style Dictionary into production React and CSS primitives; led 18 usability sessions.',
    skills: [
      { name: 'Figma', level: 5 },
      { name: 'Design Systems', level: 5 },
      { name: 'HTML / CSS', level: 4 },
      { name: 'React', level: 4 },
      { name: 'User Research', level: 4 },
      { name: 'TypeScript', level: 3 },
    ],
  },
  {
    id: 'stu-claire',
    name: 'Claire Lindqvist',
    email: 'clindqvist@gatech.edu',
    university: 'Georgia Tech',
    major: 'B.S. Computer Science',
    graduationYear: 2027,
    gpa: 3.79,
    preferredTrack: 'Backend & Distributed Systems',
    availability: 'Full-time (12 wks)',
    projectsSummary:
      'Engineered an idempotent event-driven settlement queue in Node.js, TypeScript, PostgreSQL, and Redis capable of 4,200 tx/sec in load tests.',
    skills: [
      { name: 'Node.js', level: 5 },
      { name: 'PostgreSQL', level: 4 },
      { name: 'TypeScript', level: 4 },
      { name: 'Redis / Caching', level: 4 },
      { name: 'System Design', level: 4 },
      { name: 'Docker', level: 3 },
    ],
  },
  {
    id: 'stu-devon',
    name: 'Devon Mercer',
    email: 'dmercer@umich.edu',
    university: 'University of Michigan',
    major: 'B.S. Cybersecurity & Informatics',
    graduationYear: 2027,
    gpa: 3.82,
    preferredTrack: 'Security Engineering',
    availability: 'Full-time (12 wks)',
    projectsSummary:
      'Built an automated OAuth 2.1 scope analyzer and SAST rule pack in Python; placed top 5 in national collegiate cyber defense finals.',
    skills: [
      { name: 'AppSec Auditing', level: 4 },
      { name: 'Python', level: 4 },
      { name: 'OAuth / IAM', level: 4 },
      { name: 'Linux Systems', level: 4 },
      { name: 'Network Protocols', level: 4 },
      { name: 'Go', level: 2 },
    ],
  },
  {
    id: 'stu-priya',
    name: 'Priya Subramanian',
    email: 'psubramanian@utexas.edu',
    university: 'UT Austin',
    major: 'B.S. Computer Science',
    graduationYear: 2028,
    gpa: 3.68,
    preferredTrack: 'Full-Stack & Backend',
    availability: 'Full-time (12 wks)',
    projectsSummary:
      'Developed a collaborative campus course planner using React, TypeScript, Node.js, and PostgreSQL with role-based permissions.',
    skills: [
      { name: 'React', level: 4 },
      { name: 'TypeScript', level: 4 },
      { name: 'Node.js', level: 4 },
      { name: 'PostgreSQL', level: 3 },
      { name: 'Tailwind CSS', level: 3 },
      { name: 'REST / GraphQL APIs', level: 3 },
    ],
  },
  {
    id: 'stu-lucas',
    name: 'Lucas Moreau',
    email: 'lmoreau@uwaterloo.ca',
    university: 'University of Waterloo',
    major: 'B.Math. Computational Statistics',
    graduationYear: 2027,
    gpa: 3.74,
    preferredTrack: 'Machine Learning & Data',
    availability: 'Full-time (16 wks)',
    projectsSummary:
      'Implemented gradient-boosted demand forecasting models in Python and SQL, plus exploratory PyTorch sequence classifiers.',
    skills: [
      { name: 'Python', level: 4 },
      { name: 'SQL', level: 5 },
      { name: 'Statistical Modeling', level: 4 },
      { name: 'PyTorch', level: 3 },
      { name: 'Docker', level: 2 },
    ],
  },
];

export const INITIAL_ALLOCATION_RESULT: AllocationResponse = {
  summary: {
    averageCapabilityPercent: 89,
    placementRatePercent: 100,
    totalSeatsFilled: 8,
    totalSeatsAvailable: 9,
    executiveInsight:
      'All 8 cohort candidates are matched to roles aligned with their strongest technical competencies, achieving an 89% mean capability score with 1 remaining seat in Applied ML & Data or Distributed Backend.',
    evaluatedBy: 'baseline-cohort',
    evaluatedAt: 'Initial Cohort Baseline',
  },
  allocations: [
    {
      studentId: 'stu-ananya',
      assignedInternshipId: 'int-frontend-sys',
      status: 'Allocated',
      assignedCapabilityPercent: 96,
      rankedMatches: [
        {
          internshipId: 'int-frontend-sys',
          capabilityPercent: 96,
          coreSkillMatchPercent: 98,
          projectRelevancePercent: 95,
          readinessPercent: 95,
          matchedSkills: [
            { skill: 'TypeScript', studentLevel: 5, requiredLevel: 4, contributionPercent: 30, note: 'Exceeds target depth' },
            { skill: 'React', studentLevel: 5, requiredLevel: 4, contributionPercent: 30, note: 'Production telemetry UI proven' },
            { skill: 'Tailwind CSS', studentLevel: 4, requiredLevel: 3, contributionPercent: 16, note: 'Strong styling systems mastery' },
            { skill: 'REST / GraphQL APIs', studentLevel: 4, requiredLevel: 3, contributionPercent: 12, note: 'Subscriptions experience' },
            { skill: 'Web Accessibility', studentLevel: 4, requiredLevel: 3, contributionPercent: 8, note: 'Verified WCAG audits' },
          ],
          missingSkills: [],
          aiRationale:
            'Ananya exceeds all core and important skill thresholds for Frontend Systems Intern, reinforced directly by her accessible GraphQL telemetry workbench project.',
        },
        {
          internshipId: 'int-product-design',
          capabilityPercent: 78,
          coreSkillMatchPercent: 72,
          projectRelevancePercent: 82,
          readinessPercent: 84,
          matchedSkills: [
            { skill: 'React', studentLevel: 5, requiredLevel: 3, contributionPercent: 32, note: 'Exceeds target level' },
            { skill: 'HTML / CSS', studentLevel: 4, requiredLevel: 4, contributionPercent: 28, note: 'Meets requirement via Tailwind' },
          ],
          missingSkills: [
            { skill: 'Figma', requiredLevel: 4, studentLevel: 1, severity: 'High', upskillingTip: 'Build a tokenized component library in Figma.' },
            { skill: 'Design Systems', requiredLevel: 4, studentLevel: 2, severity: 'Moderate', upskillingTip: 'Document component governance and spacing tokens.' },
          ],
          aiRationale:
            'Strong frontend implementation foundation, though dedicated Figma system architecture and formal user research experience are below the role target.',
        },
      ],
    },
    {
      studentId: 'stu-kenji',
      assignedInternshipId: 'int-cloud-infra',
      status: 'Allocated',
      assignedCapabilityPercent: 94,
      rankedMatches: [
        {
          internshipId: 'int-cloud-infra',
          capabilityPercent: 94,
          coreSkillMatchPercent: 95,
          projectRelevancePercent: 94,
          readinessPercent: 92,
          matchedSkills: [
            { skill: 'Go', studentLevel: 4, requiredLevel: 3, contributionPercent: 26, note: 'Built K8s autoscaler in Go' },
            { skill: 'Kubernetes', studentLevel: 4, requiredLevel: 3, contributionPercent: 26, note: 'Cluster scheduling experience' },
            { skill: 'Linux Systems', studentLevel: 5, requiredLevel: 4, contributionPercent: 20, note: 'Deep kernel & process fluency' },
            { skill: 'Terraform', studentLevel: 4, requiredLevel: 3, contributionPercent: 14, note: 'Multi-env modules' },
            { skill: 'CI/CD Pipelines', studentLevel: 4, requiredLevel: 3, contributionPercent: 8, note: 'Automated workflows' },
          ],
          missingSkills: [],
          aiRationale:
            'Kenji aligns with every infrastructure requirement at or above target proficiency, backed by hands-on Kubernetes scheduling and Terraform automation.',
        },
        {
          internshipId: 'int-backend-api',
          capabilityPercent: 71,
          coreSkillMatchPercent: 64,
          projectRelevancePercent: 74,
          readinessPercent: 79,
          matchedSkills: [
            { skill: 'PostgreSQL', studentLevel: 3, requiredLevel: 4, contributionPercent: 24, note: 'Solid relational fundamentals' },
          ],
          missingSkills: [
            { skill: 'Node.js', requiredLevel: 4, studentLevel: 1, severity: 'High', upskillingTip: 'Complete an async Node.js service with Express or Fastify.' },
          ],
          aiRationale:
            'Strong systems intuition transfers well to backend services, but primary runtime experience is in Go rather than Node.js and TypeScript.',
        },
      ],
    },
    {
      studentId: 'stu-amara',
      assignedInternshipId: 'int-ml-pipelines',
      status: 'Allocated',
      assignedCapabilityPercent: 97,
      rankedMatches: [
        {
          internshipId: 'int-ml-pipelines',
          capabilityPercent: 97,
          coreSkillMatchPercent: 98,
          projectRelevancePercent: 97,
          readinessPercent: 96,
          matchedSkills: [
            { skill: 'Python', studentLevel: 5, requiredLevel: 4, contributionPercent: 28, note: 'Research-grade engineering' },
            { skill: 'PyTorch', studentLevel: 5, requiredLevel: 4, contributionPercent: 28, note: 'Published calibration pipelines' },
            { skill: 'SQL', studentLevel: 4, requiredLevel: 3, contributionPercent: 18, note: 'Feature store optimization' },
            { skill: 'Statistical Modeling', studentLevel: 5, requiredLevel: 3, contributionPercent: 15, note: 'Graduate-level depth' },
            { skill: 'Docker', studentLevel: 3, requiredLevel: 2, contributionPercent: 8, note: 'Containerized inference' },
          ],
          missingSkills: [],
          aiRationale:
            'Amara is a near-exact match for Applied ML & Data Intern, combining M.Eng. statistical calibration research with production PyTorch and SQL pipelines.',
        },
        {
          internshipId: 'int-security-eng',
          capabilityPercent: 61,
          coreSkillMatchPercent: 52,
          projectRelevancePercent: 58,
          readinessPercent: 78,
          matchedSkills: [
            { skill: 'Python', studentLevel: 5, requiredLevel: 3, contributionPercent: 32, note: 'Strong scripting & tooling' },
          ],
          missingSkills: [
            { skill: 'AppSec Auditing', requiredLevel: 4, studentLevel: 1, severity: 'High', upskillingTip: 'Practice OWASP Top 10 threat modeling and SAST workflows.' },
          ],
          aiRationale:
            'High Python fluency and academic rigor, though lacking dedicated application security auditing and IAM protocol background.',
        },
      ],
    },
    {
      studentId: 'stu-mateo',
      assignedInternshipId: 'int-product-design',
      status: 'Allocated',
      assignedCapabilityPercent: 93,
      rankedMatches: [
        {
          internshipId: 'int-product-design',
          capabilityPercent: 93,
          coreSkillMatchPercent: 95,
          projectRelevancePercent: 94,
          readinessPercent: 90,
          matchedSkills: [
            { skill: 'Figma', studentLevel: 5, requiredLevel: 4, contributionPercent: 28, note: 'Multi-brand token architecture' },
            { skill: 'Design Systems', studentLevel: 5, requiredLevel: 4, contributionPercent: 28, note: '45-component system owner' },
            { skill: 'HTML / CSS', studentLevel: 4, requiredLevel: 4, contributionPercent: 16, note: 'Token-to-CSS pipeline' },
            { skill: 'React', studentLevel: 4, requiredLevel: 3, contributionPercent: 13, note: 'Production prototypes' },
            { skill: 'User Research', studentLevel: 4, requiredLevel: 3, contributionPercent: 8, note: '18 usability sessions led' },
          ],
          missingSkills: [],
          aiRationale:
            'Mateo directly bridges design systems and React implementation, matching every core requirement for Product Design Engineering Intern.',
        },
        {
          internshipId: 'int-frontend-sys',
          capabilityPercent: 79,
          coreSkillMatchPercent: 75,
          projectRelevancePercent: 80,
          readinessPercent: 83,
          matchedSkills: [
            { skill: 'React', studentLevel: 4, requiredLevel: 4, contributionPercent: 30, note: 'Solid component engineering' },
            { skill: 'TypeScript', studentLevel: 3, requiredLevel: 4, contributionPercent: 22, note: 'Developing advanced typing' },
          ],
          missingSkills: [
            { skill: 'REST / GraphQL APIs', requiredLevel: 3, studentLevel: 1, severity: 'Moderate', upskillingTip: 'Build data-fetching hooks with caching and error recovery.' },
          ],
          aiRationale:
            'Strong UI component craftsmanship, with minor gaps in complex GraphQL data-layer integration and advanced TypeScript generics.',
        },
      ],
    },
    {
      studentId: 'stu-claire',
      assignedInternshipId: 'int-backend-api',
      status: 'Allocated',
      assignedCapabilityPercent: 92,
      rankedMatches: [
        {
          internshipId: 'int-backend-api',
          capabilityPercent: 92,
          coreSkillMatchPercent: 94,
          projectRelevancePercent: 92,
          readinessPercent: 90,
          matchedSkills: [
            { skill: 'Node.js', studentLevel: 5, requiredLevel: 4, contributionPercent: 28, note: 'High-throughput event services' },
            { skill: 'PostgreSQL', studentLevel: 4, requiredLevel: 4, contributionPercent: 26, note: 'Transactional ledger design' },
            { skill: 'TypeScript', studentLevel: 4, requiredLevel: 3, contributionPercent: 16, note: 'Strict service contracts' },
            { skill: 'Redis / Caching', studentLevel: 4, requiredLevel: 3, contributionPercent: 14, note: 'Queue & cache patterns' },
            { skill: 'System Design', studentLevel: 4, requiredLevel: 3, contributionPercent: 8, note: 'Idempotent reconciliation' },
          ],
          missingSkills: [],
          aiRationale:
            'Claire’s settlement queue project directly mirrors LedgerFlow’s distributed reconciliation stack, giving her 92% immediate capability.',
        },
        {
          internshipId: 'int-cloud-infra',
          capabilityPercent: 68,
          coreSkillMatchPercent: 58,
          projectRelevancePercent: 72,
          readinessPercent: 78,
          matchedSkills: [
            { skill: 'Docker', studentLevel: 3, requiredLevel: 2, contributionPercent: 18, note: 'Containerized Node workloads' },
          ],
          missingSkills: [
            { skill: 'Go', requiredLevel: 3, studentLevel: 1, severity: 'High', upskillingTip: 'Build a CLI or metrics exporter in Go.' },
            { skill: 'Kubernetes', requiredLevel: 3, studentLevel: 1, severity: 'High', upskillingTip: 'Deploy stateful workloads to a local K8s cluster.' },
          ],
          aiRationale:
            'Solid backend architecture skills, but Cloud Infrastructure requires Go and Kubernetes proficiency not yet demonstrated.',
        },
      ],
    },
    {
      studentId: 'stu-devon',
      assignedInternshipId: 'int-security-eng',
      status: 'Allocated',
      assignedCapabilityPercent: 91,
      rankedMatches: [
        {
          internshipId: 'int-security-eng',
          capabilityPercent: 91,
          coreSkillMatchPercent: 92,
          projectRelevancePercent: 92,
          readinessPercent: 89,
          matchedSkills: [
            { skill: 'AppSec Auditing', studentLevel: 4, requiredLevel: 4, contributionPercent: 28, note: 'SAST rule author' },
            { skill: 'Python', studentLevel: 4, requiredLevel: 3, contributionPercent: 24, note: 'Security automation' },
            { skill: 'OAuth / IAM', studentLevel: 4, requiredLevel: 3, contributionPercent: 18, note: 'OAuth 2.1 scope analyzer' },
            { skill: 'Linux Systems', studentLevel: 4, requiredLevel: 3, contributionPercent: 13, note: 'Cyber defense hardening' },
            { skill: 'Network Protocols', studentLevel: 4, requiredLevel: 3, contributionPercent: 8, note: 'Packet & protocol triage' },
          ],
          missingSkills: [],
          aiRationale:
            'Devon meets every technical and domain criterion for Application Security Intern, supported directly by his OAuth 2.1 scope analyzer and SAST tooling.',
        },
        {
          internshipId: 'int-cloud-infra',
          capabilityPercent: 66,
          coreSkillMatchPercent: 58,
          projectRelevancePercent: 64,
          readinessPercent: 78,
          matchedSkills: [
            { skill: 'Linux Systems', studentLevel: 4, requiredLevel: 4, contributionPercent: 28, note: 'Strong OS hardening' },
            { skill: 'Go', studentLevel: 2, requiredLevel: 3, contributionPercent: 14, note: 'Foundational Go syntax' },
          ],
          missingSkills: [
            { skill: 'Kubernetes', requiredLevel: 3, studentLevel: 1, severity: 'High', upskillingTip: 'Practice K8s RBAC and pod security policies.' },
          ],
          aiRationale:
            'Linux fundamentals transfer well, though deeper Go engineering and Kubernetes orchestration are needed for primary infra ownership.',
        },
      ],
    },
    {
      studentId: 'stu-priya',
      assignedInternshipId: 'int-frontend-sys',
      status: 'Allocated',
      assignedCapabilityPercent: 81,
      rankedMatches: [
        {
          internshipId: 'int-frontend-sys',
          capabilityPercent: 81,
          coreSkillMatchPercent: 84,
          projectRelevancePercent: 80,
          readinessPercent: 79,
          matchedSkills: [
            { skill: 'TypeScript', studentLevel: 4, requiredLevel: 4, contributionPercent: 26, note: 'Meets core standard' },
            { skill: 'React', studentLevel: 4, requiredLevel: 4, contributionPercent: 26, note: 'Collaborative planner UI' },
            { skill: 'Tailwind CSS', studentLevel: 3, requiredLevel: 3, contributionPercent: 15, note: 'Solid utility styling' },
            { skill: 'REST / GraphQL APIs', studentLevel: 3, requiredLevel: 3, contributionPercent: 14, note: 'CRUD & auth flows' },
          ],
          missingSkills: [
            { skill: 'Web Accessibility', requiredLevel: 3, studentLevel: 1, severity: 'Minor', upskillingTip: 'Run axe-core audits and add keyboard focus trapping.' },
          ],
          aiRationale:
            'Priya meets the core React and TypeScript bar for the second Frontend Systems seat, with minor ramp-up needed on formal WCAG accessibility.',
        },
        {
          internshipId: 'int-backend-api',
          capabilityPercent: 77,
          coreSkillMatchPercent: 76,
          projectRelevancePercent: 78,
          readinessPercent: 78,
          matchedSkills: [
            { skill: 'Node.js', studentLevel: 4, requiredLevel: 4, contributionPercent: 26, note: 'API route design' },
            { skill: 'PostgreSQL', studentLevel: 3, requiredLevel: 4, contributionPercent: 20, note: 'Schema modeling' },
            { skill: 'TypeScript', studentLevel: 4, requiredLevel: 3, contributionPercent: 16, note: 'Strong typed backend' },
          ],
          missingSkills: [
            { skill: 'Redis / Caching', requiredLevel: 3, studentLevel: 1, severity: 'Moderate', upskillingTip: 'Implement distributed rate limiting or caching with Redis.' },
          ],
          aiRationale:
            'Well-rounded full-stack profile; competitive backup for Distributed Backend once Redis caching patterns are added.',
        },
      ],
    },
    {
      studentId: 'stu-lucas',
      assignedInternshipId: 'int-ml-pipelines',
      status: 'Allocated',
      assignedCapabilityPercent: 82,
      rankedMatches: [
        {
          internshipId: 'int-ml-pipelines',
          capabilityPercent: 82,
          coreSkillMatchPercent: 80,
          projectRelevancePercent: 83,
          readinessPercent: 84,
          matchedSkills: [
            { skill: 'Python', studentLevel: 4, requiredLevel: 4, contributionPercent: 24, note: 'Strong modeling scripts' },
            { skill: 'SQL', studentLevel: 5, requiredLevel: 3, contributionPercent: 22, note: 'Advanced analytical SQL' },
            { skill: 'Statistical Modeling', studentLevel: 4, requiredLevel: 3, contributionPercent: 18, note: 'Computational math major' },
            { skill: 'PyTorch', studentLevel: 3, requiredLevel: 4, contributionPercent: 12, note: 'Working neural net knowledge' },
            { skill: 'Docker', studentLevel: 2, requiredLevel: 2, contributionPercent: 6, note: 'Basic container usage' },
          ],
          missingSkills: [
            { skill: 'PyTorch', requiredLevel: 4, studentLevel: 3, severity: 'Moderate', upskillingTip: 'Build custom DataLoader & distributed training loops in PyTorch.' },
          ],
          aiRationale:
            'Lucas brings standout SQL and statistical modeling rigor to the second Applied ML & Data seat, needing light mentorship on advanced PyTorch internals.',
        },
        {
          internshipId: 'int-backend-api',
          capabilityPercent: 63,
          coreSkillMatchPercent: 54,
          projectRelevancePercent: 60,
          readinessPercent: 78,
          matchedSkills: [
            { skill: 'PostgreSQL', studentLevel: 4, requiredLevel: 4, contributionPercent: 28, note: 'Transferable from SQL mastery' },
          ],
          missingSkills: [
            { skill: 'Node.js', requiredLevel: 4, studentLevel: 1, severity: 'High', upskillingTip: 'Learn TypeScript and Node.js backend service patterns.' },
          ],
          aiRationale:
            'Analytical SQL translates nicely, but missing Node.js and TypeScript runtime experience limits backend readiness.',
        },
      ],
    },
  ],
};
