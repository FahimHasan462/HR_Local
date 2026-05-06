import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ComplainToHrDialog = ({ open, onOpenChange }: Props) => {
  const { currentUser, employees, submitHrComplaint } = useApp();
  const [againstId, setAgainstId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");

  const choices = employees.filter((e) => e.id !== currentUser?.id);

  useEffect(() => {
    if (open) {
      setAgainstId("");
      setSubject("");
      setDetails("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (!againstId) {
      toast.error("Choose who this complaint is about.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Add a short subject for HR.");
      return;
    }
    if (!details.trim()) {
      toast.error("Describe what happened so HR can help.");
      return;
    }
    submitHrComplaint(againstId, subject.trim(), details.trim());
    toast.success("Your complaint was sent to HR confidentially.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5 text-primary" />
            Complain to HR
          </DialogTitle>
          <DialogDescription>
            Only HR can see this. This is very confidential your Name will not be shared with the person you are complaining about. HR will follow up with you if they need more information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Complain against</Label>
            <Select value={againstId} onValueChange={setAgainstId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose employee…" />
              </SelectTrigger>
              <SelectContent>
                {choices.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="complaint-subject">Subject</Label>
            <Input
              id="complaint-subject"
              placeholder="Short summary for HR"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="complaint-details">Details</Label>
            <Textarea
              id="complaint-details"
              placeholder="Explain what happened, when, and any context HR should know…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} className="bg-gradient-accent text-accent-foreground hover:opacity-90">
            Submit complaint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
