import { createContext, useContext, useState, ReactNode } from "react";
import { employees as seed, Employee, Role, LeaveType, LeaveRecord } from "@/data/employees";
import { HrComplaint, HrComplaintNotification } from "@/data/hrComplaints";

type Ctx = {
  currentUser: Employee | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  employees: Employee[];
  hrComplaints: HrComplaint[];
  hrComplaintNotifications: HrComplaintNotification[];
  submitHrComplaint: (againstEmployeeId: string, subject: string, details: string) => void;
  markAllHrComplaintNotificationsRead: () => void;
  markHrComplaintNotificationRead: (complaintId: string) => void;
  applyLeave: (id: string, type: LeaveType, reason: string, date?: string) => void;
  addEmployee: (
    data: Omit<Employee, "id" | "sickLeave" | "paidLeave" | "sickLeaveTotal" | "paidLeaveTotal" | "avatar" | "bio" | "projects" | "leaves"> &
      Partial<Pick<Employee, "avatar" | "bio" | "projects" | "leaves">>
  ) => void;
  removeEmployee: (id: string) => void;
};

const AppCtx = createContext<Ctx | null>(null);

const avatarFor = (role: Role) =>
  role === "artist" ? "🎨" : role === "management" ? "🎬" : role === "IT" ? "🖥️" : "💼";

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [list, setList] = useState<Employee[]>(seed);
  const [hrComplaints, setHrComplaints] = useState<HrComplaint[]>([]);
  const [hrComplaintNotifications, setHrComplaintNotifications] = useState<HrComplaintNotification[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const currentUser = list.find((e) => e.id === currentUserId) ?? null;

  const login = (email: string, password: string) => {
    if (!email.trim() || !password.trim()) return false;
    const user = list.find((e) => e.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
    setCurrentUserId(user?.id ?? null);
    return !!user;
  };
  const logout = () => setCurrentUserId(null);

  const applyLeave = (id: string, type: LeaveType, reason: string, date?: string) => {
    const recordDate = date || new Date().toISOString().slice(0, 10);
    setList((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const record: LeaveRecord = {
          id: `l${Date.now()}`,
          date: recordDate,
          type,
          reason,
        };
        const next: Employee = { ...e, leaves: [record, ...e.leaves] };
        if (type === "sick" && e.sickLeave < e.sickLeaveTotal) next.sickLeave = e.sickLeave + 1;
        if (type === "paid" && e.paidLeave < e.paidLeaveTotal) next.paidLeave = e.paidLeave + 1;
        return next;
      })
    );
  };

  const addEmployee: Ctx["addEmployee"] = (data) => {
    const newEmp: Employee = {
      id: `e${Date.now()}`,
      avatar: data.avatar || avatarFor(data.role),
      bio: data.bio || "Newest member of the crew ✨",
      projects: data.projects || [],
      leaves: data.leaves || [],
      sickLeave: 0,
      paidLeave: 0,
      sickLeaveTotal: data.role === "artist" ? 12 : 15,
      paidLeaveTotal: data.role === "artist" ? 20 : 25,
      ...data,
    };
    setList((prev) => [newEmp, ...prev]);
  };

  const removeEmployee = (id: string) => {
    setList((prev) => prev.filter((e) => e.id !== id));
  };

  const submitHrComplaint: Ctx["submitHrComplaint"] = (againstEmployeeId, subject, details) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const complaintId = `hc${Date.now()}`;
    const complaint: HrComplaint = {
      id: complaintId,
      filedAt: now,
      complainantId: currentUser.id,
      againstEmployeeId,
      subject: subject.trim(),
      details: details.trim(),
    };
    setHrComplaints((prev) => [complaint, ...prev]);
    setHrComplaintNotifications((prev) => [
      {
        id: `hn${Date.now()}`,
        complaintId,
        createdAt: now,
        read: false,
      },
      ...prev,
    ]);
  };

  const markAllHrComplaintNotificationsRead = () => {
    setHrComplaintNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markHrComplaintNotificationRead = (complaintId: string) => {
    setHrComplaintNotifications((prev) =>
      prev.map((n) => (n.complaintId === complaintId ? { ...n, read: true } : n)),
    );
  };

  return (
    <AppCtx.Provider
      value={{
        currentUser,
        login,
        logout,
        employees: list,
        hrComplaints,
        hrComplaintNotifications,
        submitHrComplaint,
        markAllHrComplaintNotificationsRead,
        markHrComplaintNotificationRead,
        applyLeave,
        addEmployee,
        removeEmployee,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
