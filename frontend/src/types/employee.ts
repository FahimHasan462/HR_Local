export type Role = "artist" | "management" | "hr" | "IT";

export type LeaveType = "sick" | "paid" | "unpaid";

export type LeaveRecord = {
  id: string;
  date: string;
  type: LeaveType;
  reason: string;
};

export const roleMeta: Record<Role, { label: string; emoji: string; tagline: string }> = {
  artist: { label: "Artist", emoji: "🎨", tagline: "View your personal info & leave balance" },
  management: { label: "Management", emoji: "🎬", tagline: "Browse the full team roster" },
  hr: { label: "HR", emoji: "💼", tagline: "Manage employees & leave records" },
  IT: { label: "IT", emoji: "🖥️", tagline: "Manage technical infrastructure & systems" },
};

export const asRole = (value?: string): Role => {
  if (value === "artist" || value === "management" || value === "hr" || value === "IT") {
    return value;
  }
  return "artist";
};
