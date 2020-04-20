import React from "react";
import {useDispatch, useSelector} from "react-redux";

import {actions, selectors} from "../store/websocket";
import socket from "../services/deribit";

export function Websocket() {
  const dispatch = useDispatch();
  React.useEffect(() => {
    socket.open();

    socket.addEventListener("open", () => {
      dispatch(actions.open());
      console.debug("Connection to Deribit opened");
    });

    socket.addEventListener(
      "close",
      () => {
        dispatch(actions.close());
        console.debug("Connection to Deribit closed");
      },
      {once: true}
    );

    return () => {
      console.log("Closing connection to Deribit");
      socket.close();
    };
  }, [dispatch]);
  const isOpen = useSelector(selectors.isOpen);
  const style = {
    backgroundColor: isOpen ? "#7aae1a" : "#ff1111",
    borderRadius: "50%",
    marginRight: "8px",
    display: "inline-block",
    height: "12px",
    width: "12px",
  };

  return (
    <div style={{marginLeft: "4px", marginBottom: "4px"}}>
      <span style={style}/>
      {isOpen ? "Online" : "Connecting..."}
    </div>
  );
}
