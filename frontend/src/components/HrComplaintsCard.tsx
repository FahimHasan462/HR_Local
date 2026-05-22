import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { HrComplaint } from "@/data/hrComplaints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ChevronRight, ShieldAlert } from "lucide-react";

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

/** py-3 row with subject + metadata (two lines) */
const COMPLAINT_ROW_HEIGHT_REM = 4;
/** matches space-y-2 between list items */
const COMPLAINT_ROW_GAP_REM = 0.5;
const VISIBLE_COMPLAINT_ROWS = 6;

const complaintsListHeightRem = (rows: number) =>
  rows * COMPLAINT_ROW_HEIGHT_REM + Math.max(0, rows - 1) * COMPLAINT_ROW_GAP_REM;

export const HrComplaintsCard = () => {
  const { employees, hrComplaints, hrNotifications, markHrNotificationRead } = useApp();
  const [openComplaint, setOpenComplaint] = useState<HrComplaint | null>(null);

  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const sorted = [...hrComplaints].sort((a, b) => b.filedAt.localeCompare(a.filedAt));

  return (
    <>
      <Card className="border-border shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">HR complaints</CardTitle>
              <CardDescription>
                Confidential submissions from staff.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="rounded-xl bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
              No complaints filed yet.
            </p>
          ) : (
            <ScrollArea
              className="w-full rounded-xl"
              style={
                sorted.length > VISIBLE_COMPLAINT_ROWS
                  ? { height: `${complaintsListHeightRem(VISIBLE_COMPLAINT_ROWS)}rem` }
                  : undefined
              }
            >
              <ul className="space-y-2 pr-3">
              {sorted.map((c) => {
                const from = byId.get(c.complainantId);
                const against = byId.get(c.againstEmployeeId);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const notification = hrNotifications.find((n) => n.complaintId === c.id);
                        if (notification) markHrNotificationRead(notification.id);
                        setOpenComplaint(c);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm transition-bounce hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{c.subject}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          From <span className="font-medium text-foreground">{from?.name ?? "Unknown"}</span>
                          {" · "}
                          Against <span className="font-medium text-foreground">{against?.name ?? "Unknown"}</span>
                          {" · "}
                          {formatWhen(c.filedAt)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

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
