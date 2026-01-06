import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"
import { fileURLToPath } from "url"
import { resolve } from "path"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const libPath = resolve(__dirname, "src/lib")

export default {
  preprocess: [
    {
      style: ({ content }) => ({
        code: `@use "${libPath}/styles/mq.scss" as *;\n@use "@guardian/source/foundations/typography-mixins.scss" as *;\n${content}`,
      }),
    },
    vitePreprocess(),
  ],
}
