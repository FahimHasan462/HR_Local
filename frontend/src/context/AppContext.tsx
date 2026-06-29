import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BonusStatus, HrComplaint, HrNotification } from "@/data/hrComplaints";
import { asRole, LeaveRecord, LeaveType, Role } from "@/types/employee";
import { apiFetch, getAuthToken, setAuthToken } from "@/lib/api";

type LoginResult = { success: boolean; message?: string; role?: Role };

type Ctx = {
  currentUser: Employee | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  employees: Employee[];
  hrComplaints: HrComplaint[];
  hrNotifications: HrNotification[];
  submitHrComplaint: (againstEmployeeId: string, subject: string, details: string) => Promise<boolean>;
  markAllHrNotificationsRead: () => Promise<void>;
  markHrNotificationRead: (notificationId: string) => Promise<void>;
  updateBonusStatus: (notificationId: string, status: BonusStatus) => Promise<boolean>;
  applyLeave: (id: string, type: LeaveType, reason: string, date?: string) => Promise<boolean>;
  addEmployee: (
    data: Omit<Employee, "id" | "sickLeave" | "paidLeave" | "sickLeaveTotal" | "paidLeaveTotal" | "avatar" | "bio" | "projects" | "leaves"> &
      Partial<Pick<Employee, "avatar" | "bio" | "projects" | "leaves">>,
  ) => Promise<boolean>;
  removeEmployee: (id: string) => Promise<boolean>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<boolean>;
};

const AppCtx = createContext<Ctx | null>(null);

const avatarFor = (role: string) =>
  role === "artist" ? "🎨" : role === "management" ? "🎬" : role === "IT" ? "🖥️" : "💼";

/** Raw employee shape from the API before normalization. */
type EmployeeInput = {
  _id?: string;
  id?: string;
  name: string;
  role?: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  joined?: string;
  nid?: string;
  presentAddress?: string;
  permanentAddress?: string;
  sheetName?: string;
  avatar?: string;
  bio?: string;
  projects?: string[];
  sickLeave?: number;
  paidLeave?: number;
  unpaidLeave?: number;
  sickLeaveTotal?: number;
  paidLeaveTotal?: number;
  casualLeaveTotal?: number;
  leaves?: Array<{
    _id?: string;
    id?: string;
    date?: string;
    type?: string;
    reason?: string;
  }>;
};

export type Employee = {
  _id?: string;
  id?: string;
  name: string;
  role?: Role;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  joined?: string;
  nid?: string;
  presentAddress?: string;
  permanentAddress?: string;
  sheetName?: string;
  avatar?: string;
  bio?: string;
  projects?: string[];
  sickLeave?: number;
  paidLeave?: number;
  unpaidLeave?: number;
  sickLeaveTotal?: number;
  paidLeaveTotal?: number;
  casualLeaveTotal?: number;
  leaves: LeaveRecord[];
};

const normalizeEmployee = (employee: EmployeeInput): Employee => {
  const leaves: LeaveRecord[] = (employee.leaves ?? []).map((leave) => ({
    id: leave._id ?? leave.id ?? "",
    date: leave.date ?? new Date().toISOString().slice(0, 10),
    type: (leave.type === "casual" ? "paid" : leave.type ?? "sick") as LeaveType,
    reason: leave.reason ?? "",
  }));

  const role = asRole(employee.role);

  return {
    id: employee._id ?? employee.id,
    name: employee.name,
    role,
    title: employee.title ?? "Employee",
    department: employee.department ?? role.toUpperCase(),
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    joined: employee.joined ?? new Date().toISOString().slice(0, 10),
    nid: employee.nid ?? "",
    presentAddress: employee.presentAddress ?? "",
    permanentAddress: employee.permanentAddress ?? "",
    sheetName: employee.sheetName ?? "",
    avatar: employee.avatar || avatarFor(role),
    bio: employee.bio ?? "Team member",
    projects: employee.projects ?? [],
    sickLeave: employee.sickLeave ?? 0,
    paidLeave: employee.paidLeave ?? 0,
    sickLeaveTotal: employee.sickLeaveTotal ?? 12,
    paidLeaveTotal: employee.paidLeaveTotal ?? 12,
    leaves,
  };
};

const normalizeComplaint = (c: {
  _id?: string;
  id?: string;
  filedAt: string;
  complainantId: string;
  againstEmployeeId: string;
  subject: string;
  details: string;
}): HrComplaint => ({
  id: c._id ?? c.id ?? "",
  filedAt: c.filedAt,
  complainantId: String(c.complainantId),
  againstEmployeeId: String(c.againstEmployeeId),
  subject: c.subject,
  details: c.details,
});

const normalizeNotification = (n: {
  _id?: string;
  id?: string;
  type?: string;
  complaintId?: string;
  employeeId?: string;
  subject?: string;
  message?: string;
  bonusYear?: number;
  bonusStatus?: string;
  createdAt: string;
  read: boolean;
}): HrNotification => ({
  id: n._id ?? n.id ?? "",
  type: (n.type === "bonus" ? "bonus" : n.type === "registration" ? "registration" : "complaint") as HrNotification["type"],
  complaintId: n.complaintId ? String(n.complaintId) : undefined,
  employeeId: n.employeeId ? String(n.employeeId) : undefined,
  subject: n.subject,
  message: n.message,
  bonusYear: n.bonusYear,
  bonusStatus:
    n.bonusStatus === "provided" ? "provided" : n.type === "bonus" ? "pending" : undefined,
  createdAt: n.createdAt,
  read: n.read,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [list, setList] = useState<Employee[]>([]);
  const [hrComplaints, setHrComplaints] = useState<HrComplaint[]>([]);
  const [hrNotifications, setHrNotifications] = useState<HrNotification[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(!!getAuthToken());
  const currentUser = list.find((e) => e.id === currentUserId) ?? null;

  const bootstrapSession = async (employee: Employee) => {
    const normalized = normalizeEmployee(employee);
    setCurrentUserId(normalized.id ?? null);
    setList((prev) => {
      const without = prev.filter((e) => e.id !== normalized.id);
      return [normalized, ...without];
    });
    await loadEmployees();
    if (normalized.role === "hr") {
      await loadHrData();
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setSessionLoading(false);
      return;
    }

    (async () => {
      const { ok, data } = await apiFetch<{ employee?: Employee }>("/employees/me");
      if (ok && data?.employee) {
        await bootstrapSession(data.employee);
      } else {
        setAuthToken(null);
      }
      setSessionLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEmployees = async () => {
    const { ok, data } = await apiFetch<EmployeeInput[]>("/employees/all-employees-info");
    if (ok && Array.isArray(data)) {
      const normalized = data.map((e) => normalizeEmployee(e));
      setList(normalized);
      const me = normalized.find((e) => e.id === currentUserId);
      if (me?.role === "hr") {
        await loadHrData();
      }
    }
  };

  const loadHrData = async () => {
    const [complaintsRes, notificationsRes] = await Promise.all([
      apiFetch<Array<Parameters<typeof normalizeComplaint>[0]>>("/complaints"),
      apiFetch<Array<Parameters<typeof normalizeNotification>[0]>>("/notifications"),
    ]);

    if (complaintsRes.ok && Array.isArray(complaintsRes.data)) {
      setHrComplaints(complaintsRes.data.map(normalizeComplaint));
    }
    if (notificationsRes.ok && Array.isArray(notificationsRes.data)) {
      setHrNotifications(notificationsRes.data.map(normalizeNotification));
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    if (!email.trim() || !password.trim()) {
      return { success: false, message: "Email and password are required." };
    }

    try {
      const { ok, data } = await apiFetch<{ message?: string; token?: string; employee?: Employee }>(
        "/employees/login",
        {
          method: "POST",
          auth: false,
          body: JSON.stringify({ email, password }),
        },
      );

      if (!ok || !data?.employee || !data?.token) {
        const err = data as { message?: string; error?: string };
        return { success: false, message: err?.message ?? err?.error ?? "Login failed." };
      }

      setAuthToken(data.token);
      await bootstrapSession(data.employee);
      return { success: true, role: asRole(data.employee.role) };
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Unable to reach server.";
      const message =
        raw === "Failed to fetch"
          ? "Cannot reach the API. Start the backend (npm run dev from the project root) and try again."
          : raw;
      return { success: false, message };
    }
  };

  const logout = () => {
    setAuthToken(null);
    setCurrentUserId(null);
    setList([]);
    setHrComplaints([]);
    setHrNotifications([]);
  };

  const applyLeave = async (id: string, type: LeaveType, reason: string, date?: string): Promise<boolean> => {
    try {
      const { ok, data } = await apiFetch<{ message?: string; employee?: Employee }>(
        `/employees/${id}/leave`,
        {
          method: "POST",
          body: JSON.stringify({ type, reason, date }),
        },
      );

      if (!ok || !data?.employee) {
        return false;
      }

      const updated = normalizeEmployee(data.employee);
      setList((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      return true;
    } catch {
      return false;
    }
  };

  const addEmployee: Ctx["addEmployee"] = async (data) => {
    try {
      const { ok, data: res } = await apiFetch<{ message?: string; employee?: Employee }>("/employees", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!ok || !res?.employee) {
        return false;
      }

      const created = normalizeEmployee(res.employee);
      setList((prev) => [created, ...prev.filter((e) => e.id !== created.id)]);
      return true;
    } catch {
      return false;
    }
  };

  const removeEmployee = async (id: string): Promise<boolean> => {
    try {
      const { ok } = await apiFetch(`/employees/${id}`, { method: "DELETE" });
      if (!ok) return false;
      setList((prev) => prev.filter((e) => e.id !== id));
      if (currentUserId === id) setCurrentUserId(null);
      return true;
    } catch {
      return false;
    }
  };

  const submitHrComplaint: Ctx["submitHrComplaint"] = async (againstEmployeeId, subject, details) => {
    if (!currentUser?.id) return false;

    try {
      const { ok, data } = await apiFetch<{
        complaint?: Parameters<typeof normalizeComplaint>[0];
        notification?: Parameters<typeof normalizeNotification>[0];
      }>("/complaints", {
        method: "POST",
        body: JSON.stringify({
          complainantId: currentUser.id,
          againstEmployeeId,
          subject,
          details,
        }),
      });

      if (!ok) return false;

      // Complaints & notifications are HR-only; complainant does not receive a notification
      return true;
    } catch {
      return false;
    }
  };

  const updateEmployee = async (id: string, data: Partial<Employee>): Promise<boolean> => {
    try {
      const { ok, data: res } = await apiFetch<{ message?: string; employee?: Employee }>(
        `/employees/${id}`,
        { method: "PUT", body: JSON.stringify(data) },
      );
      if (!ok || !res?.employee) return false;
      const updated = normalizeEmployee(res.employee);
      setList((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      return true;
    } catch {
      return false;
    }
  };

  const markAllHrNotificationsRead = async () => {
    await apiFetch("/notifications/mark-all-read", { method: "PATCH" });
    setHrNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markHrNotificationRead = async (notificationId: string) => {
    await apiFetch(`/notifications/mark-read/${notificationId}`, { method: "PATCH" });
    setHrNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  };

  const updateBonusStatus = async (
    notificationId: string,
    status: BonusStatus,
  ): Promise<boolean> => {
    try {
      const { ok, data } = await apiFetch<{
        notification?: Parameters<typeof normalizeNotification>[0];
      }>(`/notifications/${notificationId}/bonus-status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      if (!ok || !data?.notification) return false;

      const updated = normalizeNotification(data.notification);
      setHrNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? updated : n)),
      );
      return true;
    } catch {
      return false;
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Restoring session…
      </div>
    );
  }

  return (
    <AppCtx.Provider
      value={{
        currentUser,
        login,
        logout,
        employees: list,
        hrComplaints,
        hrNotifications,
        submitHrComplaint,
        markAllHrNotificationsRead,
        markHrNotificationRead,
        updateBonusStatus,
        applyLeave,
        addEmployee,
        removeEmployee,
        updateEmployee,
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
