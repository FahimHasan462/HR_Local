import { useState } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { Login } from "@/components/Login";
import { AppHeader } from "@/components/AppHeader";
import { EmployeeProfile } from "@/components/EmployeeProfile";
import { EmployeeList } from "@/components/EmployeeList";
import { ComplainToHrDialog } from "@/components/ComplainToHrDialog";
import { Button } from "@/components/ui/button";
import { MessageSquareWarning } from "lucide-react";

const Dashboard = () => {
  const { currentUser } = useApp();
  const [complainOpen, setComplainOpen] = useState(false);
  if (!currentUser) return <Login />;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        {currentUser.role === "artist" ? (
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Welcome back,</p>
                <h1 className="text-3xl font-bold">{currentUser.name.split(" ")[0]} 👋</h1>
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 gap-2 border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setComplainOpen(true)}
              >
                <MessageSquareWarning className="h-4 w-4" />
                Complain to HR
              </Button>
            </div>
            <EmployeeProfile employee={currentUser} showLeaveHistory />
            <ComplainToHrDialog open={complainOpen} onOpenChange={setComplainOpen} />
          </div>
        ) : (
          <EmployeeList canManageLeave={currentUser.role === "hr"} canManageRoster={currentUser.role === "hr" || currentUser.role === "management"} />
        )}
      </main>
    </div>
  );
};

const Index = () => (
  <AppProvider>
    <Dashboard />
  </AppProvider>
);

export default Index;
