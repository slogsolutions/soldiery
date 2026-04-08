import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../user/userSlice";

const initialState:  User[] = []

export const feedSlice = createSlice({
  name: "feed",
  initialState,
  reducers: {
    setFeed: (_, action: PayloadAction<User[]>) => {
      return action.payload;
    },
    removeUserFromFeed: (state, action: PayloadAction<string>) => {
      const newFeed = state.filter((user) => user._id !== action.payload);
      return newFeed;
    },
    addUserBackToFeed:(state,action) =>{
      state.unshift(action.payload)
    }
  },
});

export const { setFeed,removeUserFromFeed,addUserBackToFeed }  = feedSlice.actions
export default feedSlice.reducer