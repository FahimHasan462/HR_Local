import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export const SheetNameSettings = () => {
  const { currentUser, updateSheetName } = useApp();
  const [value, setValue] = useState(currentUser?.sheetName ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(currentUser?.sheetName ?? "");
  }, [currentUser?.sheetName]);

  if (!currentUser) return null;

  const save = async () => {
    setSaving(true);
    const ok = await updateSheetName(value);
    setSaving(false);
    if (!ok) {
      toast.error("Could not save sheet name.");
      return;
    }
    toast.success("Sheet name saved.");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h3 className="font-semibold">Spreadsheet artist name</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Must match exactly what appears in the Artist column of your project sheets
        (e.g. Shormi(サビハ)).
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="sheet-name">Sheet name</Label>
          <Input
            id="sheet-name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your name as it appears in the sheet"
          />
        </div>
        <Button onClick={save} disabled={saving} className="gap-2 bg-gradient-primary text-primary-foreground">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>
    </div>
  );
};
