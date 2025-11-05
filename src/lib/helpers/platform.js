// Once the DCAR migration is complete the class checks can be removed
// and the code can be simplified to just check the data attributes.

const isAndroid = (doc = document) => {
  if (typeof doc === 'undefined') return false;
  return doc.documentElement.attributes["data-app-os"] == "android" ||
    doc.body.classList.contains("android");
}

const isIOS = (doc = document) => {
  if (typeof doc === 'undefined') return false;
  return doc.documentElement.attributes["data-app-os"] == "ios" ||
    doc.body.classList.contains("ios");
}

const isApp = (doc = document) => {
  if (typeof doc === 'undefined') return false;
  return doc.documentElement.attributes["data-rendering-target"] == "apps" ||
    isAndroid(doc) || isIOS(doc);
}

export { isApp, isAndroid, isIOS }