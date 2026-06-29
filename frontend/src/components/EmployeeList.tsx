import { useEffect, useState } from "react";
import { useApp, type Employee } from "@/context/AppContext";
import { type LeaveType } from "@/types/employee";
import { RoleBadge } from "./RoleBadge";
import { EmployeeProfile } from "./EmployeeProfile";
import { AddEmployeeDialog } from "./AddEmployeeDialog";
import { EditEmployeeDialog } from "./EditEmployeeDialog";
import { LeaveDialog } from "./LeaveDialog";
import { HrComplaintsCard } from "./HrComplaintsCard";
import { HrLeavesThisMonthCard } from "./HrLeavesThisMonthCard";
import { SheetConfigManager } from "./SheetConfigManager";
import { LinkboardNavButton } from "./LinkboardNavButton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, ChevronRight, Plane, Stethoscope, CalendarPlus, CalendarX, Search, Trash2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const EmployeeList = ({
  canManageLeave,
  canManageRoster,
}: { canManageLeave: boolean; canManageRoster: boolean }) => {
  const { employees, removeEmployee, currentUser, hrComplaints } = useApp();
  const [selected, setSelected] = useState<Employee | null>(null);
  const [query, setQuery] = useState("");
  const [leaveTarget, setLeaveTarget] = useState<{ emp: Employee; type: LeaveType } | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);

  useEffect(() => {
    if (!selected) return;
    const fresh = employees.find((e) => e.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [employees, selected?.id]);

  const handleRemove = async (emp: Employee) => {
    const ok = await removeEmployee(emp.id);
    if (!ok) {
      toast.error(`Could not remove ${emp.name}. Please try again.`);
      return;
    }
    toast.success(`${emp.name} removed from the roster`);
  };

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.department.toLowerCase().includes(query.toLowerCase())
  );

  const openLeave = (emp: Employee, type: LeaveType) => {
    setLeaveTarget({ emp, type });
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelected(null)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to team
        </Button>
        <EmployeeProfile
          employee={selected}
          anonymousHrComplaintsAgainst={
            currentUser?.role === "hr"
              ? hrComplaints.filter((c) => c.againstEmployeeId === selected.id)
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold">The Team</h2>
          <p className="text-muted-foreground">{employees.length} talented humans making magic happen</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or role…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {canManageRoster && (
            <div className="flex flex-wrap gap-2">
              <AddEmployeeDialog />
              <LinkboardNavButton />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((emp) => (
          <div
            key={emp.id}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-bounce hover:-translate-y-1 hover:shadow-glow"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-primary opacity-0 blur-2xl transition-smooth group-hover:opacity-30" />
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-mesh text-3xl">
                {emp.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-bold">{emp.name}</h3>
                  <RoleBadge role={emp.role} />
                </div>
                <p className="truncate text-sm text-muted-foreground">{emp.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{emp.department}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex gap-3 text-xs">
                <span className="rounded-full bg-muted px-2.5 py-1">
                  🤒 {emp.sickLeave}/{emp.sickLeaveTotal}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1">
                  🌴 {emp.paidLeave}/{emp.paidLeaveTotal}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-between"
                onClick={() => setSelected(emp)}
              >
                View profile <ChevronRight className="h-4 w-4" />
              </Button>

              {canManageLeave && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="bg-gradient-accent text-accent-foreground shadow-soft hover:opacity-90">
                      <CalendarPlus className="mr-1.5 h-4 w-4" /> Leave
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => openLeave(emp, "sick")} className="gap-2">
                      <Stethoscope className="h-4 w-4 text-secondary" /> Sick Leave
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openLeave(emp, "paid")} className="gap-2">
                      <Plane className="h-4 w-4 text-primary" /> Paid Leave
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openLeave(emp, "unpaid")} className="gap-2">
                      <CalendarX className="h-4 w-4 text-muted-foreground" /> Unpaid Leave
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {currentUser?.role === "hr" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-primary hover:bg-primary/10 hover:text-primary"
                  aria-label={`Edit ${emp.name}`}
                  onClick={() => setEditTarget(emp)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}

              {canManageRoster && currentUser?.id !== emp.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${emp.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {emp.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove them from the team roster. You can re-add them later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRemove(emp)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No teammates match "{query}"
        </div>
      )}

      {currentUser?.role === "hr" && (
        <>
          <SheetConfigManager />
          <HrLeavesThisMonthCard />
          <HrComplaintsCard />
        </>
      )}

      <LeaveDialog
        employee={leaveTarget?.emp ?? null}
        type={leaveTarget?.type ?? null}
        open={!!leaveTarget}
        onOpenChange={(o) => !o && setLeaveTarget(null)}
      />

      <EditEmployeeDialog
        employee={editTarget}
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      />
    </div>
  );
};
