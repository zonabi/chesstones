import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChessTones } from "@/components";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <ChessTones />
  </StrictMode>
);
