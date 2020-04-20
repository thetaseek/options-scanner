import orderBy from "lodash/orderBy";
import keyBy from "lodash/keyBy";
import {createSlice} from "@reduxjs/toolkit";
import {call} from "../services/deribit";

// Redux Toolkit allows us to write "mutating" logic in reducers. It
// doesn't actually mutate the state because it uses the Immer library,
// which detects changes to a "draft state" and produces a brand new
// immutable state based off those changes
const slice = createSlice({
  name: "instruments",
  initialState: {
    instruments: {},
  },
  reducers: {
    success: (state, {payload}) => {
      state.instruments = payload;
    },
  },
});

export const actions = {
  request: () => (dispatch) =>
    call({
      method: "public/get_instruments",
      params: {
        currency: "BTC",
        kind: "option",
        expired: false,
      },
    })
      .then((r) => r.result)
      .then((r) =>
        orderBy(
          r,
          ["expirationTimestamp", "strike", "optionType"],
          ["asc", "asc", "asc"]
        )
      )
      .then((r) => keyBy(r, "instrumentName"))
      .then((r) => dispatch(slice.actions.success(r))),
};

export const selectors = {
  instrument: (state) => state.instruments.instruments,
  options: (state) => state.instruments.instruments,
};

export default slice.reducer;
