import castArray from "lodash/castArray";
import isArray from "lodash/isArray";
import ReconnectingWebsocket from "./reconnecting-websocket";
import {manageSession, transformReply} from "./deribit-utils";

const url =
  process.env.NODE_ENV === "production"
    ? "wss://www.deribit.com/ws/api/v2"
    : "wss://test.deribit.com/ws/api/v2";

const socket = new ReconnectingWebsocket(url, null, {
  automaticOpen: false,
});

socket.addEventListener("message", (event) => {
  const e = new CustomEvent("json");
  e.data = transformReply(JSON.parse(event.data));
  socket.dispatchEvent(e);
});

manageSession(socket, socket.refresh);

// Manage subscriptions

// Key is the channel, value is function handler
const subscriptions = {};
socket.addEventListener("open", (event) => {
  socket.send(
    JSON.stringify({
      method: "public/subscribe",
      params: {
        channels: Object.keys(subscriptions),
      },
      jsonrpc: "2.0",
      id: Date.now(),
    })
  );
});

socket.addEventListener("json", (event) => {
  const message = event.data;
  if (message.method === "subscription") {
    const {channel, data} = message.params;
    if (subscriptions[channel]) {
      subscriptions[channel](data);
    } else {
      console.log("Ignoring subscription: ", channel);
    }
  }
});

export const subscriptionAdd = (channelArg, handler) => {
  const channels = castArray(channelArg);
  channels.forEach((channel, i) => {
    subscriptions[channel] = isArray(handler) ? handler[i] : handler;
  });

  const payload = JSON.stringify({
    method: "public/subscribe",
    params: {
      channels,
    },
    jsonrpc: "2.0",
    id: Date.now(),
  });

  // If connection is open send, otherwise wait for connection to open;
  if (socket.readyState === 1) {
    socket.send(payload);
  } else {
    // Connection opened
    socket.addEventListener("open", () => socket.send(payload), {
      once: true,
    });
  }
};

export const subscriptionRemove = (channelArg) => {
  const channels = castArray(channelArg);
  channels.forEach((channel) => {
    delete channels[channel];
  });
  const payload = JSON.stringify({
    method: "public/unsubscribe",
    params: {
      channels,
    },
    jsonrpc: "2.0",
    id: Date.now(),
  });

  // If connection is open send, otherwise wait for connection to open;
  if (socket.readyState === 1) {
    socket.send(payload);
  } else {
    // Connection opened
    socket.addEventListener("open", () => socket.send(payload), {
      once: true,
    });
  }
};

// Function to make a rpc call over ws. Will resolve with response
export const call = (request, {timeout = 10000} = {}) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(reject, timeout, new Error("Call timed out"));

    const id = Date.now();
    const payload = JSON.stringify({
      method: request.method,
      params: request.params,
      jsonrpc: "2.0",
      id,
    });

    function callback(event) {
      const message = event.data;
      if (message.id === id) {
        socket.removeEventListener("message", callback);
        clearTimeout(timer);
        return resolve(message);
      }
    }

    // If connection is open send, otherwise wait for connection to open;
    if (socket.readyState === 1) {
      socket.send(payload);
    } else {
      // Connection opened
      socket.addEventListener("open", () => socket.send(payload), {
        once: true,
      });
    }

    socket.addEventListener("json", callback);
  });

export default socket;
