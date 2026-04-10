import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios";

interface Task {
  _id: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdBy: { name: string; rank?: string };
  createdAt: string;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractError = (payload: unknown): string =>
  typeof payload === "string" ? payload : "An unexpected error occurred";

const getErrMsg = (err: unknown, fallback: string): string =>
  err instanceof Error ? err.message : fallback;

// ─── Manager thunks ──────────────────────────────────────────────────────────

export const fetchAllTasks = createAsyncThunk<Task[]>(
  "tasks/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/manager/tasks");
      return res.data.data as Task[];
    } catch (err: unknown) {
      return rejectWithValue(getErrMsg(err, "Failed to fetch tasks"));
    }
  }
);

export const createTask = createAsyncThunk<Task, { title: string; description?: string }>(
  "tasks/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/manager/tasks", data);
      return res.data.data as Task;
    } catch (err: unknown) {
      return rejectWithValue(getErrMsg(err, "Failed to create task"));
    }
  }
);

export const updateTask = createAsyncThunk<
  Task,
  { id: string; data: { title?: string; description?: string; isActive?: boolean } }
>(
  "tasks/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/manager/tasks/${id}`, data);
      return res.data.data as Task;
    } catch (err: unknown) {
      return rejectWithValue(getErrMsg(err, "Failed to update task"));
    }
  }
);

export const deactivateTask = createAsyncThunk<string, string>(
  "tasks/deactivate",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/manager/tasks/${id}`);
      return id;
    } catch (err: unknown) {
      return rejectWithValue(getErrMsg(err, "Failed to deactivate task"));
    }
  }
);

// ─── Soldier thunks ──────────────────────────────────────────────────────────

export const fetchAvailableTasks = createAsyncThunk<Task[]>(
  "tasks/fetchAvailable",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/soldier/tasks");
      return res.data.data as Task[];
    } catch (err: unknown) {
      return rejectWithValue(getErrMsg(err, "Failed to fetch tasks"));
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchAllTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = extractError(action.payload);
      });

    builder
      .addCase(fetchAvailableTasks.pending, (state) => { state.loading = true; })
      .addCase(fetchAvailableTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchAvailableTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = extractError(action.payload);
      });

    builder
      .addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.tasks.unshift(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = extractError(action.payload);
      });

    builder
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        const idx = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.tasks[idx] = action.payload;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = extractError(action.payload);
      });

    builder
      .addCase(deactivateTask.fulfilled, (state, action: PayloadAction<string>) => {
        const idx = state.tasks.findIndex((t) => t._id === action.payload);
        if (idx !== -1) state.tasks[idx].isActive = false;
      })
      .addCase(deactivateTask.rejected, (state, action) => {
        state.error = extractError(action.payload);
      });
  },
});

export const { clearTaskError } = taskSlice.actions;
export default taskSlice.reducer;