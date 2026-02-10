import { render } from "svelte/server"
import Atom from "./components/Atom.svelte"
import mainHTML from "./main.html?raw"
import {exampledata, getExampleData} from "$lib/stores/example.svelte.js"

export async function prerender() {

  // await getExampleData();
  const { body } = render(Atom, {
  })

  return mainHTML.replace("{{ html }}", body)
}
