import { createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios";

interface Soldier {
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
  loading: boolean;
  error: string | null;
}

const initialState: SoldierState = {
  soldiers: [],
  loading: false,
  error: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// RTK rejectWithValue payload comes in as unknown, this safely extracts a message
const extractError = (payload: unknown): string =>
  typeof payload === "string" ? payload : "An unexpected error occurred";

// Axios interceptor always converts errors to plain Error objects, so err.message is safe
const getErrMsg = (err: unknown, fallback: string): string =>
  err instanceof Error ? err.message : fallback;

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const fetchAllSoldiers = createAsyncThunk<Soldier[], string | undefined>(
  "soldiers/fetchAll",
  async (status = "", { rejectWithValue }) => {
    try {
      const query = status ? `?status=${status}` : "";
      const res = await api.get(`/manager/soldiers${query}`);
      return res.data.data as Soldier[];
    } catch (err: unknown) {
      return rejectWithValue(getErrMsg(err, "Failed to fetch soldiers"));
    }
  }
);

export const approveSoldier = createAsyncThunk<Soldier, string>(
  "soldiers/approve",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/manager/soldiers/${id}/approve`);
      return res.data.data as Soldier;
    } catch (err: unknown) {
      return rejectWithValue(getErrMsg(err, "Failed to approve soldier"));
    }
  }
);

export const updateSoldierStatus = createAsyncThunk<
  Soldier,
  { id: string; status: string }
>(
  "soldiers/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/manager/soldiers/${id}/status`, { status });
      return res.data.data as Soldier;
    } catch (err: unknown) {
      return rejectWithValue(getErrMsg(err, "Failed to update status"));
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const soldierSlice = createSlice({
  name: "soldiers",
  initialState,
  reducers: {
    clearSoldierError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSoldiers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSoldiers.fulfilled, (state, action: PayloadAction<Soldier[]>) => {
        state.loading = false;
        state.soldiers = action.payload;
      })
      .addCase(fetchAllSoldiers.rejected, (state, action) => {
        state.loading = false;
        // action.payload is unknown — extractError narrows it safely
        state.error = extractError(action.payload);
      });

    builder
      .addCase(approveSoldier.fulfilled, (state, action: PayloadAction<Soldier>) => {
        const idx = state.soldiers.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.soldiers[idx] = action.payload;
      })
      .addCase(approveSoldier.rejected, (state, action) => {
        state.error = extractError(action.payload);
      });

    builder
      .addCase(updateSoldierStatus.fulfilled, (state, action: PayloadAction<Soldier>) => {
        const idx = state.soldiers.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.soldiers[idx] = action.payload;
      })
      .addCase(updateSoldierStatus.rejected, (state, action) => {
        state.error = extractError(action.payload);
      });
  },
});

export const { clearSoldierError } = soldierSlice.actions;
export default soldierSlice.reducer;