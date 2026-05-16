import { initialize, ensureDatabaseReady } from "./database.js";
import { loadModalChunk, loadRouteChunk, loadWorkspaceRuntime } from "./runtime-loader.js";
import { renderApp } from "../render/core.js";

export function bootstrapApp() {
  initialize();
  renderApp();
}

export { ensureDatabaseReady, loadModalChunk, loadRouteChunk, loadWorkspaceRuntime };
