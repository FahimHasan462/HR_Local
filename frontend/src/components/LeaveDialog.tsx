import { useState, useEffect } from "react";
import { Employee, LeaveType } from "@/data/employees";
import { useApp } from "@/context/AppContext";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, Plane, CalendarX } from "lucide-react";
import { toast } from "sonner";

const typeMeta: Record<LeaveType, { label: string; icon: typeof Stethoscope; chip: string }> = {
  sick: { label: "Sick Leave", icon: Stethoscope, chip: "bg-secondary/15 text-secondary" },
  paid: { label: "Paid Leave", icon: Plane, chip: "bg-primary/15 text-primary" },
  unpaid: { label: "Unpaid Leave", icon: CalendarX, chip: "bg-muted text-muted-foreground" },
};

type Props = {
  employee: Employee | null;
  type: LeaveType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const LeaveDialog = ({ employee, type, open, onOpenChange }: Props) => {
  const { applyLeave } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setDate(today);
      setReason("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!employee || !type) return null;
  const meta = typeMeta[type];
  const Icon = meta.icon;

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error("Please add a reason for the leave.");
      return;
    }
    applyLeave(employee.id, type, reason.trim(), date);
    toast.success(`${meta.label} logged for ${employee.name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" /> Log leave for {employee.name}
          </DialogTitle>
          <DialogDescription>Confirm the date, type, and reason for this leave.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="leave-date">Date</Label>
            <Input
              id="leave-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Leave Type</Label>
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${meta.chip}`}>
              <Icon className="h-4 w-4" /> {meta.label}
            </span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="leave-reason">Reason</Label>
            <Textarea
              id="leave-reason"
              placeholder="Briefly describe the reason for this leave…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-gradient-accent text-accent-foreground hover:opacity-90">
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
