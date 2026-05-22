import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { type LeaveRecord, type LeaveType } from "@/types/employee";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, ChevronRight, Plane, Stethoscope, CalendarX } from "lucide-react";

type MonthLeaveEntry = LeaveRecord & { employeeId: string; employeeName: string };

const leaveMeta: Record<LeaveType, { label: string; icon: typeof Stethoscope; chip: string }> = {
  sick: { label: "Sick", icon: Stethoscope, chip: "bg-secondary/15 text-secondary" },
  paid: { label: "Paid", icon: Plane, chip: "bg-primary/15 text-primary" },
  unpaid: { label: "Unpaid", icon: CalendarX, chip: "bg-muted text-muted-foreground" },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const monthLabel = () =>
  new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });


const LEAVE_ROW_HEIGHT_REM = 4;

const LEAVE_ROW_GAP_REM = 0.5;
const VISIBLE_LEAVE_ROWS = 6;

const leavesListHeightRem = (rows: number) =>
  rows * LEAVE_ROW_HEIGHT_REM + Math.max(0, rows - 1) * LEAVE_ROW_GAP_REM;

export const HrLeavesThisMonthCard = () => {
  const { employees } = useApp();
  const [openLeave, setOpenLeave] = useState<MonthLeaveEntry | null>(null);

  const leavesThisMonth = useMemo((): MonthLeaveEntry[] => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    return employees
      .flatMap((emp) =>
        emp.leaves
          .filter((l) => {
            const d = new Date(l.date);
            return d.getFullYear() === year && d.getMonth() === month;
          })
          .map((l) => ({
            ...l,
            employeeId: emp.id,
            employeeName: emp.name,
          })),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [employees]);

  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">Leaves Taken By Employees</CardTitle>
            <CardDescription>
              {monthLabel()} 
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {leavesThisMonth.length === 0 ? (
          <p className="rounded-xl bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
            No leave recorded this month yet.
          </p>
        ) : (
          <ScrollArea
            className="w-full rounded-xl"
            style={
              leavesThisMonth.length > VISIBLE_LEAVE_ROWS
                ? { height: `${leavesListHeightRem(VISIBLE_LEAVE_ROWS)}rem` }
                : undefined
            }
          >
            <ul className="space-y-2 pr-3">
              {leavesThisMonth.map((l) => {
                const meta = leaveMeta[l.type];
                return (
                  <li key={`${l.employeeId}-${l.id}`}>
                    <button
                      type="button"
                      onClick={() => setOpenLeave(l)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm transition-bounce hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{l.employeeName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDate(l.date)}
                          {" · "}
                          <span className="font-medium text-foreground">{meta.label} leave</span>
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

      <Dialog open={!!openLeave} onOpenChange={(o) => !o && setOpenLeave(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave details</DialogTitle>
            <DialogDescription>Full record visible to HR only.</DialogDescription>
          </DialogHeader>
          {openLeave && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Employee</p>
                  <p className="font-semibold">{openLeave.employeeName}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Leave type</p>
                  <p className="font-semibold">{leaveMeta[openLeave.type].label}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold">{formatDate(openLeave.date)}</p>
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="mt-1 whitespace-pre-wrap">{openLeave.reason || "—"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
