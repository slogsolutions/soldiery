import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

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
  isLoading:boolean;
  token:string | null;
}

const initialState: AuthState = {
  user: null, 
  isLoading:true,
  token:null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isLoading = false;
    },

    logout: (state) => {
      state.user = null;
      state.isLoading = false;
    },
  },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;