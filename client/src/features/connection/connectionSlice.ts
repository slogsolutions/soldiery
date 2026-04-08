import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../user/userSlice";

const initialState: User[] = [];

const connectionSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {
    setConnections: (_, action: PayloadAction<User[]>) => action.payload,
    removeConnection:(state,action: PayloadAction<string>)=> 
      state.filter((user)=> user._id !== action.payload),
  },

});

export const { setConnections,removeConnection } = connectionSlice.actions;

export default connectionSlice.reducer;
