function getDocEl(doc) {
  if (doc && doc.documentElement) return doc.documentElement
  if (typeof document !== 'undefined' && document.documentElement) return document.documentElement
  return null
}

function isApp(doc) {
  const el = getDocEl(doc)
  return !!(el && el.getAttribute("data-rendering-target") == "apps")
}

// These are 'back doors' added on the client, only use for device specific logic
function isAndroid(doc) {
  const el = getDocEl(doc)
  return !!(el && el.getAttribute("data-app-os") == "android")
}

function isIOS(doc) {
  const el = getDocEl(doc)
  return !!(el && el.getAttribute("data-app-os") == "ios")
}

export { isApp, isAndroid, isIOS }