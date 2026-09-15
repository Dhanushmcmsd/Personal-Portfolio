export const personalInfo = {
  name: "Dhanush Raghav M",
  title: "Full-Stack AI Software Engineer",
  location: "Kerala, India",
  email: "mc.dhanush.msd@gmail.com",
  phone: "+91 98941 25266",
  github: "https://github.com/Dhanushmcmsd",
  tagline: "Driven by detail. Obsessed with seamless motion.",
  summary:
    "Full-stack engineer who has shipped complete web and mobile products end-to-end — frontend, backend, database, and deployment — for real business users. Built a supermarket compliance platform currently used in the field, plus backend-heavy projects spanning classification APIs and financial data pipelines.",
};

export const skills = [
  {
    category: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "SQL", "Java", "C++"],
  },
  {
    category: "Frontend & Mobile",
    items: ["React", "Next.js", "Vite", "React Native", "Expo", "Tailwind CSS", "Recharts"],
  },
  {
    category: "Backend",
    items: ["FastAPI", "Node.js", "REST APIs", "Supabase Edge Functions"],
  },
  {
    category: "Databases & Data",
    items: ["PostgreSQL", "Supabase", "Prisma", "PostGIS", "Redis", "FAISS"],
  },
  {
    category: "DevOps & Cloud",
    items: ["Vercel", "Render", "Railway", "Docker", "GitHub Actions", "Expo EAS"],
  },
  {
    category: "Security & Testing",
    items: ["JWT", "NextAuth", "RBAC", "Row-Level Security", "Vitest", "pytest"],
  },
];

export const experience = [
  {
    role: "Full-Stack & AI Engineer",
    company: "Supra Pacific",
    period: "Mar 2026 — Aug 2026",
    location: "Kerala, India",
    highlights: [
      "Built the Vigilance Management System — a supermarket compliance platform with React/Vite web portal, React Native mobile app, and Supabase/PostgreSQL backend.",
      "Implemented role-based access with Supabase Row-Level Security for field officers, auditors, management, and admins.",
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
    highlights: [
      "Managed and processed data entry workflows with attention to accuracy and consistency.",
    ],
  },
];

export const projects = [
  {
    id: "vigilance",
    number: "01",
    title: "VIGILANCE",
    subtitle: "Management System",
    tag: "Full-Stack",
    description:
      "Supermarket compliance and inspection platform with web portal, mobile app, and real-time geofencing. Used in production by field officers and auditors.",
    tech: ["React", "TypeScript", "React Native", "Supabase", "PostGIS"],
    engine: "React + Supabase",
    color: "#00f0ff",
    gradient: "from-cyan-500/20 to-blue-600/20",
  },
  {
    id: "hsn-gst",
    number: "02",
    title: "HSN/GST",
    subtitle: "Classification AI",
    tag: "AI / ML",
    description:
      "Hybrid retrieval platform returning 8-digit HSN codes, GST rates, and confidence scores. Indexed 14,708 CBIC-aligned tariff codes with FAISS semantic search.",
    tech: ["Python", "FastAPI", "FAISS", "Redis", "Next.js"],
    engine: "FastAPI + FAISS",
    color: "#ff6b9d",
    gradient: "from-pink-500/20 to-purple-600/20",
  },
  {
    id: "finance",
    number: "03",
    title: "FINANCIAL",
    subtitle: "Analytics Dashboard",
    tag: "Data Viz",
    description:
      "Dashboard converting uploaded Excel/HTML files into gold-loan and microfinance KPIs with branch comparison and overdue/NPA analysis.",
    tech: ["Next.js", "Prisma", "PostgreSQL", "Recharts", "NextAuth"],
    engine: "Next.js + Prisma",
    color: "#ffd700",
    gradient: "from-yellow-500/20 to-orange-600/20",
  },
];

export const education = [
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
];

export const languages = ["English", "Tamil", "Kannada", "Hindi", "Malayalam"];
