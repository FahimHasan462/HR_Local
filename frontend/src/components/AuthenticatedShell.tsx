import { ReactNode } from "react";
import { AppProvider } from "@/context/AppContext";
import { PostsProvider } from "@/context/PostsContext";

export const AuthenticatedShell = ({ children }: { children: ReactNode }) => (
  <AppProvider>
    <PostsProvider>{children}</PostsProvider>
  </AppProvider>
);
