import { createSlice} from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// ─── Types ─────────────────────────────────────────

interface User {
  id: string;
  name: string;
  role: "manager" | "soldier";
  armyNumber: string;
  rank?: string;
  unit?: string;
  status: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

// ─── Initial State ─────────────────────────────────

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
};

// ─── Slice ─────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // ✅ Set user after login
    setAuth: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;

      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.token);
    },

    // ✅ Logout
    logout: (state) => {
      state.user = null;
      state.token = null;

      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;