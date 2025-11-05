import { writable } from 'svelte/store';

export const database = writable({});
export const tooltipStore = writable({
  visible: false,
  touch: false,
  x: 0,
  y: 0,
  html: ''
});
