import React from "react";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import { useDispatch, useSelector } from "react-redux";

import "./App.css";
import OptionsSelector from "./components/OptionsSelector";
import { Websocket } from "./components/Websocket";
import { actions as tickers } from "./store/tickers";
import { actions, selectors } from "./store/instruments";
import { subscriptionAdd, subscriptionRemove } from "./services/deribit";

function App() {
  const dispatch = useDispatch();
  const instruments = useSelector(selectors.options);

  React.useEffect(() => {
    dispatch(actions.request());
  }, [dispatch]);

  React.useEffect(() => {
    if (!isEmpty(instruments)) {
      const channels = map(
        instruments,
        (x) => `ticker.${x.instrumentName}.100ms`
      );
      subscriptionAdd(channels, (d) => dispatch(tickers.update(d)));
      return () => subscriptionRemove(channels);
    }
    return () => {};
  }, [dispatch, instruments]);

  return (
    <div className="App">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
        <Websocket />
        </div>
        <h3 style={{ margin: '0.5rem'}}>Deribit Option Scanner</h3>
        <div></div>
      </div>

      <OptionsSelector />
    </div>
  );
}

export default App;
