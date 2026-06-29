import { useState } from "react";
import { type Role } from "@/types/employee";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

const empty = {
  name: "",
  role: "artist" as Role,
  title: "",
  department: "",
  email: "",
  phone: "",
  joined: new Date().toISOString().slice(0, 10),
  nid: "",
  presentAddress: "",
  permanentAddress: "",
  sheetName: "",
};

export const AddEmployeeDialog = () => {
  const { addEmployee } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const update = (k: keyof typeof empty, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.email || !form.title) {
      toast.error("Please fill in name, title, and email");
      return;
    }
    const ok = await addEmployee(form);
    if (!ok) {
      toast.error("Could not add employee. Check the server or if the email already exists.");
      return;
    }
    toast.success(`${form.name} added to the team 🎉`);
    setForm(empty);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90">
          <UserPlus className="h-4 w-4" /> Add employee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a new teammate</DialogTitle>
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
          <Field label="Sheet artist name" value={form.sheetName} onChange={(v) => update("sheetName", v)} />
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
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-primary text-primary-foreground">Add employee</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);
