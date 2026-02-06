import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

export default {
  preprocess: [
    {
      style: ({ content }) => ({
        // Prepend SCSS mixin imports to each Svelte <style> block,
        // so we can use eg. `@include mq(leftCol)` in them
        code:
          `@use "interactive-style-library/source/mq.scss" as *;\n` +
          `@use "interactive-style-library/source/typography-mixins.scss" as *;\n` +
          `@use "interactive-style-library/visuals/charts-mixins.scss" as *;\n` +
          `${content}`,
      }),
    },
    vitePreprocess(),
  ],
}
