import "./style.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { Game } from "./Game";

window.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("load", async () => {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <Game />
    </React.StrictMode>
  );
});
window.addEventListener("scroll", (event) => {
  event.preventDefault();
});
