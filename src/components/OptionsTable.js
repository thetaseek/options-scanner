import React from "react";
import groupBy from "lodash/groupBy";
import map from "lodash/map";
import {useSelector, useDispatch} from "react-redux";

import {actions as tickers} from "../store/tickers";
import {actions, selectors} from "../store/instruments";
import {subscriptionAdd, subscriptionRemove} from "../services/deribit";
import {tickerSelectorFactory} from "../store/tickers";

const Option = ({instrumentName}) => {
  const selector = tickerSelectorFactory(instrumentName);
  const data = useSelector(selector);
  return (
    <>
      <td>{data.bestBidAmount || "-"}</td>
      <td>{data.bestBidPrice || "-"}</td>
      <td>{data.bestAskPrice || "-"}</td>
      <td>{data.bestAskAmount || "-"}</td>
    </>
  );
};

export function OptionsTable() {
  const dispatch = useDispatch();
  const all = useSelector(selectors.instruments);

  const expiry = Math.min(...all.map((x) => x.expirationTimestamp));
  const instruments = all.filter((x) => x.expirationTimestamp === expiry);

  const rows = groupBy(instruments, "strike");

  React.useEffect(() => {
    dispatch(actions.request());
  }, [dispatch]);

  React.useEffect(() => {
    if (instruments.length > 0) {
      const channels = instruments.map((x) => `ticker.${x.instrumentName}.raw`);
      subscriptionAdd(channels, (d) => dispatch(tickers.update(d)));
      return () => subscriptionRemove(channels);
    }
    return () => {
    };
  }, [dispatch, instruments]);

  return (
    <div>
      <h6>{new Date(expiry).toUTCString()}</h6>
      <table cellPadding="10">
        <thead>
        <tr>
          <th>Size</th>
          <th>Bid</th>
          <th>Ask</th>
          <th>Size</th>
          <th>Strike</th>
          <th>Size</th>
          <th>Bid</th>
          <th>Ask</th>
          <th>Size</th>
        </tr>
        </thead>
        <tbody>
        {map(rows, (data, s) => {
          const call = data.find((x) => x.optionType === "call")
            .instrumentName;
          const put = data.find((x) => x.optionType === "put").instrumentName;
          return (
            <tr key={s}>
              <Option instrumentName={call}/>
              <td>{` ${s} `}</td>
              <Option instrumentName={put}/>
            </tr>
          );
        })}
        </tbody>
      </table>
    </div>
  );
}
