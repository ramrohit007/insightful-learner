// Demo accounts
export const demoAccounts = {
  teacher: {
    email: "teacher@demo.com",
    password: "teacher123",
    name: "Dr. Sarah Johnson",
    role: "teacher" as const,
  },
  students: [
    {
      email: "student1@demo.com",
      password: "student123",
      name: "Alex Thompson",
      role: "student" as const,
      id: "STU001",
    },
    {
      email: "student2@demo.com",
      password: "student123",
      name: "Maria Garcia",
      role: "student" as const,
      id: "STU002",
    },
    {
      email: "student3@demo.com",
      password: "student123",
      name: "James Wilson",
      role: "student" as const,
      id: "STU003",
    },
  ],
};

// Mock topic understanding data
export const topicData = [
  {
    topic: "Algebra Basics",
    students: [
      { name: "Alex Thompson", understanding: 85 },
      { name: "Maria Garcia", understanding: 92 },
      { name: "James Wilson", understanding: 78 },
    ],
    avgUnderstanding: 85,
  },
  {
    topic: "Linear Equations",
    students: [
      { name: "Alex Thompson", understanding: 72 },
      { name: "Maria Garcia", understanding: 88 },
      { name: "James Wilson", understanding: 65 },
    ],
    avgUnderstanding: 75,
  },
  {
    topic: "Quadratic Functions",
    students: [
      { name: "Alex Thompson", understanding: 68 },
      { name: "Maria Garcia", understanding: 75 },
      { name: "James Wilson", understanding: 82 },
    ],
    avgUnderstanding: 75,
  },
  {
    topic: "Trigonometry",
    students: [
      { name: "Alex Thompson", understanding: 90 },
      { name: "Maria Garcia", understanding: 85 },
      { name: "James Wilson", understanding: 70 },
    ],
    avgUnderstanding: 82,
  },
  {
    topic: "Calculus Intro",
    students: [
      { name: "Alex Thompson", understanding: 55 },
      { name: "Maria Garcia", understanding: 62 },
      { name: "James Wilson", understanding: 58 },
    ],
    avgUnderstanding: 58,
  },
];

// Mock uploaded files
export const mockUploads = [
  {
    id: "1",
    studentName: "Alex Thompson",
    fileName: "exam_answers.pdf",
    uploadDate: "2024-01-15T10:30:00",
    status: "processed" as const,
  },
  {
    id: "2",
    studentName: "Maria Garcia",
    fileName: "final_exam.pdf",
    uploadDate: "2024-01-15T11:45:00",
    status: "processed" as const,
  },
  {
    id: "3",
    studentName: "James Wilson",
    fileName: "test_answers.pdf",
    uploadDate: "2024-01-15T14:20:00",
    status: "processing" as const,
  },
];

// Generate access code
export const generateAccessCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
