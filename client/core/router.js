import { state, routes } from "./state.js";
import { renderApp } from "../render/core.js";
import { popModal, clearModalStack, isModalOpen } from "./modal.js";

let _initialized = false;

export function initRouter() {
  if (_initialized) return;
  _initialized = true;

  window.addEventListener("popstate", (event) => {
    if (isModalOpen()) {
      // Back button with modal open: close modal, preserve current route in history
      popModal();
      // Push the current route back so next back changes route instead of closing modal
      const currentRoute = state.route;
      history.pushState({ route: currentRoute, modal: false }, "", `#${currentRoute}`);
      renderApp();
      return;
    }

    const route = _readHashRoute();
    if (route && route !== state.route) {
      _applyRoute(route, { pushState: false });
    }
  });
}

export function navigateTo(routeId, options = {}) {
  const { clearModals = true, pushState = true } = options;
  if (clearModals) {
    clearModalStack();
  }
  _applyRoute(routeId, { pushState });
}

export function goBack() {
  history.back();
}

export function currentRoute() {
  return state.route;
}

function _readHashRoute() {
  const hash = window.location.hash.replace("#", "").trim();
  return routes.some((route) => route.id === hash) ? hash : "";
}

function _applyRoute(routeId, { pushState = true } = {}) {
  state.route = routeId;
  state.mobileNavOpen = false;
  state.loadingRoute = true;

  if (pushState && window.location.hash !== `#${routeId}`) {
    history.pushState({ route: routeId, modal: false }, "", `#${routeId}`);
  }

  renderApp();
  requestAnimationFrame(() => {
    state.loadingRoute = false;
  });
}
