(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  const body = document.body;
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const primaryNav = document.querySelector("[data-primary-nav]");
  const compactNavigation = window.matchMedia("(max-width: 1250px)");
  const fullMobileNavigation = window.matchMedia("(max-width: 1050px)");

  const setMenuState = (open, returnFocus = false) => {
    if (!menuToggle || !primaryNav) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    primaryNav.classList.toggle("is-open", open);
    body.classList.toggle("menu-open", open && fullMobileNavigation.matches);
    if (!open && returnFocus) menuToggle.focus();
  };

  menuToggle?.addEventListener("click", () => {
    setMenuState(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  primaryNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (compactNavigation.matches) setMenuState(false);
    });
  });

  document.addEventListener("click", (event) => {
    if (
      compactNavigation.matches &&
      primaryNav?.classList.contains("is-open") &&
      !event.target.closest("[data-primary-nav]") &&
      !event.target.closest("[data-menu-toggle]")
    ) {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && primaryNav?.classList.contains("is-open")) {
      setMenuState(false, true);
    }
  });

  compactNavigation.addEventListener("change", () => setMenuState(false));

  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
