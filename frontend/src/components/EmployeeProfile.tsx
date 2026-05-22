import { useMemo, useState } from "react";
import { Employee } from "@/context/AppContext";
import { HrComplaint } from "@/data/hrComplaints";
import { type LeaveRecord } from "@/types/employee";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoleBadge } from "./RoleBadge";
import { Mail, Phone, Calendar, Briefcase, IdCard, MapPin, Home, User, Stethoscope, Plane, CalendarX, CalendarDays, MessageSquareWarning } from "lucide-react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "@/components/ui/dialog";


type LeaveType = "sick" | "paid" | "unpaid";



const leaveMeta: Record<LeaveType, { label: string; icon: typeof Stethoscope; chip: string }> = {
  sick: { label: "Sick", icon: Stethoscope, chip: "bg-secondary/15 text-secondary" },
  paid: { label: "Paid", icon: Plane, chip: "bg-primary/15 text-primary" },
  unpaid: { label: "Unpaid", icon: CalendarX, chip: "bg-muted text-muted-foreground" },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const Stat = ({ label, used, total, tone }: { label: string; used: number; total: number; tone: "primary" | "secondary" }) => {
  const pct = Math.min(100, (used / total) * 100);
  return (
    <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">
          <span className="text-2xl font-bold">{used}</span>
          <span className="text-muted-foreground"> / {total}</span>
        </p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={tone === "primary" ? "h-full bg-gradient-primary" : "h-full bg-gradient-secondary"}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{total - used} days remaining</p>
    </div>
  );
};

const CURRENT_YEAR = new Date().getFullYear();
/** py-2.5 button + text line */
const LEAVE_ROW_HEIGHT_REM = 3;
/** matches space-y-2 between list items */
const LEAVE_ROW_GAP_REM = 0.5;
const VISIBLE_LEAVE_ROWS = 6;

const leavesListHeightRem = (rows: number) =>
  rows * LEAVE_ROW_HEIGHT_REM + Math.max(0, rows - 1) * LEAVE_ROW_GAP_REM;

export const EmployeeProfile = ({
  employee,
  showLeaveHistory = false,
  anonymousHrComplaintsAgainst,
}: {
  employee: Employee;
  showLeaveHistory?: boolean;
  anonymousHrComplaintsAgainst?: HrComplaint[];
}) => {
  const [openLeave, setOpenLeave] = useState<LeaveRecord | null>(null);
  const [openComplaint, setOpenComplaint] = useState<HrComplaint | null>(null);

  const yearLeaves = useMemo(
    () =>
      employee.leaves
        .filter((l) => new Date(l.date).getFullYear() === CURRENT_YEAR)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [employee.leaves],
  );

  const currentMonthUnpaidLeaves = employee.unpaidLeave ?? yearLeaves.filter((leave) => {
    const d = new Date(leave.date);
    const now = new Date();
    return leave.type === "unpaid" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl animate-blob" />
        <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl animate-blob" style={{ animationDelay: "2s" }} />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 text-5xl backdrop-blur-md animate-float">
            {employee.avatar}
          </div>
          <div className="flex-1">
            <RoleBadge role={employee.role} className="mb-3 bg-white/20 text-primary-foreground" />
            <h2 className="text-3xl font-bold">{employee.name}</h2>
            <p className="text-base opacity-90">{employee.title} · {employee.department}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold">About</h3>
    
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <User className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="truncate text-sm font-medium">{employee.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <Briefcase className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="truncate text-sm font-medium">{employee.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Number</p>
                <p className="truncate text-sm font-medium">{employee.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="truncate text-sm font-medium">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <Calendar className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Joining Date</p>
                <p className="truncate text-sm font-medium">{new Date(employee.joined).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <IdCard className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">NID Number</p>
                <p className="truncate text-sm font-medium">{employee.nid}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3 sm:col-span-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Present Address</p>
                <p className="text-sm font-medium">{employee.presentAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3 sm:col-span-2">
              <Home className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Permanent Address</p>
                <p className="text-sm font-medium">{employee.permanentAddress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="mb-1 flex items-center gap-2 text-lg font-bold">
            <CalendarDays className="h-5 w-5 text-primary" /> Leaves Taken ({yearLeaves.length})
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            {CURRENT_YEAR} only · resets each January · showing latest first
          </p>
          {yearLeaves.length === 0 ? (
            <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
              No leaves taken yet this year 
            </p>
          ) : (
            <ScrollArea
              className="w-full rounded-xl"
              style={
                yearLeaves.length > VISIBLE_LEAVE_ROWS
                  ? { height: `${leavesListHeightRem(VISIBLE_LEAVE_ROWS)}rem` }
                  : undefined
              }
            >
              <ul className="space-y-2 pr-3">
                {yearLeaves.map((l) => {
                  const m = leaveMeta[l.type];
                  const Icon = m.icon;
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => setOpenLeave(l)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl bg-gradient-mesh px-4 py-2.5 text-left text-sm font-medium transition-bounce hover:-translate-y-0.5 hover:shadow-soft"
                      >
                        <span className="truncate">{formatDate(l.date)}</span>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.chip}`}>
                          <Icon className="h-3 w-3" /> {m.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-3">
          <Stat label="Sick Leave Used" used={employee.sickLeave} total={employee.sickLeaveTotal} tone="secondary" />
        </div>
        <div className="lg:col-span-3">
          <Stat label="Paid Leave Used" used={employee.paidLeave} total={employee.paidLeaveTotal} tone="primary" />
        </div>
        <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-soft lg:col-span-1">
          <p className="text-sm font-medium text-muted-foreground">Unpaid leave this month</p>
          <p className="mt-2 text-2xl font-bold">{currentMonthUnpaidLeaves}</p>
        </div>
      </div>

      {anonymousHrComplaintsAgainst !== undefined && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="mb-2 flex items-center gap-2 text-lg font-bold">
            <MessageSquareWarning className="h-5 w-5 text-destructive" />
            Complaints Against this Employee 
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Reports filed with HR about this employee.
          </p>
          {anonymousHrComplaintsAgainst.length === 0 ? (
            <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
              No complaints on file for this employee.
            </p>
          ) : (
            <ul className="space-y-2">
              {[...anonymousHrComplaintsAgainst]
                .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
                .map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setOpenComplaint(c)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl bg-gradient-mesh px-4 py-2.5 text-left text-sm font-medium transition-bounce hover:-translate-y-0.5 hover:shadow-soft"
                    >
                      <span className="truncate">{c.subject}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(c.filedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={!!openLeave} onOpenChange={(o) => !o && setOpenLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Leave Details
            </DialogTitle>
            <DialogDescription>Full information about this leave entry.</DialogDescription>
          </DialogHeader>
          {openLeave && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-semibold">{formatDate(openLeave.date)}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Leave Type</p>
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${leaveMeta[openLeave.type].chip}`}>
                    {leaveMeta[openLeave.type].label}
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="mt-1 text-sm">{openLeave.reason || "—"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!openComplaint} onOpenChange={(o) => !o && setOpenComplaint(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5 text-primary" /> Complaint
            </DialogTitle>
            <DialogDescription>
              HR-only view. The source of this report is not shown on employee profiles.
            </DialogDescription>
          </DialogHeader>
          {openComplaint && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Subject</p>
                <p className="mt-1 text-sm font-semibold">{openComplaint.subject}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Filed</p>
                <p className="mt-1 text-sm font-semibold">
                  {new Date(openComplaint.filedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Details</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{openComplaint.details}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
