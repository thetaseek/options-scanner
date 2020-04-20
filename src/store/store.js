import {configureStore, getDefaultMiddleware} from "@reduxjs/toolkit";
import instruments from "./instruments";
import tickers from "./tickers";
import websocket from "./websocket";

export default configureStore({
  middleware: getDefaultMiddleware({
    thunk: true,
    immutableCheck: false,
    serializableCheck: false,
  }),
  reducer: {
    instruments,
    tickers,
    websocket,
  },
});
