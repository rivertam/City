import "./style.css";
import * as React from "react";
import * as ReactDOM from "react-dom/client";

import { Game } from "./Game";

window.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("load", async () => {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <Game />
      {/*
      <canvas
        id="lot-boundary-graph"
        style={{
          position: "fixed",
          zIndex: 100,
          right: 0,
          bottom: 0,
          width: 500,
          height: 500,
          backgroundColor: "white",
          objectFit: "contain",
        }}
      ></canvas>
      <canvas
        id="street-graph"
        style={{
          position: "fixed",
          zIndex: 100,
          right: 0,
          bottom: 500,
          width: 500,
          height: 500,
          backgroundColor: "white",
        }}
      ></canvas>
      */}
    </React.StrictMode>
  );
});
window.addEventListener("scroll", (event) => {
  event.preventDefault();
});
