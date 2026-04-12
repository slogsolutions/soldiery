import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface Assignment {
  _id: string;
  soldier: { _id: string; name: string; rank?: string; armyNumber: string };
  task: { _id: string; title: string; description?: string };
  startTime: string;
  endTime: string;
  status: "upcoming" | "active" | "pending_review" | "completed" | "rejected";
  createdBy: "manager" | "soldier";
  assignedBy?: { name: string; rank?: string };
  notes?: string;
  priority?: "low" | "medium" | "high";
  location?: string;
  createdAt: string;
}

interface AssignmentState {
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AssignmentState = {
  assignments: [],
  isLoading: false,
  error: null,
};

const assignmentSlice = createSlice({
  name: "assignments",
  initialState,
  reducers: {
    setAssignments: (state, action: PayloadAction<Assignment[]>) => {
      state.assignments = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addAssignment: (state, action: PayloadAction<Assignment>) => {
      state.assignments.unshift(action.payload);
    },
    updateAssignment: (state, action: PayloadAction<Assignment>) => {
      const idx = state.assignments.findIndex((a) => a._id === action.payload._id);
      if (idx !== -1) state.assignments[idx] = action.payload;
    },
    setAssignmentLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAssignmentError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setAssignments,
  addAssignment,
  updateAssignment,
  setAssignmentLoading,
  setAssignmentError,
} = assignmentSlice.actions;
export default assignmentSlice.reducer;