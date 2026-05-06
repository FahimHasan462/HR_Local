import { Sparkles, Palette, Clapperboard, Briefcase } from "lucide-react";
import { Role, roleMeta } from "@/data/employees";
import { useApp } from "@/context/AppContext";
import { ThemeToggle } from "./ThemeToggle";

const roles: { role: Role; icon: typeof Palette; gradient: string }[] = [
  { role: "artist", icon: Palette, gradient: "bg-gradient-primary" },
  { role: "management", icon: Clapperboard, gradient: "bg-gradient-secondary" },
  { role: "hr", icon: Briefcase, gradient: "bg-gradient-accent" },
];

export const Login = () => {
  const { login } = useApp();
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-blob" />
      <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-secondary/30 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/30 blur-3xl animate-blob" style={{ animationDelay: "6s" }} />

      <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>
      <div className="relative container flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 backdrop-blur-md shadow-soft">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Skibidy Entertainment</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
            Welcome to <span className="text-gradient">Information Hub</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
             Home for our wildly creative crew.
          </p>
        </div>

        <div className="grid w-full max-w-4xl gap-5 sm:grid-cols-3">
          {roles.map(({ role, icon: Icon, gradient }) => {
            const meta = roleMeta[role];
            return (
              <button
                key={role}
                onClick={() => login(role)}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-left shadow-card transition-bounce hover:-translate-y-2 hover:shadow-glow"
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 ${gradient}`} />
                <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${gradient} shadow-soft transition-bounce group-hover:scale-110 group-hover:rotate-6`}>
                  <Icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-xl font-bold">{meta.label}</h3>
                  <span className="text-2xl">{meta.emoji}</span>
                </div>
                <p className="text-sm text-muted-foreground">{meta.tagline}</p>
                <div className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
                  Sign in →
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
