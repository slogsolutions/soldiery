import { createSlice } from "@reduxjs/toolkit";
import type { User } from "../user/userSlice";

export interface Request {
    _id:string;
    fromUserId:User;
}

const initialState : Request[] = []

const requestsSlice = createSlice({
    name:"requests",
    initialState,
    reducers:{
        setRequests:(_,action) => {
            return action.payload
        },
        removeRequestFromFeed: (state,action) => {
            const newArr = state.filter((elm) => elm._id != action.payload)
            return newArr
        }
    }
})

export const {setRequests,removeRequestFromFeed} = requestsSlice.actions
export default  requestsSlice.reducer