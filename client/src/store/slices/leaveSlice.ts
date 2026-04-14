import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LeaveStatus =
  | "pending_manager"
  | "approved_by_manager"
  | "pending_admin"
  | "approved"
  | "rejected_by_manager"
  | "rejected_by_admin";

export interface Leave {
  _id: string;
  soldier: { _id: string; name: string; armyNumber: string; rank?: string; unit?: string } | string;
  reason: string;
  startDate: string;
  endDate: string;
  originalDays: number;    // soldier's first ask — never changes
  finalDays: number;       // current value after any modifications
  status: LeaveStatus;
  managerNote?: string;
  adminNote?: string;
  modifiedByManager: boolean;
  modifiedByAdmin: boolean;
  reviewedBy?: { name: string; rank?: string };
  approvedBy?: { name: string; rank?: string };
  createdAt: string;
}

interface LeaveState {
  leaves: Leave[];
  isLoading: boolean;
  error: string | null;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: LeaveState = {
  leaves: [],
  isLoading: false,
  error: null,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

const leaveSlice = createSlice({
  name: "leaves",
  initialState,
  reducers: {
    setLeaves: (state, action: PayloadAction<Leave[]>) => {
      state.leaves = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addLeave: (state, action: PayloadAction<Leave>) => {
      state.leaves.unshift(action.payload);
    },
    updateLeave: (state, action: PayloadAction<Leave>) => {
      const idx = state.leaves.findIndex((l) => l._id === action.payload._id);
      if (idx !== -1) state.leaves[idx] = action.payload;
    },
    setLeaveLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setLeaveError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setLeaves, addLeave, updateLeave, setLeaveLoading, setLeaveError } = leaveSlice.actions;
export default leaveSlice.reducer;