import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface User {
  _id : string;
  firstName: string;
  emailId:string;
  lastName: string;
  about?:string;
  skills?:string[];
  photoUrl?:string;
  email?: string;
  gender: string;
  links?:SocialLinks;
  futureInterests?:string[];
}

const initialState = null as User | null;

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addUser: (_, action: PayloadAction<User>) => {
      return action.payload;
    },
    removeUser: () => {
      return null;
    },
  },
});

export const { addUser, removeUser } = userSlice.actions;

export default userSlice.reducer;
