import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// base task — what soldier sees
export interface Task {
  _id: string;
  title: string;
  description?: string;
  isActive: boolean;
   createdBy?: { name: string; rank?: string };  // optional — soldier doesn't get this
  createdAt?: string;                            // optional 
}

// full task — what manager sees (extends base)
export interface FullTask extends Task {
  createdBy: { name: string; rank?: string };
  createdAt: string;
}
interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  isLoading: false,
  error: null,
};

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.unshift(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const idx = state.tasks.findIndex((t) => t._id === action.payload._id);
      if (idx !== -1) state.tasks[idx] = action.payload;
    },
    deactivateTask: (state, action: PayloadAction<string>) => {
      const idx = state.tasks.findIndex((t) => t._id === action.payload);
      if (idx !== -1) state.tasks[idx].isActive = false;
    },
    setTaskLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTaskError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  deactivateTask,
  setTaskLoading,
  setTaskError,
} = taskSlice.actions;
export default taskSlice.reducer;