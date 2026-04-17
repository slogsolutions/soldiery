import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  name: string;
  armyNumber: string;
  rank?: string;
  unit?: string;
  role: "admin" | "manager" | "soldier";
  manager?: string;
  status?: "active" | "inactive";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token") ?? null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) state.error = null;
    },
    setUser: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLoading = false;
      state.error = null;
      localStorage.setItem("token", action.payload.token);
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.isLoading = false;
      localStorage.removeItem("token");
    },
  },
});

export const { setUser, setLoading, setError, clearError, logout } =
  authSlice.actions;

export default authSlice.reducer;