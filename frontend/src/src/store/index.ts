import { configureStore } from "@reduxjs/toolkit"; 

export const Store = configureStore({
    reducer : {
        Transctions :   transctionReducer,
    }
})

export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;

