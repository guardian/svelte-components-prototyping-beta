// SSR-safe platform helpers
const docEl = typeof document !== "undefined" ? document.documentElement : null;

function getAttr(name) {
  return docEl ? docEl.getAttribute(name) : null;
}

// Constants evaluate safely on server (default false) and correctly in browser
const isApp = getAttr("data-rendering-target") === "apps";

// These are 'back doors' added on the client, only use for device specific logic
const isAndroid = getAttr("data-app-os") === "android";
const isIOS = getAttr("data-app-os") === "ios";

export { isApp, isAndroid, isIOS }