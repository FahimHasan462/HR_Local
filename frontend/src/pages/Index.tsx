import { Link, Navigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { Login } from "@/components/Login";
import { AppHeader } from "@/components/AppHeader";
import { EmployeeList } from "@/components/EmployeeList";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { currentUser } = useApp();
  if (!currentUser) return <Login />;
  if (currentUser.role === "artist" || currentUser.role === "IT") {
    return <Navigate to="/todo" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        {currentUser.role === "management" && (
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5" asChild>
            <Link to="/todo">
              <ChevronLeft className="h-4 w-4" />
              Back to to-do
            </Link>
          </Button>
        )}
        <EmployeeList canManageLeave={currentUser.role === "hr"} canManageRoster={currentUser.role === "hr" || currentUser.role === "management"} />
      </main>
    </div>
  );
};

const Index = () => (
  <AuthenticatedShell>
    <Dashboard />
  </AuthenticatedShell>
);

export default Index;
