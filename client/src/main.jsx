// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "react-hot-toast";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster position="bottom-right" toastOptions={{
      style: { background: "#1e1e2f", color: "#fff" },
      success: { iconTheme: { primary: "#22c55e", secondary: "#1e1e2f" } },
      error: { iconTheme: { primary: "#ef4444", secondary: "#1e1e2f" } }
    }} />
  </React.StrictMode>
);
