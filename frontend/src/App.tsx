import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import Index from "./pages/Index.tsx";
import Todo from "./pages/Todo.tsx";
import Profile from "./pages/Profile.tsx";
import Linkboard from "./pages/Linkboard.tsx";
import Register from "./pages/Register.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthenticatedShell } from "./components/AuthenticatedShell.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/todo"
              element={
                <AuthenticatedShell>
                  <Todo />
                </AuthenticatedShell>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthenticatedShell>
                  <Profile />
                </AuthenticatedShell>
              }
            />
            <Route
              path="/linkboard"
              element={
                <AuthenticatedShell>
                  <Linkboard />
                </AuthenticatedShell>
              }
            />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
