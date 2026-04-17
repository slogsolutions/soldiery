import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import taskReducer from "./slices/taskSlice";
import assignmentReducer from "./slices/assignmentSlice";
import soldierReducer from "./slices/soldierSlice";
import leaveReducer from "./slices/leaveSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    assignments: assignmentReducer,
    soldiers: soldierReducer,
    leaves: leaveReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;