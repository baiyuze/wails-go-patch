import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import Router from "./Router";

const container = document.getElementById("root");

createRoot(container!).render(<Router />);
