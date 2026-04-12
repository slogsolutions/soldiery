import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface Soldier {
  _id: string;
  name: string;
  armyNumber: string;
  rank?: string;
  unit?: string;
  status: "pending" | "active" | "on_leave" | "inactive";
  isBusy?: boolean;
  currentTask?: { title: string } | null;
}

interface SoldierState {
  soldiers: Soldier[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SoldierState = {
  soldiers: [],
  isLoading: false,
  error: null,
};

const soldierSlice = createSlice({
  name: "soldiers",
  initialState,
  reducers: {
    setSoldiers: (state, action: PayloadAction<Soldier[]>) => {
      state.soldiers = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    updateSoldier: (state, action: PayloadAction<Soldier>) => {
      const idx = state.soldiers.findIndex((s) => s._id === action.payload._id);
      if (idx !== -1) state.soldiers[idx] = action.payload;
    },
    setSoldierLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSoldierError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setSoldiers,
  updateSoldier,
  setSoldierLoading,
  setSoldierError,
} = soldierSlice.actions;
export default soldierSlice.reducer;