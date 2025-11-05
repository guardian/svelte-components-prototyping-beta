import { createServer, createViteRuntime } from "vite"
import path from "path"

const atomName = process.env.ATOM_NAME

export function prerender() {
  const plugin = {
    name: "vite-plugin-prerender",
    apply: "build",

    async generateBundle() {
      const server = await createServer({
        server: { middlewareMode: true },
        appType: "custom",
      })

      const runtime = await createViteRuntime(server)

      const { prerender } = await runtime.executeEntrypoint(
        path.join(atomName, "app.prerender.js"),
      )

      const mainHTML = await prerender()

      this.emitFile({
        type: "asset",
        fileName: "main.html",
        source: mainHTML,
      })

      server.close()
    },
  }

  return plugin
}
