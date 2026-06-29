import { useEffect, useState } from "react";
import { Employee, useApp } from "@/context/AppContext";
import { asRole, type Role } from "@/types/employee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type FormState = {
  name: string;
  role: Role;
  title: string;
  department: string;
  email: string;
  phone: string;
  joined: string;
  nid: string;
  presentAddress: string;
  permanentAddress: string;
  bio: string;
  sheetName: string;
};

const toForm = (emp: Employee): FormState => ({
  name: emp.name,
  role: asRole(emp.role),
  title: emp.title ?? "",
  department: emp.department ?? "",
  email: emp.email ?? "",
  phone: emp.phone ?? "",
  joined: emp.joined?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  nid: emp.nid ?? "",
  presentAddress: emp.presentAddress ?? "",
  permanentAddress: emp.permanentAddress ?? "",
  bio: emp.bio ?? "",
  sheetName: emp.sheetName ?? "",
});

type Props = {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const EditEmployeeDialog = ({ employee, open, onOpenChange }: Props) => {
  const { updateEmployee } = useApp();
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (employee && open) setForm(toForm(employee));
  }, [employee, open]);

  if (!employee || !form) return null;

  const update = (k: keyof FormState, v: string) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const submit = async () => {
    if (!form.name || !form.email || !form.title) {
      toast.error("Please fill in name, title, and email");
      return;
    }
    const ok = await updateEmployee(employee.id!, form);
    if (!ok) {
      toast.error("Could not update employee. Please try again.");
      return;
    }
    toast.success(`${form.name} updated`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {employee.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Full name" value={form.name} onChange={(v) => update("name", v)} />
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => update("role", v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="artist">🎨 Artist</SelectItem>
                <SelectItem value="management">🎬 Management</SelectItem>
                <SelectItem value="hr">💼 HR</SelectItem>
                <SelectItem value="IT">🖥️ IT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="Job title" value={form.title} onChange={(v) => update("title", v)} />
          <Field label="Department" value={form.department} onChange={(v) => update("department", v)} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} />
          <Field label="Phone number" value={form.phone} onChange={(v) => update("phone", v)} />
          <Field label="Joining date" type="date" value={form.joined} onChange={(v) => update("joined", v)} />
          <Field label="NID number" value={form.nid} onChange={(v) => update("nid", v)} />
          <Field
            label="Sheet artist name"
            value={form.sheetName}
            onChange={(v) => update("sheetName", v)}
            className="space-y-1.5 sm:col-span-2"
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Bio</Label>
            <Textarea rows={2} value={form.bio} onChange={(e) => update("bio", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Present address</Label>
            <Textarea rows={2} value={form.presentAddress} onChange={(e) => update("presentAddress", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Permanent address</Label>
            <Textarea rows={2} value={form.permanentAddress} onChange={(e) => update("permanentAddress", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-primary text-primary-foreground">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({
  label, value, onChange, type = "text", className,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string }) => (
  <div className={className ?? "space-y-1.5"}>
    <Label>{label}</Label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);
