export const PORTFOLIO_CONFIG = {
  person: {
    name: "Dhanush Raghav M",
    displayName: "Dhanush Raghav M",
    role: "Full-Stack AI Engineer",
    shortRole: "Full-Stack AI Engineer",
    location: "Kerala, India",
    availability: "Available for selected freelance / full-time opportunities",
    email: "mc.dhanush.msd@gmail.com",
    phone: "+91 98941 25266",
    github: "https://github.com/Dhanushmcmsd",
    linkedin: "https://www.linkedin.com/in/dhanushraghav",
    photo: "/profile/dhanush.png",
  },

  hero: {
    eyebrow: "FULL-STACK AI ENGINEER",
    title: "I BUILD SYSTEMS THAT MOVE.",
    subtitle:
      "Full-stack products, AI systems, data platforms and interfaces designed to work in the real world.",
    scrollLabel: "SCROLL TO EXPLORE",
  },

  visual: {
    background: "#06080B",
    foreground: "#F4F1EA",
    accent: "#FF4500",
    accentSecondary: "#1A0033",
    panel: "#1A0033",
    grid: "#FF4500",
    glow: true,
  },

  interaction: {
    enableFinalVirusFruitInteraction: true,
    finalOnly: true,
    finalSceneStart: 0.9,
  },

  content: {
    aboutTitle: "WHO I AM",
    aboutLead: "I BUILD PRODUCTS FROM THE SYSTEM LEVEL UP — FROM INTERFACE TO BACKEND, DATA, DEPLOYMENT AND THE DETAILS IN BETWEEN.",
    aboutText:
      "Full-stack engineer who has shipped complete web and mobile products end-to-end — frontend, backend, database, and deployment — for real business users. Built a supermarket compliance platform currently used in the field, plus backend-heavy projects spanning classification APIs and financial data pipelines. Studying data science and machine learning alongside hands-on software work.",
    contactHeading: "LET'S BUILD SOMETHING",
    contactText:
      "Open to collaborations on full-stack products, AI systems, and data platforms. Reach out to discuss your next build.",
  },

  projects: [
    {
      id: "vigilance",
      index: "01",
      category: "FULL-STACK / PRODUCTION",
      title: "VIGILANCE",
      subtitle: "Management System",
      description:
        "Supermarket compliance and inspection platform with a web portal, mobile application, role-based access, geofencing, offline workflows, reporting and real-time operational visibility.",
      technologies: [
        "React",
        "TypeScript",
        "React Native",
        "Expo",
        "Supabase",
        "PostgreSQL",
        "PostGIS",
      ],
      image: "/projects/vigilance/hero.png",
      gallery: ["/projects/vigilance/hero.png"],
      github: "https://github.com/Dhanushmcmsd/Vigilance",
      live: "",
      color: "#00E5FF",
      metrics: ["Web + Mobile", "Offline workflows", "Geofencing", "RBAC / RLS"],
      timelineStart: 0.08,
      timelineEnd: 0.2,
    },
    {
      id: "hsn",
      index: "02",
      category: "AI / FULL-STACK",
      title: "HSN / GST",
      subtitle: "Classification Platform",
      description:
        "AI-assisted product classification system for 8-digit HSN and GST mapping with semantic retrieval, confidence scoring, bulk processing and human review workflows.",
      technologies: [
        "Python",
        "FastAPI",
        "Next.js",
        "PostgreSQL",
        "Redis",
        "FAISS",
        "Docker",
      ],
      image: "/projects/hsn/hero.png",
      gallery: ["/projects/hsn/hero.png"],
      github: "https://github.com/Dhanushmcmsd/hsn2-",
      live: "https://hsn2.vercel.app/",
      color: "#8B5CFF",
      metrics: [
        "8-digit classification",
        "Hybrid retrieval",
        "Confidence scoring",
        "Bulk Excel processing",
      ],
      timelineStart: 0.2,
      timelineEnd: 0.32,
    },
    {
      id: "finance",
      index: "03",
      category: "DATA / ANALYTICS",
      title: "FINANCIAL",
      subtitle: "Analytics Dashboard",
      description:
        "Data dashboard that transforms uploaded financial data into actionable branch KPIs, overdue analysis, NPA views and comparative performance insights.",
      technologies: [
        "Next.js",
        "TypeScript",
        "Prisma",
        "PostgreSQL",
        "NextAuth",
        "Recharts",
        "ExcelJS",
      ],
      image: "/projects/finance/hero.png",
      gallery: ["/projects/finance/hero.png"],
      github: "https://github.com/Dhanushmcmsd/Dashboard",
      live: "",
      color: "#FFD166",
      metrics: ["KPI dashboards", "Branch comparison", "NPA analysis", "Excel ingestion"],
      timelineStart: 0.32,
      timelineEnd: 0.44,
    },
    {
      id: "python",
      index: "04",
      category: "EDTECH / AUTOMATION",
      title: "PYTHON",
      subtitle: "Automation Roadmap",
      description:
        "Terminal-styled 12-week Python automation training platform with weekly missions, progress tracking, and an all-access curriculum path.",
      technologies: ["Python", "Next.js", "TypeScript", "Automation"],
      image: "/projects/python/hero.png",
      gallery: ["/projects/python/hero.png"],
      github: "https://github.com/Dhanushmcmsd",
      live: "",
      color: "#39FF14",
      metrics: ["12-week path", "Mission tracking", "Automation focus"],
      timelineStart: 0.44,
      timelineEnd: 0.56,
    },
  ],

  experience: [
    {
      role: "Full-Stack & AI Engineer",
      company: "Supra Pacific",
      period: "Mar 2026 — Aug 2026",
      location: "Kerala, India",
      highlights: [
        "Built the Vigilance Management System with React/Vite web portal, React Native mobile app, and Supabase/PostgreSQL backend.",
        "Implemented RBAC with Supabase Row-Level Security for field officers, auditors, management, and admins.",
        "Designed server-verified geofencing and offline inspection workflows with media evidence capture.",
        "Automated PDF/CSV reporting, KPI dashboards, and real-time notifications.",
        "Owned deployment end-to-end — GitHub, Supabase, Vercel, and Expo EAS.",
      ],
    },
    {
      role: "Data Entry Assistant",
      company: "CFCICI",
      period: "Sep 2025 — Feb 2026",
      location: "Kerala, India",
      highlights: ["Managed and processed data entry workflows with attention to accuracy."],
    },
    {
      role: "Freelance Video Editor",
      company: "Short Films & YouTube",
      period: "Prior experience",
      location: "Remote",
      highlights: ["Adobe Premiere Pro, After Effects, DaVinci Resolve."],
    },
  ],

  education: [
    {
      degree: "M.Sc. Data Science and Analytics",
      school: "Jain (Deemed-to-be University)",
      period: "2025 — 2027",
      gpa: "CGPA: 6.5",
    },
    {
      degree: "B.Sc. Artificial Intelligence and Machine Learning",
      school: "Sri Krishna Arts and Science College",
      period: "2022 — 2025",
      gpa: "CGPA: 7.0",
    },
  ],

  skills: {
    programming: ["TypeScript", "JavaScript", "Python", "SQL", "Java", "C++"],
    frontend: ["React", "Next.js", "Vite", "React Native", "Expo", "Tailwind CSS", "Recharts"],
    backend: ["FastAPI", "Node.js", "REST APIs", "Supabase Edge Functions"],
    data: ["PostgreSQL", "Supabase", "Prisma", "PostGIS", "Redis", "FAISS"],
    devops: ["Vercel", "Render", "Railway", "Docker", "GitHub Actions", "Expo EAS"],
    security: ["JWT", "NextAuth", "RBAC", "Row-Level Security", "Vitest", "pytest"],
    spoken: ["English", "Tamil", "Kannada", "Hindi", "Malayalam"],
  },
} as const;

export type ProjectConfig = (typeof PORTFOLIO_CONFIG.projects)[number];
