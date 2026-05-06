import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { HrComplaint } from "@/data/hrComplaints";
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
import { Bell } from "lucide-react";

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const HrNotificationBell = () => {
  const {
    employees,
    hrComplaints,
    hrComplaintNotifications,
    markHrComplaintNotificationRead,
    markAllHrComplaintNotificationsRead,
  } = useApp();
  const [openComplaint, setOpenComplaint] = useState<HrComplaint | null>(null);

  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const complaintById = useMemo(() => new Map(hrComplaints.map((c) => [c.id, c])), [hrComplaints]);

  const unreadCount = hrComplaintNotifications.filter((n) => !n.read).length;

  const sortedNotifications = [...hrComplaintNotifications].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  const openFromNotification = (complaintId: string) => {
    const c = complaintById.get(complaintId);
    if (!c) return;
    markHrComplaintNotificationRead(complaintId);
    setOpenComplaint(c);
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
              {sortedNotifications.flatMap((n) => {
                const c = complaintById.get(n.complaintId);
                if (!c) return [];
                const from = byId.get(c.complainantId);
                const against = byId.get(c.againstEmployeeId);
                return [
                  <DropdownMenuItem
                    key={n.id}
                    className={`cursor-pointer flex-col items-start gap-1 px-3 py-3 ${n.read ? "" : "bg-primary/5"}`}
                    onSelect={() => openFromNotification(c.id)}
                  >
                    <p className={`w-full truncate text-sm ${n.read ? "font-medium" : "font-semibold"}`}>{c.subject}</p>
                    <p className="w-full text-xs text-muted-foreground">
                      {from?.name ?? "Unknown"} → {against?.name ?? "Unknown"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatWhen(n.createdAt)}</p>
                  </DropdownMenuItem>,
                ];
              })}
            </div>
          )}
          {sortedNotifications.length > 0 && unreadCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer justify-center text-center text-xs text-muted-foreground"
                onSelect={() => markAllHrComplaintNotificationsRead()}
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
    </>
  );
};
