[![stability-beta](https://img.shields.io/badge/stability-beta-33bbff.svg)](https://github.com/mkenney/software-guides/blob/master/STABILITY-BADGES.md#beta)

## What is this?

This is an opinionated template for creating interactive atoms. It uses [Vite](https://vitejs.dev/) in combination with [Rollup](https://rollupjs.org/guide/en/) for a smooth development experience and fast builds.

- 💡 Instant local dev server start (no bundling required)
- ⚡️ Instant visual feedback through [Hot Module Replacement (HMR)](https://vitejs.dev/guide/features.html#hot-module-replacement)
- 🔧 Built-in support for [Preact](https://preactjs.com/) or [Svelte](https://svelte.dev/) (Svelte 5 or older, [see below](#using-svelte-5-or-older-versions))
- 📝 Prerendering enabled by default
- 📦 Effortless deployment

## How to use the template

### Prerequisites

The template is compatible with Node 16+. You can install new versions of node using [NVM](https://github.com/nvm-sh/nvm#installing-and-updating).

### Getting started

1. Click the "Use this template" button on this page to create a new repository.
2. Clone the repo
3. Install dependencies: `npm install`

To start the dev server:

```
npm run dev
```

To build for production:

```
npm run build
```

Builds will be placed in the `/build` directory.

### Deployment

Fill out `project.config.js`:

```js
{
    "title": "Title of your interactive",
    "path": "year/month/unique-title"
}
```

To deploy to the Interactives S3 bucket you need AWS credentials for the Interactives account in your command line. You can get these from the Guardian's permissions manager system [Janus](https://janus.gutools.co.uk/). You need to be assigned these permissions and be on a Guardian network or VPN to see them on Janus.

By default you'll want to run this command:

```
npm run deploy:live
```

But **if you're making changes to an atom that has already been published**, it is advisable to use:

```
npm run deploy:preview
```

This will make the changes visible in composer preview, but not on the live page, allowing the atom to be tested before being published to the live page.

Running the deploy task will output the url to be embedded in Composer.

To verify that deploy was picked up sucessfully:

```
npm run deploylog:live
```

Or:

```
npm run deploylog:preview
```

## Project structure

The files that make up your interactive atom live in the `/src` directory. This is what a typical src directory looks like:

- `/assets`
- `/atoms`
- `/lib`

### Assets

The recommended place for putting any static assets (Images, JSON, etc.). These assets are shared between atoms and can be referenced using `__assetsPath__`. For example:

```html
<img src="__assetsPath__/guardian-logo.svg" alt="Guardian logo" />
```

The **assetsPath** string is automatically replaced with the correct path when running the dev server or building for production.

### Atoms

Each directory in the `/atoms` folder represents a single interactive atom. To create a new atom, duplicate an existing atom and give it a descriptive name.

When embedding multiple atoms on the same Composer page, make sure you use unique CSS IDs for each atom in their respective `main.html` files.

```html
<div id="some-unique-id">{{ html }}</div>
```

You will need to change this ID in `app.js` too.

```js
const app = new Atom({
  target: document.getElementById("some-unique-id"),
  hydrate: true,
  props: {},
})
```

### Lib

Source files that are shared by multiple atoms should be placed in the `/lib` folder. These files should be referenced using the `$lib` import alias. For example:

```js
import SharedComponent from "$lib/components/SharedComponent.svelte"
```

## Preact support

[Preact](https://preactjs.com/) support is enabled by default. It relies on the Preact plugin for Vite (`@preact/preset-vite`) in `vite.config.js`

The `app.js` remains the entry point for the atom. Here's an example of what it would look like when using Preact:

```js
import "./styles/main.scss"
import { render } from "preact"
import Atom from "./components/Atom"

render(<Atom />, document.getElementById("gv-atom"))
```

And here's an example of what `app.prerender.js` should look like:

```js
import renderToString from "preact-render-to-string"
import mainHTML from "./main.html?raw"
import Atom from "./components/Atom"

export function render() {
  const html = renderToString(<Atom />)
  return mainHTML.replace("{{ html }}", html)
}
```

## Other features

### Using Svelte 5 or older versions

The default atom component ([Atom.svelte](src/atoms/default/components/Atom.svelte)) is a Svelte 5 component.

If you would prefer to use an older version of Svelte, you can! Svelte 5 was created to be a
backwards-compatible upgrade, so you can use older Svelte syntax (`export let prop`, `$: { //...
}`, etc) in `Atom.svelte` and other components without needing to change any settings.

However, you can't use syntax from _both_ Svelte 5 and Svelte 4 or older in the same component. Eg. you can't have `let { name = "atom" } = $props()` and `$: foo = index + 1`.

Read [this Svelte 5 documentation](https://svelte.dev/docs/svelte/v5-migration-guide) for more info.

### Source colours, typography, breakpoints

This repo imports CSS/SCSS files from [Source](https://zeroheight.com/2a1e5182b/p/300696-), the Guardian's design system, which includes classes and CSS variables for colours and typography. These can be used like so.

```html
<h2 class="src-headline-medium-34">Breaking news</h2>
<p class="src-article-17">The quick brown fox jumps over the lazy dog.</p>
<div style="background-color: var(--src-brand-400);">🏃</div>
<div style="background-color: var(--src-labs-400);">🟤</div>
<div style="background-color: var(--src-lifestyle-300);">🦊</div>
```

See Source's documentation for:

- [a list of available typography classes](https://guardian.github.io/storybooks/?path=/story/source_foundations-typography--presets) (`article15` corresponds to the `src-article-15` class, `headlineMedium28` to the `src-headline-medium-28` class, etc)
- [a list of available colour variables](https://guardian.github.io/storybooks/?path=/docs/source_foundations-palette--docs) (shade 300 of `brandAlt` corresponds to the `--src-brand-alt-300` variable, etc)

To apply a typography class to many elements, eg. to make all of your `<p>` tags look like `.src-article-17`, use [SCSS' `@extend` feature](https://sass-lang.com/documentation/at-rules/extend/).

```scss
p {
  @extend .src-article-17;
}
```

For more information about these styles, check out the PR that introduced them: https://github.com/guardian/interactive-atom-template-2023/pull/62.

### Dark mode

Ideally interactives should support dark mode. This project introduces some commonly-used variables that will switch value if the project is in dark mode. The color variables can be found in the `_colors.scss` file. The switch turning dark mode on or off is found in the [main.scss](https://github.com/guardian/interactive-atom-template-2023/blob/main/src/atoms/default/styles/main.scss) of the default atom.

The `main.scss` file above provides a simple background colour and text styles that should switch when in an app that is in dark mode. To disable this, just remove that code or make it more specific.

NB: the Guardian only supports dark mode on app, not web (as of July 2024).

To use these variables in css:

```
p {
     color: var(--primary-text-color);
}
```

NB: if you are using the [component library](https://github.com/guardian/interactive-component-library) in your project - it is advised to delete or disable the default \_colors.scss file in this repo. That's because the component also defines these variables and some switching code to detect if it is being run in dark mode. If you include both variable definitions, overrides could cause confusion about which definition wins out.

### Linting and formatting

ESLint and Prettier configurations are included in the project. To enforce those rules:

1. Open `.githooks/pre-commit` in a text editor
2. Uncomment this line: `# npx lint-staged`
3. Save the file

From that point on, ESLint and Prettier checks will run before every commit.

## Troubleshooting

### Using React modules with Preact breaks prerendering

If you want to use React modules with Preact, you need to set `ssr.noExternal` to `true` in `vite.config.js`. This ensures that import statements in dependencies are properly aliased to `preact/compat`.

See [Vite documentation](https://vitejs.dev/guide/ssr.html#ssr-externals) for more details.

## Supported browsers

A list of browsers that the guardian supports can be found here: [https://www.theguardian.com/help/recommended-browsers](https://www.theguardian.com/help/recommended-browsers)
