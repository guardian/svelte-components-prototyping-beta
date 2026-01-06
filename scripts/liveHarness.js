export const getLiveHarnessAndInjectAtom = async (atomConfig, atomHTML) => {
  if (!atomConfig.path || !atomConfig.liveHarnessConfig.parentArticleId) {
    return `<html><body><h2>Please set 'path' and 'parentArticleId' in project.config.js</h2></body></html>`
  }

  const interactiveAtom = {
    id: atomConfig.path,
    title: atomConfig.title,
    css: "",
    html: atomHTML,
    js: "",
    weighting: atomConfig.liveHarnessConfig.atomWeighting || "inline",
  }

  if (!process.env.PANDA_TOKEN) {
    throw new Error("PANDA_TOKEN environment variable is not set")
  }

  const params =
    atomConfig.liveHarnessConfig.renderingPlatform === "apps" ? "?dcr=apps" : ""

  const harnessWithAtomsHTML = await fetch(
    `https://preview.gutools.co.uk/desktop-auth/render-harness/${atomConfig.liveHarnessConfig.parentArticleId}${params}`,
    {
      method: "POST",
      body: JSON.stringify([interactiveAtom]),
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.PANDA_TOKEN,
      },
    },
  )
  if (!harnessWithAtomsHTML.ok) {
		return `<html><body><h2>Error fetching live harness (${harnessWithAtomsHTML.status}: ${harnessWithAtomsHTML.statusText})</h2></body></html>`;
	}
  return await harnessWithAtomsHTML.text()
}
