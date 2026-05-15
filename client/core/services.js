let _pushFlash = () => {};
let _renderApp = () => {};

export function pushFlash(message, tone = "info") {
  _pushFlash(message, tone);
}

export function renderApp() {
  _renderApp();
}

export function setServices(services) {
  if (services.pushFlash) _pushFlash = services.pushFlash;
  if (services.renderApp) _renderApp = services.renderApp;
}
