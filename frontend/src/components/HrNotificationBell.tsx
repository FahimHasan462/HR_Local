import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { BonusStatus, HrComplaint } from "@/data/hrComplaints";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, CheckCircle2, Clock, Gift, UserPlus, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

type OpenBonus = {
  notificationId: string;
  subject: string;
  message: string;
  employeeName: string;
  bonusStatus: BonusStatus;
};

const bonusStatusLabel: Record<BonusStatus, string> = {
  pending: "Pending",
  provided: "Provided",
};

export const HrNotificationBell = () => {
  const {
    employees,
    hrComplaints,
    hrNotifications,
    markHrNotificationRead,
    markAllHrNotificationsRead,
    updateBonusStatus,
  } = useApp();
  const [openComplaint, setOpenComplaint] = useState<HrComplaint | null>(null);
  const [openBonus, setOpenBonus] = useState<OpenBonus | null>(null);
  const [bonusSaving, setBonusSaving] = useState(false);
  const [openRegistration, setOpenRegistration] = useState<{ subject: string; message: string; employeeName: string } | null>(null);
  const [openComplaintSummary, setOpenComplaintSummary] = useState<{ subject: string; message: string } | null>(null);

  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const complaintById = useMemo(() => new Map(hrComplaints.map((c) => [c.id, c])), [hrComplaints]);

  const unreadCount = hrNotifications.filter((n) => !n.read).length;

  const sortedNotifications = [...hrNotifications].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  const openFromNotification = (notificationId: string) => {
    const n = hrNotifications.find((x) => x.id === notificationId);
    if (!n) return;
    markHrNotificationRead(notificationId);

    if (n.type === "bonus") {
      const emp = n.employeeId ? byId.get(n.employeeId) : undefined;
      setOpenBonus({
        notificationId: n.id,
        subject: n.subject ?? "Bonus reminder",
        message: n.message ?? "",
        employeeName: emp?.name ?? "Employee",
        bonusStatus: n.bonusStatus ?? "pending",
      });
      return;
    }

    if (n.type === "registration") {
      const emp = n.employeeId ? byId.get(n.employeeId) : undefined;
      setOpenRegistration({
        subject: n.subject ?? "New registration",
        message: n.message ?? "",
        employeeName: emp?.name ?? "New applicant",
      });
      return;
    }

    const c = n.complaintId ? complaintById.get(n.complaintId) : undefined;
    if (c) {
      setOpenComplaint(c);
      return;
    }

    setOpenComplaintSummary({
      subject: n.subject ?? "Complaint",
      message: n.message ?? "Reload the page to see full complaint details.",
    });
  };

  const setBonusStatus = async (status: BonusStatus) => {
    if (!openBonus) return;
    setBonusSaving(true);
    const ok = await updateBonusStatus(openBonus.notificationId, status);
    setBonusSaving(false);
    if (!ok) {
      toast.error("Could not update bonus status.");
      return;
    }
    setOpenBonus((prev) => (prev ? { ...prev, bonusStatus: status } : prev));
    toast.success(status === "provided" ? "Bonus marked as provided." : "Bonus marked as pending.");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative shrink-0" aria-label="HR notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center px-1 text-[10px] leading-none"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))]">
          <DropdownMenuLabel className="flex items-center justify-between gap-2 font-semibold">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs font-normal text-muted-foreground">{unreadCount} unread</span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sortedNotifications.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
          ) : (
            <div className="max-h-[min(24rem,50vh)] overflow-y-auto">
              {sortedNotifications.map((n) => {
                if (n.type === "registration") {
                  const emp = n.employeeId ? byId.get(n.employeeId) : undefined;
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      className={`cursor-pointer flex-col items-start gap-1 px-3 py-3 ${n.read ? "" : "bg-emerald-500/10"}`}
                      onSelect={() => openFromNotification(n.id)}
                    >
                      <p className={`flex w-full items-center gap-1.5 truncate text-sm ${n.read ? "font-medium" : "font-semibold"}`}>
                        <UserPlus className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        {n.subject ?? "New registration"}
                      </p>
                      <p className="w-full text-xs text-muted-foreground">
                        {emp?.name ?? "Pending approval"} · Awaiting HR review
                      </p>
                      <p className="text-[11px] text-muted-foreground">{formatWhen(n.createdAt)}</p>
                    </DropdownMenuItem>
                  );
                }

                if (n.type === "bonus") {
                  const emp = n.employeeId ? byId.get(n.employeeId) : undefined;
                  const status = n.bonusStatus ?? "pending";
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      className={`cursor-pointer flex-col items-start gap-1 px-3 py-3 ${n.read ? "" : "bg-amber-500/10"}`}
                      onSelect={() => openFromNotification(n.id)}
                    >
                      <p className={`flex w-full items-center gap-1.5 truncate text-sm ${n.read ? "font-medium" : "font-semibold"}`}>
                        <Gift className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        {n.subject ?? "Bonus eligible"}
                        <Badge
                          variant={status === "provided" ? "default" : "secondary"}
                          className={`ml-auto shrink-0 text-[10px] ${status === "provided" ? "bg-emerald-600 hover:bg-emerald-600" : "bg-amber-500/20 text-amber-800 hover:bg-amber-500/20 dark:text-amber-200"}`}
                        >
                          {bonusStatusLabel[status]}
                        </Badge>
                      </p>
                      <p className="w-full text-xs text-muted-foreground">
                        {emp?.name ?? "Team member"} · 1-year anniversary
                      </p>
                      <p className="text-[11px] text-muted-foreground">{formatWhen(n.createdAt)}</p>
                    </DropdownMenuItem>
                  );
                }

                const c = n.complaintId ? complaintById.get(n.complaintId) : undefined;
                const from = c ? byId.get(c.complainantId) : undefined;
                const against = c ? byId.get(c.againstEmployeeId) : undefined;
                return (
                  <DropdownMenuItem
                    key={n.id}
                    className={`cursor-pointer flex-col items-start gap-1 px-3 py-3 ${n.read ? "" : "bg-primary/5"}`}
                    onSelect={() => openFromNotification(n.id)}
                  >
                    <p className={`flex w-full items-center gap-1.5 truncate text-sm ${n.read ? "font-medium" : "font-semibold"}`}>
                      <MessageSquareWarning className="h-3.5 w-3.5 shrink-0 text-destructive" />
                      {c?.subject ?? n.subject ?? "Complaint"}
                    </p>
                    <p className="w-full text-xs text-muted-foreground">
                      {c
                        ? `${from?.name ?? "Unknown"} → ${against?.name ?? "Unknown"}`
                        : "Confidential complaint"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatWhen(n.createdAt)}</p>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
          {sortedNotifications.length > 0 && unreadCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer justify-center text-center text-xs text-muted-foreground"
                onSelect={() => markAllHrNotificationsRead()}
              >
                Mark all as read
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!openComplaint} onOpenChange={(o) => !o && setOpenComplaint(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Complaint details</DialogTitle>
            <DialogDescription>Full record visible to HR only.</DialogDescription>
          </DialogHeader>
          {openComplaint && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Filed by</p>
                  <p className="font-semibold">{byId.get(openComplaint.complainantId)?.name ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Against</p>
                  <p className="font-semibold">{byId.get(openComplaint.againstEmployeeId)?.name ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Filed</p>
                  <p className="font-semibold">{formatWhen(openComplaint.filedAt)}</p>
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Subject</p>
                <p className="mt-1 font-semibold">{openComplaint.subject}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Details</p>
                <p className="mt-1 whitespace-pre-wrap">{openComplaint.details}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!openRegistration} onOpenChange={(o) => !o && setOpenRegistration(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              New registration
            </DialogTitle>
            <DialogDescription>Approve this applicant in the team roster when ready.</DialogDescription>
          </DialogHeader>
          {openRegistration && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <p className="text-xs text-muted-foreground">Applicant</p>
                <p className="font-semibold">{openRegistration.employeeName}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Summary</p>
                <p className="mt-1 font-semibold">{openRegistration.subject}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Details</p>
                <p className="mt-1 whitespace-pre-wrap">{openRegistration.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!openComplaintSummary} onOpenChange={(o) => !o && setOpenComplaintSummary(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Complaint notification</DialogTitle>
            <DialogDescription>Refresh the dashboard to load the full complaint record.</DialogDescription>
          </DialogHeader>
          {openComplaintSummary && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Subject</p>
                <p className="mt-1 font-semibold">{openComplaintSummary.subject}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Note</p>
                <p className="mt-1">{openComplaintSummary.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!openBonus} onOpenChange={(o) => !o && setOpenBonus(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              Bonus reminder
              {openBonus && (
                <Badge
                  variant={openBonus.bonusStatus === "provided" ? "default" : "secondary"}
                  className={
                    openBonus.bonusStatus === "provided"
                      ? "bg-emerald-600 hover:bg-emerald-600"
                      : "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                  }
                >
                  {bonusStatusLabel[openBonus.bonusStatus]}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Mark whether the anniversary bonus has been provided or is still pending.
            </DialogDescription>
          </DialogHeader>
          {openBonus && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-amber-500/10 p-3">
                <p className="text-xs text-muted-foreground">Employee</p>
                <p className="font-semibold">{openBonus.employeeName}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Summary</p>
                <p className="mt-1 font-semibold">{openBonus.subject}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Details</p>
                <p className="mt-1 whitespace-pre-wrap">{openBonus.message}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-600/90"
                  disabled={bonusSaving || openBonus.bonusStatus === "provided"}
                  onClick={() => setBonusStatus("provided")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as provided
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={bonusSaving || openBonus.bonusStatus === "pending"}
                  onClick={() => setBonusStatus("pending")}
                >
                  <Clock className="h-4 w-4" />
                  Mark as pending
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
