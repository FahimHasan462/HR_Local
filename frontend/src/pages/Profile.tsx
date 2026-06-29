import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { AppHeader } from "@/components/AppHeader";
import { EmployeeProfile } from "@/components/EmployeeProfile";
import { ComplainToHrDialog } from "@/components/ComplainToHrDialog";
import { SheetNameSettings } from "@/components/SheetNameSettings";
import { LinkboardNavButton } from "@/components/LinkboardNavButton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquareWarning } from "lucide-react";

const Profile = () => {
  const { currentUser } = useApp();
  const [complainOpen, setComplainOpen] = useState(false);

  if (!currentUser) return <Navigate to="/" replace />;
  if (currentUser.role === "hr") return <Navigate to="/" replace />;

  const backHref = currentUser.role === "management" ? "/" : "/todo";
  const backLabel = currentUser.role === "management" ? "Back to dashboard" : "Back to to-do";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mx-auto max-w-5xl">
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5" asChild>
            <Link to={backHref}>
              <ChevronLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Welcome back,</p>
              <h1 className="text-3xl font-bold">{currentUser.name}</h1>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <LinkboardNavButton />
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setComplainOpen(true)}
              >
                <MessageSquareWarning className="h-4 w-4" />
                Complain to HR
              </Button>
            </div>
          </div>
          <div className="mb-6 space-y-6">
            <SheetNameSettings />
          </div>
          <EmployeeProfile employee={currentUser} showLeaveHistory />
          <ComplainToHrDialog open={complainOpen} onOpenChange={setComplainOpen} />
        </div>
      </main>
    </div>
  );
};

export default Profile;
