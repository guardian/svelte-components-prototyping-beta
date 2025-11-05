import { writable } from 'svelte/store'

// Audio and caption settings stores
export const showCaptions = writable(false)
export const isMuted = writable(true)

// Video playback state store
export const isVideoPlaying = writable(false)

// Helper functions to toggle states
export function toggleCaptions() {
  showCaptions.update(current => !current)
}

export function toggleMuted() {
  console.log('=== TOGGLE MUTED CALLED ===');
  isMuted.update(current => {
    const newValue = !current;
    console.log('Updating isMuted from', current, 'to', newValue);
    return newValue;
  });
}

// Helper functions to set specific states
export function setShowCaptions(value) {
  showCaptions.set(value)
}

export function setIsMuted(value) {
  isMuted.set(value)
}

// Video playback control functions
export function toggleVideoPlayback() {
  isVideoPlaying.update(current => !current)
}

export function setVideoPlaying(value) {
  isVideoPlaying.set(value)
}

export function playVideo() {
  isVideoPlaying.set(true)
}

export function pauseVideo() {
  isVideoPlaying.set(false)
} 