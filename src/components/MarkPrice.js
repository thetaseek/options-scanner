import React from "react";
import {subscriptionAdd, subscriptionRemove} from "../services/deribit";

export function MarkPrice() {
  const [mark, setMark] = React.useState(null);

  React.useEffect(() => {
    const channels = ["deribit_price_index.btc_usd"];
    subscriptionAdd(channels, (d) => setMark(d.price));
    return () => subscriptionRemove(channels);
  }, []);

  return <div>{`Mark Price ${mark}`}</div>;
}
