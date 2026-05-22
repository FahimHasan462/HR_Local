import { LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { useSignOut } from "@/hooks/useSignOut";
import { RoleBadge } from "./RoleBadge";
import { ThemeToggle } from "./ThemeToggle";
import { HrNotificationBell } from "./HrNotificationBell";

export const AppHeader = () => {
  const { currentUser } = useApp();
  const signOut = useSignOut();
  if (!currentUser) return null;

  const initial = currentUser.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Skibidy Entertainment</h1>
            <p className="text-xs text-muted-foreground leading-tight">Information Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary sm:hidden"
            aria-hidden
          >
            {initial}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser.title}</p>
          </div>
          <RoleBadge role={currentUser.role} />
          <ThemeToggle />
          {currentUser.role === "hr" && <HrNotificationBell />}
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
