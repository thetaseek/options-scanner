import camelCase from "lodash/camelCase";
import isArray from "lodash/isArray";
import isPlainObject from "lodash/isPlainObject";
import reduce from "lodash/reduce";

// Recursively transform all keys to camelcase
export const transformReply = (r) => {
  if (isPlainObject(r)) {
    return reduce(
      r,
      (result, value, key) => {
        result[camelCase(key)] = transformReply(value);
        return result;
      },
      {}
    );
  }

  // If its a array, transform each element
  if (isArray(r)) {
    return r.map((x) => transformReply(x));
  }

  // Just return base type
  return r;
};

// Manages Deribit websocket and reconnects if stale
export const manageSession = (ws, reconnect = () => {
}) => {
  // Set a timer, if no messages received within interval, refresh connection
  let timer = null;
  const interval = 10 * 1000;
  const allowance = 2000; // Allowance for network

  const resetTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.warn(
        `Connection is stale, no message received in ${interval / 1000} seconds`
      );
      return reconnect();
    }, interval + allowance);
  };

  // Once connection opens, start requesting heartbeats
  ws.addEventListener("open", () => {
    ws.send(
      JSON.stringify({
        method: "public/set_heartbeat",
        params: {
          // Seconds (min is 10s)
          interval: Math.max(parseInt(interval / 1000, 10), 10),
        },
        jsonrpc: "2.0",
        id: Date.now(),
      })
    );
  });

  // When connection closes, remove my timer
  ws.addEventListener("close", () => {
    clearTimeout(timer);
  });

  // Listen for messages
  ws.addEventListener("json", function (event) {
    // Reset timer on new message
    resetTimer();

    // I must respond to test_request messages to keep connection alive
    const message = event.data;
    if (
      message.method === "heartbeat" &&
      message.params.type === "test_request"
    ) {
      ws.send(
        JSON.stringify({
          method: "public/test",
          params: {},
          jsonrpc: "2.0",
          id: Date.now(),
        })
      );
    }
  });
};
