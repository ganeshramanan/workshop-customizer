import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import PublicWebsite from "./PublicWebsite.jsx";

const path = window.location.pathname;

const Page = path === "/site" ? PublicWebsite : App;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
