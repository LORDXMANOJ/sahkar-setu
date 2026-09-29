// Demo data. Every record here stands in for a table in the production
// database (see supabase/schema.sql). Names of people and employers are fictional.

export type Sector = "pacs" | "dairy" | "shg" | "fisheries" | "banking" | "leadership";

export type Institute = {
  id: string;
  name: string;
  short: string;
  city: string;
  state: string;
};

export type Programme = {
  slug: string;
  title: string;
  sector: Sector;
  instituteId: string;
  days: number;
  startsOn: string; // ISO date
  seats: number;
  enrolled: number;
  languages: ("en" | "hi" | "ta")[];
  skills: string[];
  summary: string;
  hostel: boolean;
};

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  body: string[];
  quiz: { q: string; options: string[]; answer: number; why: string }[];
};

export type Trainee = {
  id: string;
  name: string;
  district: string;
  state: string;
  society: string;
  role: string;
  joined: string;
  languages: ("en" | "hi" | "ta")[];
  skills: string[];
  attendancePct: number;
  quizTrend: number[]; // last scores, oldest first
  daysInactive: number;
};

export type Certificate = {
  id: string;
  traineeId: string;
  programmeSlug: string;
  issuedOn: string;
  grade: "Distinction" | "First class" | "Pass";
  score: number;
  attendancePct: number;
};

export type Job = {
  id: string;
  title: string;
  employer: string;
  district: string;
  state: string;
  kind: "Full time" | "Seasonal" | "Apprenticeship" | "Enterprise support";
  pay: string;
  skills: string[];
  postedOn: string;
  openings: number;
};

export const institutes: Institute[] = [
  { id: "vamnicom", name: "Vaikunth Mehta National Institute of Cooperative Management", short: "VAMNICOM", city: "Pune", state: "Maharashtra" },
  { id: "ricm-blr", name: "Regional Institute of Cooperative Management", short: "RICM Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { id: "ricm-gnr", name: "Regional Institute of Cooperative Management", short: "RICM Gandhinagar", city: "Gandhinagar", state: "Gujarat" },
  { id: "ricm-ptn", name: "Regional Institute of Cooperative Management", short: "RICM Patna", city: "Patna", state: "Bihar" },
  { id: "icm-mdu", name: "Institute of Cooperative Management", short: "ICM Madurai", city: "Madurai", state: "Tamil Nadu" },
  { id: "icm-bbsr", name: "Institute of Cooperative Management", short: "ICM Bhubaneswar", city: "Bhubaneswar", state: "Odisha" },
];

export const sectorLabel: Record<Sector, string> = {
  pacs: "PACS",
  dairy: "Dairy",
  shg: "Self-help groups",
  fisheries: "Fisheries",
  banking: "Cooperative banking",
  leadership: "Leadership",
};

export const programmes: Programme[] = [
  {
    slug: "pacs-computerisation",
    title: "Running a computerised PACS",
    sector: "pacs",
    instituteId: "vamnicom",
    days: 5,
    startsOn: "2026-10-12",
    seats: 40,
    enrolled: 36,
    languages: ["en", "hi"],
    skills: ["PACS ERP", "Loan ledger", "Audit readiness", "Member records"],
    summary: "Move a primary agricultural credit society onto the national PACS ERP: member records, crop loans, fertiliser stock and audit trails.",
    hostel: true,
  },
  {
    slug: "milk-quality",
    title: "Milk quality testing and collection centre operations",
    sector: "dairy",
    instituteId: "ricm-gnr",
    days: 4,
    startsOn: "2026-10-19",
    seats: 30,
    enrolled: 30,
    languages: ["en", "hi"],
    skills: ["Milk testing", "Fat/SNF analysis", "Cold chain", "Collection centre ops"],
    summary: "Fat and SNF testing, adulteration checks, bulk milk cooler upkeep and fair payment to members.",
    hostel: true,
  },
  {
    slug: "shg-bookkeeping",
    title: "SHG bookkeeping and digital payments",
    sector: "shg",
    instituteId: "icm-bbsr",
    days: 3,
    startsOn: "2026-11-02",
    seats: 50,
    enrolled: 22,
    languages: ["en", "hi"],
    skills: ["Bookkeeping", "UPI collections", "Bank linkage", "Tally basics"],
    summary: "Keep clean SHG books, collect dues over UPI and prepare the documents a bank asks for before credit linkage.",
    hostel: false,
  },
  {
    slug: "fisheries-coop",
    title: "Fisheries cooperative operations",
    sector: "fisheries",
    instituteId: "icm-mdu",
    days: 5,
    startsOn: "2026-11-09",
    seats: 35,
    enrolled: 14,
    languages: ["en", "ta"],
    skills: ["Catch records", "Cold storage", "Market linkage", "Scheme applications"],
    summary: "Catch records, ice-plant and cold storage management, and applying for PM Matsya Sampada support.",
    hostel: true,
  },
  {
    slug: "coop-banking-kyc",
    title: "KYC, compliance and customer service in cooperative banks",
    sector: "banking",
    instituteId: "ricm-blr",
    days: 3,
    startsOn: "2026-11-16",
    seats: 45,
    enrolled: 41,
    languages: ["en", "ta"],
    skills: ["KYC", "AML basics", "Customer service", "Core banking"],
    summary: "KYC norms, spotting suspicious transactions and serving members well at the counter.",
    hostel: false,
  },
  {
    slug: "youth-leadership",
    title: "Cooperative leadership for rural youth",
    sector: "leadership",
    instituteId: "ricm-ptn",
    days: 6,
    startsOn: "2026-11-23",
    seats: 60,
    enrolled: 18,
    languages: ["en", "hi"],
    skills: ["Governance", "Business planning", "Public speaking", "Cooperative law"],
    summary: "How cooperatives are governed, how to start one, and how to write a business plan a bank will fund.",
    hostel: true,
  },
];

export const lessons: Record<string, Lesson[]> = {
  "milk-quality": [
    {
      id: "fat-snf",
      title: "What fat and SNF tell you",
      minutes: 6,
      body: [
        "Every litre a member pours is paid for by its fat and SNF (solids-not-fat). Fat is measured as a percentage; SNF is the protein, sugar and minerals left once fat and water are removed.",
        "Cow milk usually shows 3.5–4.5% fat and 8.5–9% SNF. Buffalo milk runs higher on both. A reading far outside these ranges is a reason to test again, not to reject the member.",
        "An electronic milk analyser gives both readings in under a minute. Calibrate it every morning with the standard sample before the first member arrives.",
      ],
      quiz: [
        {
          q: "A cow milk sample reads 3.9% fat and 8.7% SNF. What should you do?",
          options: ["Reject it", "Accept and pay by the rate chart", "Test it three more times"],
          answer: 1,
          why: "Both readings are inside the normal range for cow milk, so pay by the rate chart.",
        },
        {
          q: "When should the analyser be calibrated?",
          options: ["Once a month", "Every morning before collection", "Only when readings look wrong"],
          answer: 1,
          why: "Daily calibration keeps every member's payment fair from the first can.",
        },
      ],
    },
    {
      id: "adulteration",
      title: "Quick adulteration checks",
      minutes: 5,
      body: [
        "Water is the most common adulterant. It lowers both fat and SNF together, and the lactometer reading drops below 26.",
        "Urea, starch and detergent need strip tests. Keep a kit at every collection centre and log each test against the member's code.",
        "When a test fails, record it and inform the secretary. Never announce it in front of other members.",
      ],
      quiz: [
        {
          q: "Fat and SNF both fall and the lactometer reads 22. What is likely?",
          options: ["Added water", "Added urea", "Normal buffalo milk"],
          answer: 0,
          why: "Water dilutes everything evenly and lowers the lactometer reading.",
        },
      ],
    },
    {
      id: "cold-chain",
      title: "Keeping the bulk cooler below 4°C",
      minutes: 7,
      body: [
        "Milk must reach 4°C within three hours of milking. Every hour above that doubles bacterial growth.",
        "Check the bulk milk cooler display at each shift and write the temperature in the log. If the generator is needed, start it before the temperature rises, not after.",
      ],
      quiz: [
        {
          q: "Within how many hours must milk be chilled to 4°C?",
          options: ["One", "Three", "Eight"],
          answer: 1,
          why: "Three hours is the standard window before bacteria multiply quickly.",
        },
      ],
    },
  ],
};

export const trainees: Trainee[] = [
  {
    id: "SS-26-04817",
    name: "Lakshmi Devi",
    district: "Anand",
    state: "Gujarat",
    society: "Borsad Milk Producers' Cooperative",
    role: "Collection centre assistant",
    joined: "2026-03-12",
    languages: ["hi", "en"],
    skills: ["Milk testing", "Fat/SNF analysis", "Collection centre ops", "UPI collections", "Bookkeeping"],
    attendancePct: 96,
    quizTrend: [72, 80, 86, 91],
    daysInactive: 1,
  },
  {
    id: "SS-26-02291",
    name: "Arjun Patil",
    district: "Satara",
    state: "Maharashtra",
    society: "Koregaon PACS",
    role: "PACS secretary trainee",
    joined: "2026-02-03",
    languages: ["hi", "en"],
    skills: ["PACS ERP", "Loan ledger", "Member records", "Tally basics"],
    attendancePct: 88,
    quizTrend: [65, 70, 74, 78],
    daysInactive: 3,
  },
  {
    id: "SS-26-05530",
    name: "Selvi Murugan",
    district: "Thoothukudi",
    state: "Tamil Nadu",
    society: "Punnakayal Fishermen's Cooperative",
    role: "Accounts volunteer",
    joined: "2026-05-20",
    languages: ["ta", "en"],
    skills: ["Catch records", "Cold storage", "Bookkeeping"],
    attendancePct: 61,
    quizTrend: [70, 62, 55, 48],
    daysInactive: 16,
  },
  {
    id: "SS-26-03312",
    name: "Imran Ansari",
    district: "Gaya",
    state: "Bihar",
    society: "Bodh Gaya Youth Cooperative",
    role: "Youth member",
    joined: "2026-04-08",
    languages: ["hi"],
    skills: ["Governance", "Public speaking", "Business planning"],
    attendancePct: 79,
    quizTrend: [58, 60, 66, 64],
    daysInactive: 6,
  },
  {
    id: "SS-26-06104",
    name: "Kavya Hegde",
    district: "Udupi",
    state: "Karnataka",
    society: "Udupi Cooperative Urban Bank",
    role: "Counter clerk",
    joined: "2026-06-15",
    languages: ["en"],
    skills: ["KYC", "Customer service", "Core banking", "AML basics"],
    attendancePct: 92,
    quizTrend: [80, 84, 83, 88],
    daysInactive: 2,
  },
  {
    id: "SS-26-01877",
    name: "Pradeep Nayak",
    district: "Khordha",
    state: "Odisha",
    society: "Maa Tarini SHG Federation",
    role: "SHG book writer",
    joined: "2026-01-22",
    languages: ["hi", "en"],
    skills: ["Bookkeeping", "Bank linkage", "UPI collections"],
    attendancePct: 70,
    quizTrend: [75, 68, 66, 60],
    daysInactive: 11,
  },
];

export const certificates: Certificate[] = [
  { id: "NCCT-2026-GNR-0412", traineeId: "SS-26-04817", programmeSlug: "milk-quality", issuedOn: "2026-06-26", grade: "Distinction", score: 91, attendancePct: 100 },
  { id: "NCCT-2026-BBS-0158", traineeId: "SS-26-04817", programmeSlug: "shg-bookkeeping", issuedOn: "2026-04-04", grade: "First class", score: 78, attendancePct: 92 },
  { id: "NCCT-2026-PUN-0977", traineeId: "SS-26-02291", programmeSlug: "pacs-computerisation", issuedOn: "2026-05-15", grade: "First class", score: 74, attendancePct: 88 },
  { id: "NCCT-2026-BLR-0331", traineeId: "SS-26-06104", programmeSlug: "coop-banking-kyc", issuedOn: "2026-08-21", grade: "Distinction", score: 88, attendancePct: 100 },
  { id: "NCCT-2026-PTN-0205", traineeId: "SS-26-03312", programmeSlug: "youth-leadership", issuedOn: "2026-07-11", grade: "Pass", score: 64, attendancePct: 79 },
];

export const jobs: Job[] = [
  { id: "J-1041", title: "Milk collection centre in-charge", employer: "Kaveri Milk Producers' Union", district: "Anand", state: "Gujarat", kind: "Full time", pay: "₹18,000–22,000 / month", skills: ["Milk testing", "Fat/SNF analysis", "Collection centre ops", "Bookkeeping"], postedOn: "2026-09-18", openings: 4 },
  { id: "J-1038", title: "Quality lab assistant", employer: "Sabar Dairy Cooperative", district: "Sabarkantha", state: "Gujarat", kind: "Full time", pay: "₹16,500 / month", skills: ["Milk testing", "Fat/SNF analysis", "Cold chain"], postedOn: "2026-09-12", openings: 2 },
  { id: "J-1032", title: "PACS data entry operator", employer: "Satara District Central Cooperative Bank", district: "Satara", state: "Maharashtra", kind: "Full time", pay: "₹15,000 / month", skills: ["PACS ERP", "Member records", "Tally basics"], postedOn: "2026-09-10", openings: 6 },
  { id: "J-1027", title: "Seasonal procurement assistant", employer: "Koregaon PACS", district: "Satara", state: "Maharashtra", kind: "Seasonal", pay: "₹550 / day", skills: ["Loan ledger", "Member records"], postedOn: "2026-09-05", openings: 3 },
  { id: "J-1024", title: "Cold storage supervisor", employer: "Coastal Fishermen's Federation", district: "Thoothukudi", state: "Tamil Nadu", kind: "Full time", pay: "₹17,000 / month", skills: ["Cold storage", "Catch records", "Bookkeeping"], postedOn: "2026-09-02", openings: 1 },
  { id: "J-1019", title: "Bank mitra (business correspondent)", employer: "Udupi Cooperative Urban Bank", district: "Udupi", state: "Karnataka", kind: "Full time", pay: "₹14,000 + commission", skills: ["KYC", "Customer service", "Core banking"], postedOn: "2026-08-28", openings: 5 },
  { id: "J-1012", title: "Start a village dairy unit", employer: "NCDC enterprise support desk", district: "Any", state: "All states", kind: "Enterprise support", pay: "Loan up to ₹10 lakh", skills: ["Business planning", "Milk testing", "Bookkeeping"], postedOn: "2026-08-20", openings: 50 },
  { id: "J-1008", title: "SHG federation accountant", employer: "Maa Tarini SHG Federation", district: "Khordha", state: "Odisha", kind: "Apprenticeship", pay: "₹9,000 stipend", skills: ["Bookkeeping", "Bank linkage", "UPI collections"], postedOn: "2026-08-14", openings: 2 },
];

// Monthly outreach, used by the ministry dashboard.
export const monthlyTrained = [
  { month: "Apr", trained: 3120, certified: 2610 },
  { month: "May", trained: 3480, certified: 2950 },
  { month: "Jun", trained: 4015, certified: 3390 },
  { month: "Jul", trained: 3790, certified: 3240 },
  { month: "Aug", trained: 4460, certified: 3860 },
  { month: "Sep", trained: 4980, certified: 4310 },
];

export const stateOutreach = [
  { state: "Maharashtra", trainees: 5210, placed: 1390 },
  { state: "Gujarat", trainees: 4870, placed: 1620 },
  { state: "Uttar Pradesh", trainees: 4410, placed: 880 },
  { state: "Tamil Nadu", trainees: 3380, placed: 910 },
  { state: "Karnataka", trainees: 2960, placed: 840 },
  { state: "Bihar", trainees: 2540, placed: 410 },
  { state: "Odisha", trainees: 1980, placed: 450 },
];

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export const getProgramme = (slug: string) => programmes.find((p) => p.slug === slug);
export const getInstitute = (id: string) => institutes.find((i) => i.id === id);
export const getTrainee = (id: string) => trainees.find((t) => t.id === id);
export const getCertificate = (id: string) =>
  certificates.find((c) => c.id.toLowerCase() === id.trim().toLowerCase());
export const certificatesFor = (traineeId: string) => certificates.filter((c) => c.traineeId === traineeId);

/** The signed-in trainee in demo mode. */
export const DEMO_TRAINEE_ID = "SS-26-04817";
