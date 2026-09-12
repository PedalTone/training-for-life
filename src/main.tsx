import React from "react";
import ReactDOM from "react-dom/client";
import Home from "../app/page";
import "../app/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // The release query forces installed GitHub Pages apps to request the
    // current worker rather than relying on a previously cached redirect-era
    // service-worker response.
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js?release=1.50`, { updateViaCache: "none" }).catch(() => {});
  });
}
