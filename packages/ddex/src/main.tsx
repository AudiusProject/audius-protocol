import React from "react";
import ReactDOM from "react-dom/client";
import { EnvVarsProvider } from "./providers/EnvVarsProvider.tsx";
import AppWithProviders from "./components/AppWithProviders.tsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EnvVarsProvider>
      <AppWithProviders />
    </EnvVarsProvider>
  </React.StrictMode>,
);
