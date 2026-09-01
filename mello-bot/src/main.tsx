import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import PanelApp from "./panel/PanelApp";
import OnboardingApp from "./components/onboarding/OnboardingApp";

// Hash routing: one bundle serves all windows.
//   (no hash)  → desktop pet overlay
//   #panel     → habits & settings window
//   #onboarding→ first-run conversational setup
const hash = window.location.hash;

let Root = App;
if (hash === "#panel") Root = PanelApp;
else if (hash === "#onboarding") Root = OnboardingApp;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
