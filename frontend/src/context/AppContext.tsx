import { createContext, useContext, useState, ReactNode } from "react";
import { Employee, Role, LeaveType, LeaveRecord } from "@/data/employees";
import { HrComplaint, HrComplaintNotification } from "@/data/hrComplaints";

type LoginResult = {success: boolean; message?: string;};

type Ctx = {
  currentUser: Employee | null;
  login: (email: string, password: string) => Promise<LoginResult>;
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

type Leave = {
  _id?: string;
  id?: string;
  date?: string;
  type?: "sick" | "casual" | "unpaid";
  reason?: string;
};

type BackendEmployee = {
  _id?: string;
  id?: string;
  name?: string;
  role?: Role;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  joined?: string;
  nid?: string;
  presentAddress?: string;
  permanentAddress?: string;
  avatar?: string;
  bio?: string;
  projects?: string[];
  sickLeave?: number;
  paidLeave?: number;
  casualLeave?: number;
  unpaidLeave?: number;
  sickLeaveTotal?: number;
  paidLeaveTotal?: number;
  casualLeaveTotal?: number;
  leaves?: Leave[];
};

const toFrontendLeaveType = (type: Leave["type"]): LeaveType =>
  type === "casual" ? "paid" : type === "unpaid" ? "unpaid" : "sick";

const normalizeEmployee = (employee: BackendEmployee): Employee => {
  const role = employee.role;
  const id = employee._id;
  const leaves = (employee.leaves ?? []).map((leave, index) => ({
    id: leave._id ?? leave.id ?? `l${index}`,
    date: leave.date ?? new Date().toISOString().slice(0, 10),
    type: toFrontendLeaveType(leave.type),
    reason: leave.reason ?? "",
  }));

  return {
    id,
    name: employee.name ?? "Unknown",
    role,
    title: employee.title ?? "Employee",
    department: employee.department ?? role.toUpperCase(),
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    joined: employee.joined ?? new Date().toISOString().slice(0, 10),
    nid: employee.nid ?? "",
    presentAddress: employee.presentAddress ?? "",
    permanentAddress: employee.permanentAddress ?? "",
    avatar: employee.avatar || avatarFor(role),
    bio: employee.bio ?? "Team member",
    projects: employee.projects ?? [],
    sickLeave: employee.sickLeave ?? 0,
    paidLeave: employee.paidLeave ?? employee.casualLeave ?? 0,
    sickLeaveTotal: employee.sickLeaveTotal ?? 12,
    paidLeaveTotal: employee.paidLeaveTotal ?? employee.casualLeaveTotal ?? 20,
    leaves,
  };
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [list, setList] = useState<Employee[]>([]);
  const [hrComplaints, setHrComplaints] = useState<HrComplaint[]>([]);
  const [hrComplaintNotifications, setHrComplaintNotifications] = useState<HrComplaintNotification[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const currentUser = list.find((e) => e.id === currentUserId) ?? null;

  const login = async (email: string, password: string): Promise<LoginResult> => {
    if (!email.trim() || !password.trim()) {
      return { success: false, message: "Email and password are required." };
    }

    try {
      const response = await fetch("http://localhost:5000/api/employees/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data?.message ?? "Login failed." };
      }

      if (!data?.employee) {
        return { success: false, message: "No employee returned from server." };
      }

      const normalizedEmployee = normalizeEmployee(data.employee as BackendEmployee);
      setList((prev) => {
        const withoutCurrent = prev.filter((employee) => employee.id !== normalizedEmployee.id);
        return [normalizedEmployee, ...withoutCurrent];
      });
      setCurrentUserId(normalizedEmployee.id);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach server.";
      return { success: false, message };
    }
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
