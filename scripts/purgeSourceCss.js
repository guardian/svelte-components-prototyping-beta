import { PurgeCSS } from "purgecss"

export function purgeSourceCss() {
  return {
    name: "vite-plugin-purgecss-source",
    apply: "build",
    enforce: "post",

    async generateBundle(options, bundle) {
      // Find the CSS asset in the bundle
      const cssAsset = Object.values(bundle).find(
        (asset) => asset.type === "asset" && asset.fileName.endsWith(".css"),
      )

      if (!cssAsset) {
        return
      }

      // Scan JS and HTML files in the bundle for --src-* variable references. Unlike classes,
      // PurgeCSS doesn't look for references in JavaScript (eg. in Svelte script blocks)
      const usedSrcVariables = new Set()
      for (const [fileName, item] of Object.entries(bundle)) {
        if (fileName.endsWith(".map")) continue
        if (!fileName.endsWith(".js") && !fileName.endsWith(".html")) continue

        const content = item.type === "chunk" ? item.code : item.source

        if (content && typeof content === "string") {
          const matches = content.match(/--src-[\w-]+/g) || []
          matches.forEach((v) => usedSrcVariables.add(v))
        }
      }

      const result = await new PurgeCSS().purge({
        content: ["src/**/*.{js,svelte,html}"],
        css: [{ raw: cssAsset.source }],
        variables: true,
        safelist: {
          standard: [/^(?:(?!src-).)*$/],
          variables: [/^(?:(?!--src-).)*$/, ...usedSrcVariables],
        },
      })

      if (result[0]) {
        cssAsset.source = result[0].css
      }
    },
  }
}
