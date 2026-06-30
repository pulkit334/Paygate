import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../toolkit/user-redux-toll/user-redux";
import dashboardReducer from "../toolkit/dashboard/dashboard-slice";

export const Store = configureStore({
    reducer: {
        user: userReducer,
        dashboard: dashboardReducer,
    }
})

export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;

