import { FormEvent, useState } from "react";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [nid, setNid] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { ok, data } = await apiFetch<{ message?: string }>("/employees/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          nid,
          presentAddress,
          permanentAddress,
        }),
      });

      if (!ok) {
        toast.error(data?.message ?? "Registration failed.");
        return;
      }

      toast.success(data?.message ?? "Registration successful. Please wait for HR approval.");
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
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-blob" />
      <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-secondary/30 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/30 blur-3xl animate-blob" style={{ animationDelay: "6s" }} />

      <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>
      <div className="relative container flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 backdrop-blur-md shadow-soft">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Skibidy Entertainment</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Create your account
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Enter your details below. After registration, please wait for HR approval.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="w-full max-w-xl space-y-4 rounded-3xl border border-border bg-card/90 p-6 shadow-card backdrop-blur-md"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="register-name">Name</Label>
              <Input
                id="register-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Choose a strong password"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-phone">Number</Label>
              <Input
                id="register-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+8801..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-nid">NID number</Label>
              <Input
                id="register-nid"
                value={nid}
                onChange={(event) => setNid(event.target.value)}
                placeholder="National ID number"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="register-present-address">Present Address</Label>
              <Input
                id="register-present-address"
                value={presentAddress}
                onChange={(event) => setPresentAddress(event.target.value)}
                placeholder="Current address"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="register-permanent-address">Permanent Address</Label>
              <Input
                id="register-permanent-address"
                value={permanentAddress}
                onChange={(event) => setPermanentAddress(event.target.value)}
                placeholder="Permanent address"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Registering…" : "Register"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Register;
