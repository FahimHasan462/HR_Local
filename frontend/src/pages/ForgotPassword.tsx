import { FormEvent, useState } from "react";
import { Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { ok, data } = await apiFetch<{ message?: string }>("/employees/forgot-password", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      if (!ok) {
        const err = data as { message?: string; error?: string };
        toast.error(err?.message ?? err?.error ?? "Could not reset password.");
        return;
      }

      toast.success(data?.message ?? "Password updated. You can log in now.");
      navigate("/");
    } catch {
      toast.error("Unable to reach server. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>
      <div className="relative container flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 backdrop-blur-md shadow-soft">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Skibidy Entertainment</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Reset password</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Enter your work email and choose a new password.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-card/90 p-6 shadow-card backdrop-blur-md"
        >
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Recruit.skibidy@gmail.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="forgot-password">New password</Label>
            <Input
              id="forgot-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="forgot-confirm">Confirm new password</Label>
            <Input
              id="forgot-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Updating…" : "Update password"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/" className="font-medium text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
