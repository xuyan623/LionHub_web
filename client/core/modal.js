import { state } from "./state.js";
import { renderApp } from "../render/core.js";

/**
 * Modal stack manager for multi-level overlay navigation.
 * Use pushModal() when opening a new overlay from within another overlay.
 * Use replaceModal() when switching the current overlay in-place (no back target).
 * popModal() restores the previous overlay from the stack.
 * clearModalStack() closes all overlays.
 */

export function pushModal(nextModal) {
  if (state.modal) {
    state.modalStack.push(state.modal);
  }
  state.modal = nextModal;
  renderApp();
}

export function replaceModal(nextModal) {
  state.modal = nextModal;
  renderApp();
}

export function popModal() {
  if (state.modalStack.length > 0) {
    state.modal = state.modalStack.pop();
  } else {
    state.modal = null;
  }
  window.scrollTo(0, state.modalScrollY || 0);
  renderApp();
}

export function clearModalStack() {
  state.modalStack = [];
  state.modal = null;
  renderApp();
}

export function isModalOpen() {
  return Boolean(state.modal);
}
