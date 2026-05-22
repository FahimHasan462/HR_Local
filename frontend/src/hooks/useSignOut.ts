import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

/** Clears session and returns to the home route (role-based dashboard / login). */
export const useSignOut = () => {
  const { logout } = useApp();
  const navigate = useNavigate();

  return () => {
    logout();
    navigate("/", { replace: true });
  };
};
