import { createRoot } from "react-dom/client";
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router";
import { nanoid } from "nanoid";

import { TableView } from "./views/TableView";
import { HandView } from "./views/HandView";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      {/* Redirect root to a new table session */}
      <Route path="/" element={<Navigate to={`/table/${nanoid()}`} />} />

      {/* Game views */}
      <Route path="/table/:sessionId" element={<TableView />} />
      <Route path="/hand/:sessionId" element={<HandView />} />

      {/* Catch-all fallback */}
      <Route path="*" element={<p>404 – Not Found</p>} />
    </Routes>
  </BrowserRouter>
);