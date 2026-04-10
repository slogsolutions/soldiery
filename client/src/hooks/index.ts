import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) =>
  useSelector(selector);

// useAuth hook
export const useAuth = () => {
  const { user, token, loading, error } = useAppSelector((s) => s.auth);
  return { user, token, loading, error, isAuthenticated: !!token };
};

// useRole hook
export const useRole = () => {
  const { user } = useAppSelector((s) => s.auth);
  return {
    isManager: user?.role === "manager",
    isSoldier: user?.role === "soldier",
    role: user?.role,
  };
};