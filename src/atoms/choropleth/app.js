import "./styles/main.scss"
import Atom from "./components/Atom.svelte"
import { isApp } from "$lib/helpers/platform"

// enable this when creating an atom for the article template
// import '$lib/helpers/resizeFrame';

// create scrollbar width CSS variable
import "$lib/helpers/scrollbarWidth"

import { hydrate } from "svelte"

let app

app = hydrate(Atom, {
  target: document.getElementById("gv-atom"),
  props: { name: "atom" },
})

export default app
