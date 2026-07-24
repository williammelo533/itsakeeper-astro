const agentationClientScript = `
import React from "react";
import { createRoot } from "react-dom/client";
import { Agentation } from "agentation";

const mountAgentation = () => {
  if (document.querySelector("[data-agentation-mount]")) return;

  const container = document.createElement("div");
  container.dataset.agentationMount = "";
  document.body.append(container);

  createRoot(container).render(React.createElement(Agentation));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAgentation, { once: true });
} else {
  mountAgentation();
}
`;

export default function agentationDev() {
  return {
    name: "agentation-dev",
    hooks: {
      "astro:config:setup": ({ command, injectScript }) => {
        if (command === "dev") {
          injectScript("page", agentationClientScript);
        }
      },
    },
  };
}
