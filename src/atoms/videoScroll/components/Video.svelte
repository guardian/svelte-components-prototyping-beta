<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte"
  import Hls from "hls.js"
  import { isApp, isAndroid, isIOS } from "$lib/helpers/platform.js"

  // Props using Svelte 5 syntax
  let {
    vid = 0,
    src = "coachella-wide",
    path = "https://interactive.guim.co.uk/embed/aus/2024/07/leaving-gaza",
    placeholder = "https://interactive.guim.co.uk/embed/aus/2024/07/leaving-gaza/coachella-wide.jpg",
    srt = "https://interactive.guim.co.uk/embed/aus/2024/07/leaving-gaza/coachella-wide.vtt",
    testing = false,
    isActive = false,
    shouldPlay = false,
    loop = false,
    muted: mutedProp = true,
    showCaptions = false,
    captionsOffset = "5vh",
  } = $props()

  // Component state using Svelte 5 syntax
  let videoElement
  let player
  let shaka = null
  let isPlaying = $state(false)
  let loaded = $state(false)
  let observer
  let logMessages = $state([])
  let vidLoaded = $state(false)
  let application = $state({})
  const dispatch = createEventDispatcher()

  let playbackMode = $state("unknown") // 'shaka' | 'hls' | 'mp4'

  // Breakpoint configurations
  const PIXEL_BREAKPOINTS = [
    { maxWidth: 401, value: 400 },
    { maxWidth: 481, value: 480 },
    { maxWidth: 641, value: 640 },
    { maxWidth: 961, value: 960 },
    { maxWidth: 1281, value: 1280 },
    { maxWidth: 1920, value: 1280 },
    { maxWidth: Infinity, value: 1920 },
  ]

  const IOS_BREAKPOINTS = [
    { maxWidth: 231, value: 230 },
    { maxWidth: 271, value: 270 },
    { maxWidth: 361, value: 360 },
    { maxWidth: 541, value: 540 },
    { maxWidth: 721, value: 720 },
    { maxWidth: Infinity, value: 1080 },
  ]

  // Utility functions
  function getSize(width, breakpoints) {
    for (let i = 0; i < breakpoints.length; i++) {
      if (width < breakpoints[i].maxWidth) {
        return breakpoints[i].value
      }
    }
    return breakpoints[breakpoints.length - 1].value
  }

  function pixelWidth(width) {
    return getSize(width, PIXEL_BREAKPOINTS)
  }

  function iosSize(width) {
    return getSize(width, IOS_BREAKPOINTS)
  }

  function isIOSDevice() {
    if (typeof navigator !== "undefined") {
      const iDevices = [
        "iPad Simulator",
        "iPhone Simulator",
        "iPod Simulator",
        "iPad",
        "iPhone",
        "iPod",
      ]
      return !!navigator.platform && iDevices.includes(navigator.platform)
    }
    return false
  }

  function isMobileDevice() {
    if (typeof navigator !== "undefined") {
      const regex =
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i
      const userAgent = navigator.userAgent || navigator.vendor || window.opera
      return (
        regex.test(userAgent.substr(0, 4)) || /iPad/i.test(navigator.userAgent)
      )
    }
    return false
  }

  function randomString(length) {
    const chars =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("")
  }

  function isLocalStorageAvailable() {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("verify", "confirm")
        if (localStorage.getItem("verify") === "confirm") {
          localStorage.removeItem("verify")
          return true
        }
      } catch (e) {
        return false
      }
    }
    return false
  }

  // Logging utility
  function log(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString()
    const formattedMessage = `[${timestamp}] ${message}`
    logMessages = [...logMessages, { text: formattedMessage, type }]

    if (type === "error") {
      console.error(message)
    } else {
      console.log(message)
    }
  }

  // Platform detection and settings
  async function detectPlatform() {
    const settings = {}

    if (typeof navigator !== "undefined") {
      settings.platform = navigator.platform.toLowerCase()
      settings.userAgent = navigator.userAgent.toLowerCase()
      settings.isMobile = isMobileDevice()

      settings.app = {
        isApp: isApp(),
        isIos: isIOSDevice(),
        isAndroid: isAndroid(),
        isiPhone: /(iPhone)/i.test(navigator.platform),
        isiPad: /iPad/i.test(navigator.userAgent),
      }
    } else {
      console.warn(
        "Navigator is not defined. Running in a non-browser environment.",
      )
      settings.platform = "unknown"
      settings.userAgent = "unknown"
      settings.isMobile = false
      settings.app = {
        isApp: isApp(),
        isIos: isIOSDevice(),
        isAndroid: isAndroid(),
        isiPhone: false,
        isiPad: false,
      }
    }

    settings.localstore = isLocalStorageAvailable()
    settings.randomID = randomString(32)
    settings.screenWidth = document.documentElement.clientWidth
    settings.screenHeight = document.documentElement.clientHeight
    settings.portrait = settings.screenWidth < 740
    settings.pixelWidth = pixelWidth(settings.screenWidth)
    settings.iosWidth = iosSize(settings.screenWidth)
    settings.smallScreen = settings.screenWidth < 540

    return settings
  }

  // Video player initialization
  function initializeVideoPlayer() {

    /*
    if (isAndroid || isIOS) {
      if (isAndroid) {
        log("Using Shaka player for Android")
        playbackMode = "shaka"
        initShakaPlayer()
      } else {
        log("Using standard player for iOS")
        playbackMode = "mp4"
        initStandardPlayer()
      }
      return
    }

    */

    if (shaka && shaka.Player && shaka.Player.isBrowserSupported()) {
      log("Using Shaka player")
      playbackMode = "shaka"
      initShakaPlayer()
    } else if (Hls.isSupported()) {
      log("Using HLS player")
      playbackMode = "hls"
      initHLSPlayer()
    } else if (videoElement.canPlayType("video/mp4")) {
      log("Using standard MP4 player")
      playbackMode = "mp4"
      initStandardPlayer()
    } else {
      log("No supported video format found", "error")
    }
  }

  function initHLSPlayer() {
    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(`${path}/hls/${src}/master.m3u8`)
      hls.attachMedia(videoElement)

      if (srt) {
        loadCaptions()
      }

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error", data)
        log("HLS error, trying standard player")
        initStandardPlayer()
      })
    }
  }

  async function initShakaPlayer() {
    player = new shaka.Player()

    try {
      await player.attach(videoElement)
      await player.load(`${path}/dash/${src}/manifest.mpd`)
      log("Loaded Shaka video")

      if (srt) {
        await player.addTextTrackAsync(srt, "en", "subtitles", "text/vtt")
        const textTracks = player.getTextTracks()

        if (textTracks.length > 0) {
          player.selectTextTrack(textTracks[0])
          player.setTextTrackVisibility(true)
        }
      }
    } catch (error) {
      console.error("Error loading video with Shaka Player:", error)
      log("Shaka player error, trying standard player")
      initStandardPlayer()
    }
  }

  function initStandardPlayer() {
    const videoUrl = `${path}/${src}-${application.iosWidth}.mp4`
    videoElement.setAttribute("src", videoUrl)
    videoElement.load()

    videoElement.addEventListener("error", () => {
      log("Standard video error", "error")
    })

    if (srt) {
      loadCaptions()
    }
  }

  function loadCaptions() {
    // Do not add native <track> when using Shaka; Shaka manages its own text overlay
    if (playbackMode === "shaka") return
    // If a track already exists, don't duplicate
    const existing = Array.from(videoElement?.querySelectorAll("track") || [])
    if (existing.length === 0) {
      const track = document.createElement("track")
      track.kind = "subtitles"
      track.label = "English"
      track.srclang = "en"
      track.src = srt
      track.default = true
      videoElement.appendChild(track)
    }
  }

  // Event handlers
  // Sound is controlled externally via mutedProp

  function togglePlayPause() {
    if (isPlaying) {
      videoElement.pause()
    } else {
      videoElement.play()
    }
  }

  function handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (videoElement && isActive) {
          videoElement.play()
          isPlaying = true
        }
      } else {
        if (videoElement && !isActive) {
          videoElement.pause()
          isPlaying = false
        }
      }
    })
  }

  // Lifecycle
  onMount(async () => {
    application = await detectPlatform()

    videoElement.setAttribute("crossorigin", "anonymous")

    // Load Shaka player
    shaka = await import("shaka-player")
    shaka.polyfill.installAll()

    // Initialize player
    if (!vidLoaded) {
      vidLoaded = true
      initializeVideoPlayer()
    }

    // Set up event listeners
    if (videoElement) {
      videoElement.loop = loop
      videoElement.muted = mutedProp

      const onPlay = () => {
        isPlaying = true
        dispatch("play", { vid })
      }
      const onPause = () => {
        isPlaying = false
        dispatch("pause", { vid })
      }
      const onEnded = () => {
        isPlaying = false
        dispatch("ended", { vid })
      }
      const onLoadedData = () => {
        dispatch("loadeddata", { vid })
      }
      const onCanPlay = () => {
        dispatch("canplay", { vid })
      }
      const onTimeUpdate = (e) => {
        const el = e?.target
        if (!el) return
        dispatch("timeupdate", {
          vid,
          currentTime: el.currentTime,
          duration: el.duration,
        })
      }

      videoElement.addEventListener("play", onPlay)
      videoElement.addEventListener("pause", onPause)
      videoElement.addEventListener("ended", onEnded)
      videoElement.addEventListener("loadeddata", onLoadedData)
      videoElement.addEventListener("canplay", onCanPlay)
      videoElement.addEventListener("timeupdate", onTimeUpdate)

      loaded = true

      observer = new IntersectionObserver(handleIntersection, {
        threshold: 0.5,
      })
      observer.observe(videoElement)

      // Store removers on the element for cleanup
      videoElement.__streamingHandlers = {
        onPlay,
        onPause,
        onEnded,
        onLoadedData,
        onCanPlay,
        onTimeUpdate,
      }
    }
  })

  onDestroy(() => {
    if (observer) observer.disconnect()
    if (player) player.destroy()
    if (videoElement && videoElement.__streamingHandlers) {
      const {
        onPlay,
        onPause,
        onEnded,
        onLoadedData,
        onCanPlay,
        onTimeUpdate,
      } = videoElement.__streamingHandlers
      videoElement.removeEventListener("play", onPlay)
      videoElement.removeEventListener("pause", onPause)
      videoElement.removeEventListener("ended", onEnded)
      videoElement.removeEventListener("loadeddata", onLoadedData)
      videoElement.removeEventListener("canplay", onCanPlay)
      videoElement.removeEventListener("timeupdate", onTimeUpdate)
      delete videoElement.__streamingHandlers
    }
  })

  // React to external control props
  $effect(() => {
    if (!videoElement) return
    if (shouldPlay && isActive) {
      videoElement.play().catch(() => {})
    }
  })

  $effect(() => {
    if (videoElement) {
      videoElement.muted = mutedProp
    }
  })

  // React to caption visibility changes
  $effect(() => {
    // Handle Shaka captions visibility
    if (playbackMode === "shaka") {
      if (player && typeof player.setTextTrackVisibility === "function") {
        player.setTextTrackVisibility(showCaptions)
      }
      // Ensure we don't have native tracks visible when using Shaka
      if (videoElement && videoElement.textTracks) {
        for (let i = 0; i < videoElement.textTracks.length; i++) {
          const track = videoElement.textTracks[i]
          if (track.kind === "subtitles" || track.kind === "captions") {
            track.mode = "disabled"
          }
        }
      }
    } else {
      // Handle native/HLS text tracks
      if (videoElement) {
        // Ensure a track exists if captions are requested and srt provided
        if (showCaptions && srt) {
          loadCaptions()
        }
        const tracks = videoElement.textTracks || []
        for (let i = 0; i < tracks.length; i++) {
          const track = videoElement.textTracks[i]
          if (track.kind === "subtitles" || track.kind === "captions") {
            track.mode = showCaptions ? "showing" : "hidden"
          }
        }
      }
    }
  })
</script>

{#if testing}
  <div class="log-container">
    {#each logMessages as message}
      <div class="log-message {message.type}">
        {message.text}
      </div>
    {/each}
  </div>
{/if}

<div class="video-wrapper" style={"--captions-offset: " + captionsOffset}>
  <video
    bind:this={videoElement}
    poster={placeholder}
    muted={mutedProp}
    playsinline
    {loop}
  ></video>
</div>

<style lang="scss">
  .log-container {
    margin-top: 20px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    max-height: 200px;
    overflow-y: auto;
  }

  .log-message {
    padding: 4px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    &.error {
      color: #d32f2f;
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .video-wrapper {
    width: 100%;
    height: 100vh;
    position: relative;
  }

  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    cursor: pointer;

    @media (max-height: 780px) {
      object-fit: contain;
    }
  }

  svg {
    fill: white;
    width: 64px;
    height: 64px;
  }

  video::cue {
    font-size: 22px;
    background-color: transparent;
    color: #ffbc01;
    text-align: center;
    text-shadow:
      -1px -1px 0px #000,
      1px -1px 0px #000,
      -1px 1px 0px #000,
      1px 1px 0px #000;
  }

  @media (max-width: 480px) {
    video::cue {
      font-size: 14px;
      padding: 0 20px;
    }
  }

  video::-webkit-media-text-track-display-backdrop {
    background-color: transparent !important;
  }

  video::cue(b) {
    font-weight: bold;
  }

  /* Move native captions up (WebKit/Blink) */
  video::-webkit-media-text-track-display {
    transform: translateY(calc(-1 * var(--captions-offset, 5vh)));
  }

  /* Shaka text overlay (if used) */
  :global(.shaka-text-container) {
    position: absolute !important;
    left: 0;
    right: 0;
    bottom: var(--captions-offset, 12vh) !important;
    pointer-events: none;
    text-align: center;
    padding: 0 5vw;
  }
  :global(.shaka-text-container .shaka-text) {
    color: #ffbc01 !important;
    text-shadow:
      -1px -1px 0px #000,
      1px -1px 0px #000,
      -1px 1px 0px #000,
      1px 1px 0px #000;
    font-size: clamp(12px, 2.6vw, 26px) !important;
    line-height: 1.3;
  }
</style>
