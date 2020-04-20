import {createSlice} from "@reduxjs/toolkit";

const slice = createSlice({
  name: "websocket",
  initialState: {
    isOpen: false,
  },
  reducers: {
    open: (state) => {
      state.isOpen = true;
    },
    close: (state) => {
      state.isOpen = false;
    },
  },
});

export const actions = slice.actions;

export const selectors = {
  isOpen: (state) => state.websocket.isOpen,
};

export default slice.reducer;
