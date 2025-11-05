import { derived } from "svelte/store"
import { windowInnerWidth } from "./dimensions"

export const isMobile = derived(windowInnerWidth, ($windowInnerWidth) => {
  return $windowInnerWidth < 740
})

export const isTablet = derived(windowInnerWidth, ($windowInnerWidth) => {
  return $windowInnerWidth >= 740 && $windowInnerWidth < 980
})

export const isDesktop = derived(windowInnerWidth, ($windowInnerWidth) => {
  return $windowInnerWidth >= 980
})
