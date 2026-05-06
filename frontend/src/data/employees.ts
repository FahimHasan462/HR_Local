export type Role = "artist" | "management" | "hr" |"IT";

export type LeaveType = "sick" | "paid" | "unpaid";

export type LeaveRecord = {
  id: string;
  date: string;
  type: LeaveType;
  reason: string;
};

export type Employee = {
  id: string;
  name: string;
  role: Role;
  title: string;
  department: string;
  email: string;
  phone: string;
  joined: string;
  nid: string;
  presentAddress: string;
  permanentAddress: string;
  avatar: string;
  bio: string;
  projects: string[];
  sickLeave: number;
  paidLeave: number;
  sickLeaveTotal: number;
  paidLeaveTotal: number;
  leaves: LeaveRecord[];
};

export const employees: Employee[] = [
  {
    id: "e1",
    name: "Fahim Hasan",
    role: "IT",
    title: "Network Engineer",
    department: "IT",
    email: "Fahim.it.skibidy@gmail.com",
    phone: "+1 555 0142",
    joined: "April 2026",
    nid: "1990-3344-5567-21",
    presentAddress: "30 shanti nagar, Dhaka 1217, Bangladesh",
    permanentAddress: "30 shanti nagar, Dhaka 1217, Bangladesh",
    avatar: "🖥️",
    bio: "Brings squash & stretch magic to every frame. Loves expressive eyes.",
    projects: ["Starlight Express", "Pixel Pals S2", "Moonlit Tales"],
    sickLeave: 3, paidLeave: 8, sickLeaveTotal: 12, paidLeaveTotal: 20,
    leaves: [
      { id: "l1", date: "2024-11-04", type: "sick", reason: "High fever, doctor advised rest." },
      { id: "l2", date: "2025-01-15", type: "paid", reason: "Family wedding in Kyoto." },
      { id: "l3", date: "2025-03-22", type: "sick", reason: "Migraine — couldn't focus on screen." },
    ],
  },
  {
    id: "e2",
    name: "Md Sayem",
    role: "artist",
    title: "Storyboard Artist",
    department: "Pre-Production",
    email: "sayem.skibidy@gmail.com",
    phone: "+1 555 0188",
    joined: "2022-07-04",
    nid: "1992-7781-0044-09",
    presentAddress: "88 Mission St, San Francisco, CA 94103",
    permanentAddress: "Av. Reforma 210, CDMX 06600, Mexico",
    avatar: "✏️",
    bio: "Turns scripts into shot-by-shot visual symphonies.",
    projects: ["Starlight Express", "Cosmic Café"],
    sickLeave: 1, paidLeave: 4, sickLeaveTotal: 12, paidLeaveTotal: 20,
    leaves: [
      { id: "l1", date: "2024-12-10", type: "paid", reason: "Year-end holiday with family." },
      { id: "l2", date: "2025-02-08", type: "sick", reason: "Stomach flu." },
    ],
  },
  {
    id: "e2",
    name: "Diego Romero",
    role: "artist",
    title: "Storyboard Artist",
    department: "Pre-Production",
    email: "diego@toonforge.studio",
    phone: "+1 555 0188",
    joined: "2022-07-04",
    nid: "1992-7781-0044-09",
    presentAddress: "88 Mission St, San Francisco, CA 94103",
    permanentAddress: "Av. Reforma 210, CDMX 06600, Mexico",
    avatar: "✏️",
    bio: "Turns scripts into shot-by-shot visual symphonies.",
    projects: ["Starlight Express", "Cosmic Café"],
    sickLeave: 1, paidLeave: 4, sickLeaveTotal: 12, paidLeaveTotal: 20,
    leaves: [
      { id: "l1", date: "2024-12-10", type: "paid", reason: "Year-end holiday with family." },
      { id: "l2", date: "2025-02-08", type: "sick", reason: "Stomach flu." },
    ],
  },
  {
    id: "e3",
    name: "Yuki Park",
    role: "artist",
    title: "VFX Compositor",
    department: "Post-Production",
    email: "yuki@toonforge.studio",
    phone: "+1 555 0211",
    joined: "2023-01-20",
    nid: "1995-2210-9981-44",
    presentAddress: "5 Pine Ave, Vancouver, BC V6B 1A1",
    permanentAddress: "112 Hangang-ro, Yongsan-gu, Seoul, South Korea",
    avatar: "✨",
    bio: "Wrangles particles, glow, and that final cinematic polish.",
    projects: ["Moonlit Tales", "Neon Nomads"],
    sickLeave: 0, paidLeave: 6, sickLeaveTotal: 12, paidLeaveTotal: 20,
    leaves: [
      { id: "l1", date: "2024-10-21", type: "paid", reason: "Trip to Seoul." },
      { id: "l2", date: "2025-04-02", type: "unpaid", reason: "Personal matters." },
    ],
  },
  {
    id: "e4",
    name: "Rifat Raihan",
    role: "management",
    title: "Studio Director",
    department: "Management",
    email: "r.rifat@hayabusa-film.com",
    phone: "+1 555 0100",
    joined: "2018-09-01",
    nid: "1985-0011-2233-55",
    presentAddress: "300 Park Ave, New York, NY 10022",
    permanentAddress: "House 7, Road 11, Banani, Dhaka 1213",
    avatar: "🎬",
    bio: "Steering the studio's creative vision and production pipeline.",
    projects: ["All productions"],
    sickLeave: 2, paidLeave: 10, sickLeaveTotal: 15, paidLeaveTotal: 25,
    leaves: [
      { id: "l1", date: "2024-08-12", type: "paid", reason: "Annual leave." },
      { id: "l2", date: "2025-02-19", type: "sick", reason: "Flu." },
    ],
  },
  {
    id: "e5",
    name: "Owen Pierce",
    role: "management",
    title: "Production Manager",
    department: "Management",
    email: "owen@toonforge.studio",
    phone: "+1 555 0123",
    joined: "2020-02-17",
    nid: "1988-4455-6677-12",
    presentAddress: "21 Sunset Blvd, Los Angeles, CA 90028",
    permanentAddress: "44 Maple Crescent, Toronto, ON M4W 1A8",
    avatar: "📋",
    bio: "Keeps deadlines, budgets, and humans aligned.",
    projects: ["Starlight Express", "Pixel Pals S2"],
    sickLeave: 1, paidLeave: 7, sickLeaveTotal: 15, paidLeaveTotal: 25,
    leaves: [
      { id: "l1", date: "2025-01-05", type: "paid", reason: "New Year break." },
    ],
  },
  {
    id: "e6",
    name: "Fouzia Mini",
    role: "hr",
    title: "Head of People",
    department: "Human Resources",
    email: "Recruit.skibidy@gmail.com",
    phone: "+1 555 0166",
    joined: "2019-11-05",
    nid: "1987-9988-7766-33",
    presentAddress: "9 Marina Bay, Singapore 018956",
    permanentAddress: "12 Rose Garden Rd, Mumbai 400050, India",
    avatar: "💼",
    bio: "Champions team well-being, growth, and culture.",
    projects: ["People Ops"],
    sickLeave: 2, paidLeave: 9, sickLeaveTotal: 15, paidLeaveTotal: 25,
    leaves: [
      { id: "l1", date: "2024-09-30", type: "sick", reason: "Recovery after surgery." },
      { id: "l2", date: "2025-03-11", type: "paid", reason: "Conference travel." },
    ],
  },
];

export const roleMeta: Record<Role, { label: string; emoji: string; tagline: string }> = {
  artist: { label: "Artist", emoji: "🎨", tagline: "View your personal info & leave balance" },
  management: { label: "Management", emoji: "🎬", tagline: "Browse the full team roster" },
  hr: { label: "HR", emoji: "💼", tagline: "Manage employees & leave records" },
  IT: { label: "IT", emoji: "🖥️", tagline: "Manage technical infrastructure & systems" },
};
