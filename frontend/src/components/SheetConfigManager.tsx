import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { SheetConfig } from "@/types/todo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type FormState = { project: string; episode: string; sheetUrl: string };

const emptyForm = (): FormState => ({ project: "", episode: "", sheetUrl: "" });

export const SheetConfigManager = () => {
  const [configs, setConfigs] = useState<SheetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SheetConfig | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await apiFetch<SheetConfig[]>("/sheets/config");
    if (ok && Array.isArray(data)) {
      setConfigs(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (config: SheetConfig) => {
    setEditing(config);
    setForm({
      project: config.project,
      episode: config.episode,
      sheetUrl: config.sheetUrl,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.project.trim() || !form.episode.trim() || !form.sheetUrl.trim()) {
      toast.error("Project, episode, and sheet URL are required.");
      return;
    }

    setSubmitting(true);
    const path = editing ? `/sheets/config/${editing._id}` : "/sheets/config";
    const method = editing ? "PUT" : "POST";
    const { ok } = await apiFetch(path, {
      method,
      body: JSON.stringify(form),
    });
    setSubmitting(false);

    if (!ok) {
      toast.error("Could not save sheet config.");
      return;
    }

    toast.success(editing ? "Sheet config updated." : "Sheet config added.");
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { ok } = await apiFetch(`/sheets/config/${id}`, { method: "DELETE" });
    if (!ok) {
      toast.error("Could not delete sheet config.");
      return;
    }
    toast.success("Sheet config deleted.");
    load();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Sheet configs</h3>
          <p className="text-sm text-muted-foreground">
            Link published Google Sheet CSV URLs to projects and episodes.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-gradient-primary text-primary-foreground" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add sheet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit sheet config" : "Add sheet config"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <Field label="Project" value={form.project} onChange={(v) => setForm((f) => ({ ...f, project: v }))} />
              <Field label="Episode" value={form.episode} onChange={(v) => setForm((f) => ({ ...f, episode: v }))} />
              <Field
                label="Published CSV URL"
                value={form.sheetUrl}
                onChange={(v) => setForm((f) => ({ ...f, sheetUrl: v }))}
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={submitting} className="bg-gradient-primary text-primary-foreground">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading configs…
        </div>
      ) : configs.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No sheet configs yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {configs.map((config) => (
            <li key={config._id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">
                  {config.project} · {config.episode}
                </p>
                <p className="truncate text-xs text-muted-foreground">{config.sheetUrl}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(config)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete sheet config?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Removes {config.project} {config.episode} from the to-do feed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(config._id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);
