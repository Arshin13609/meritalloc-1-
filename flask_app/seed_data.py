"""Starter internships, sample student cohort, and baseline evaluations for MeritAlloc (Flask)."""

INITIAL_INTERNSHIPS = [
    {
        "id": "int-frontend-sys",
        "title": "Frontend Systems Intern",
        "company": "Vektor Cloud",
        "department": "Product Engineering",
        "location": "San Francisco · Hybrid",
        "duration": "12 Weeks",
        "stipend": "$44/hr",
        "seats": 2,
        "minGpa": 3.3,
        "isOpen": True,
        "isStarterRole": True,
        "description": (
            "Build high-density telemetry dashboards, accessible design system primitives, "
            "and real-time state visualizations using React and TypeScript."
        ),
        "requiredSkills": [
            {"name": "TypeScript", "minLevel": 4, "weight": "Core"},
            {"name": "React", "minLevel": 4, "weight": "Core"},
            {"name": "Tailwind CSS", "minLevel": 3, "weight": "Important"},
            {"name": "REST / GraphQL APIs", "minLevel": 3, "weight": "Important"},
            {"name": "Web Accessibility", "minLevel": 3, "weight": "Preferred"},
        ],
    },
    {
        "id": "int-ml-pipelines",
        "title": "Applied ML & Data Intern",
        "company": "Northstar BioLabs",
        "department": "Computational AI",
        "location": "Boston · On-site",
        "duration": "16 Weeks",
        "stipend": "$48/hr",
        "seats": 2,
        "minGpa": 3.5,
        "isOpen": True,
        "isStarterRole": True,
        "description": (
            "Train and evaluate tabular and NLP scoring pipelines in PyTorch, optimize SQL "
            "feature stores, and benchmark model calibration."
        ),
        "requiredSkills": [
            {"name": "Python", "minLevel": 4, "weight": "Core"},
            {"name": "PyTorch", "minLevel": 4, "weight": "Core"},
            {"name": "SQL", "minLevel": 3, "weight": "Important"},
            {"name": "Statistical Modeling", "minLevel": 3, "weight": "Important"},
            {"name": "Docker", "minLevel": 2, "weight": "Preferred"},
        ],
    },
    {
        "id": "int-cloud-infra",
        "title": "Cloud Infrastructure Intern",
        "company": "Strata Mesh",
        "department": "Platform Reliability",
        "location": "Seattle · Hybrid",
        "duration": "12 Weeks",
        "stipend": "$46/hr",
        "seats": 1,
        "minGpa": 3.4,
        "isOpen": True,
        "isStarterRole": True,
        "description": (
            "Automate Kubernetes workload scheduling, write Go observability agents, and "
            "harden Terraform multi-region deployments."
        ),
        "requiredSkills": [
            {"name": "Go", "minLevel": 3, "weight": "Core"},
            {"name": "Kubernetes", "minLevel": 3, "weight": "Core"},
            {"name": "Linux Systems", "minLevel": 4, "weight": "Important"},
            {"name": "Terraform", "minLevel": 3, "weight": "Important"},
            {"name": "CI/CD Pipelines", "minLevel": 3, "weight": "Preferred"},
        ],
    },
    {
        "id": "int-product-design",
        "title": "Product Design Engineering Intern",
        "company": "Atelier Financial",
        "department": "Design Systems",
        "location": "New York · Hybrid",
        "duration": "12 Weeks",
        "stipend": "$40/hr",
        "seats": 1,
        "minGpa": 3.2,
        "isOpen": True,
        "isStarterRole": True,
        "description": (
            "Bridge Figma component libraries and production React prototypes, run usability "
            "audits, and maintain typography and spacing tokens."
        ),
        "requiredSkills": [
            {"name": "Figma", "minLevel": 4, "weight": "Core"},
            {"name": "Design Systems", "minLevel": 4, "weight": "Core"},
            {"name": "HTML / CSS", "minLevel": 4, "weight": "Important"},
            {"name": "React", "minLevel": 3, "weight": "Important"},
            {"name": "User Research", "minLevel": 3, "weight": "Preferred"},
        ],
    },
    {
        "id": "int-backend-api",
        "title": "Distributed Backend Intern",
        "company": "LedgerFlow",
        "department": "Core Payments",
        "location": "Austin · Remote",
        "duration": "12 Weeks",
        "stipend": "$45/hr",
        "seats": 2,
        "minGpa": 3.4,
        "isOpen": True,
        "isStarterRole": True,
        "description": (
            "Design idempotent Node.js/TypeScript and PostgreSQL microservices handling "
            "high-throughput financial ledger reconciliation."
        ),
        "requiredSkills": [
            {"name": "Node.js", "minLevel": 4, "weight": "Core"},
            {"name": "PostgreSQL", "minLevel": 4, "weight": "Core"},
            {"name": "TypeScript", "minLevel": 3, "weight": "Important"},
            {"name": "Redis / Caching", "minLevel": 3, "weight": "Important"},
            {"name": "System Design", "minLevel": 3, "weight": "Preferred"},
        ],
    },
    {
        "id": "int-security-eng",
        "title": "Application Security Intern",
        "company": "Bastion Defense",
        "department": "Trust & Security",
        "location": "Washington DC · On-site",
        "duration": "12 Weeks",
        "stipend": "$47/hr",
        "seats": 1,
        "minGpa": 3.5,
        "isOpen": True,
        "isStarterRole": True,
        "description": (
            "Conduct automated SAST/DAST triage, audit OAuth 2.1 and RBAC boundaries, and "
            "author Python threat-detection analyzers."
        ),
        "requiredSkills": [
            {"name": "AppSec Auditing", "minLevel": 4, "weight": "Core"},
            {"name": "Python", "minLevel": 3, "weight": "Core"},
            {"name": "OAuth / IAM", "minLevel": 3, "weight": "Important"},
            {"name": "Linux Systems", "minLevel": 3, "weight": "Important"},
            {"name": "Network Protocols", "minLevel": 3, "weight": "Preferred"},
        ],
    },
]

INITIAL_STUDENTS = [
    {
        "id": "stu-ananya",
        "name": "Ananya Deshmukh",
        "university": "Stanford University",
        "major": "B.S. Computer Science",
        "graduationYear": 2027,
        "gpa": 3.91,
        "preferredTrack": "Frontend & UI Systems",
        "availability": "Full-time (12 wks)",
        "projectsSummary": (
            "Built an accessible real-time lab telemetry workbench in React, TypeScript, and "
            "Tailwind CSS with 99/100 Lighthouse accessibility scores and GraphQL subscriptions."
        ),
        "skills": [
            {"name": "TypeScript", "level": 5},
            {"name": "React", "level": 5},
            {"name": "Tailwind CSS", "level": 4},
            {"name": "REST / GraphQL APIs", "level": 4},
            {"name": "Web Accessibility", "level": 4},
            {"name": "Node.js", "level": 3},
        ],
    },
    {
        "id": "stu-kenji",
        "name": "Kenji Takahashi",
        "university": "UC Berkeley",
        "major": "B.S. Electrical Engineering & CS",
        "graduationYear": 2027,
        "gpa": 3.84,
        "preferredTrack": "Cloud Infrastructure & Backend",
        "availability": "Full-time (12 wks)",
        "projectsSummary": (
            "Authored a Go-based Kubernetes pod autoscaler for university compute clusters and "
            "automated multi-env Terraform modules with GitHub Actions."
        ),
        "skills": [
            {"name": "Go", "level": 4},
            {"name": "Kubernetes", "level": 4},
            {"name": "Linux Systems", "level": 5},
            {"name": "Terraform", "level": 4},
            {"name": "CI/CD Pipelines", "level": 4},
            {"name": "PostgreSQL", "level": 3},
        ],
    },
    {
        "id": "stu-amara",
        "name": "Amara Okafor",
        "university": "MIT",
        "major": "M.Eng. Data Science & AI",
        "graduationYear": 2027,
        "gpa": 3.95,
        "preferredTrack": "Machine Learning & Data",
        "availability": "Full-time (16 wks)",
        "projectsSummary": (
            "Published clinical NLP calibration benchmarks in PyTorch with DuckDB/SQL feature "
            "pipelines and containerized inference services."
        ),
        "skills": [
            {"name": "Python", "level": 5},
            {"name": "PyTorch", "level": 5},
            {"name": "SQL", "level": 4},
            {"name": "Statistical Modeling", "level": 5},
            {"name": "Docker", "level": 3},
            {"name": "PostgreSQL", "level": 3},
        ],
    },
    {
        "id": "stu-mateo",
        "name": "Mateo Alvarez",
        "university": "Carnegie Mellon University",
        "major": "B.Des. & Human-Computer Interaction",
        "graduationYear": 2027,
        "gpa": 3.76,
        "preferredTrack": "Design Engineering",
        "availability": "Full-time (12 wks)",
        "projectsSummary": (
            "Maintained a 45-component multi-brand Figma token system synced via Style Dictionary "
            "into production React and CSS primitives; led 18 usability sessions."
        ),
        "skills": [
            {"name": "Figma", "level": 5},
            {"name": "Design Systems", "level": 5},
            {"name": "HTML / CSS", "level": 4},
            {"name": "React", "level": 4},
            {"name": "User Research", "level": 4},
            {"name": "TypeScript", "level": 3},
        ],
    },
    {
        "id": "stu-claire",
        "name": "Claire Lindqvist",
        "university": "Georgia Tech",
        "major": "B.S. Computer Science",
        "graduationYear": 2027,
        "gpa": 3.79,
        "preferredTrack": "Backend & Distributed Systems",
        "availability": "Full-time (12 wks)",
        "projectsSummary": (
            "Engineered an idempotent event-driven settlement queue in Node.js, TypeScript, "
            "PostgreSQL, and Redis capable of 4,200 tx/sec in load tests."
        ),
        "skills": [
            {"name": "Node.js", "level": 5},
            {"name": "PostgreSQL", "level": 4},
            {"name": "TypeScript", "level": 4},
            {"name": "Redis / Caching", "level": 4},
            {"name": "System Design", "level": 4},
            {"name": "Docker", "level": 3},
        ],
    },
    {
        "id": "stu-devon",
        "name": "Devon Mercer",
        "university": "University of Michigan",
        "major": "B.S. Cybersecurity & Informatics",
        "graduationYear": 2027,
        "gpa": 3.82,
        "preferredTrack": "Security Engineering",
        "availability": "Full-time (12 wks)",
        "projectsSummary": (
            "Built an automated OAuth 2.1 scope analyzer and SAST rule pack in Python; placed "
            "top 5 in national collegiate cyber defense finals."
        ),
        "skills": [
            {"name": "AppSec Auditing", "level": 4},
            {"name": "Python", "level": 4},
            {"name": "OAuth / IAM", "level": 4},
            {"name": "Linux Systems", "level": 4},
            {"name": "Network Protocols", "level": 4},
            {"name": "Go", "level": 2},
        ],
    },
    {
        "id": "stu-priya",
        "name": "Priya Subramanian",
        "university": "UT Austin",
        "major": "B.S. Computer Science",
        "graduationYear": 2028,
        "gpa": 3.68,
        "preferredTrack": "Full-Stack & Backend",
        "availability": "Full-time (12 wks)",
        "projectsSummary": (
            "Developed a collaborative campus course planner using React, TypeScript, Node.js, "
            "and PostgreSQL with role-based permissions."
        ),
        "skills": [
            {"name": "React", "level": 4},
            {"name": "TypeScript", "level": 4},
            {"name": "Node.js", "level": 4},
            {"name": "PostgreSQL", "level": 3},
            {"name": "Tailwind CSS", "level": 3},
            {"name": "REST / GraphQL APIs", "level": 3},
        ],
    },
    {
        "id": "stu-lucas",
        "name": "Lucas Moreau",
        "university": "University of Waterloo",
        "major": "B.Math. Computational Statistics",
        "graduationYear": 2027,
        "gpa": 3.74,
        "preferredTrack": "Machine Learning & Data",
        "availability": "Full-time (16 wks)",
        "projectsSummary": (
            "Implemented gradient-boosted demand forecasting models in Python and SQL, plus "
            "exploratory PyTorch sequence classifiers."
        ),
        "skills": [
            {"name": "Python", "level": 4},
            {"name": "SQL", "level": 5},
            {"name": "Statistical Modeling", "level": 4},
            {"name": "PyTorch", "level": 3},
            {"name": "Docker", "level": 2},
        ],
    },
]
