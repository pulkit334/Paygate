import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../toolkit/user-redux-toll/user-redux";

export const Store = configureStore({
    reducer: {
        user: userReducer,
    }
})

export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;

