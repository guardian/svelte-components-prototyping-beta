<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte"
  import Hls from "hls.js"
  import { isApp, isAndroid, isIOS } from "$lib/helpers/guardian/platform.js"

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
    defaultHighRes = false,
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
  let shakaCaptionsConfigured = $state(false) // Flag to prevent duplicate caption setup
  let shakaCaptionHandler = null // Store caption configuration handler for cleanup

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
        isApp: isApp,
        isIos: isIOSDevice,
        isAndroid: isAndroid,
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
        isApp: isApp,
        isIos: isIOSDevice,
        isAndroid: isAndroid,
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
      dispatch("playbackmode", { mode: "shaka" })
      initShakaPlayer()
    } else if (Hls.isSupported()) {
      log("Using HLS player")
      playbackMode = "hls"
      dispatch("playbackmode", { mode: "hls" })
      initHLSPlayer()
    } else if (videoElement.canPlayType("video/mp4")) {
      log("Using standard MP4 player")
      playbackMode = "mp4"
      dispatch("playbackmode", { mode: "mp4" })
      initStandardPlayer()
    } else {
      log("No supported video format found", "error")
    }
  }

  function initHLSPlayer() {
    if (Hls.isSupported()) {
      const hls = new Hls()
      
      // Configure for high resolution if defaultHighRes is enabled
      if (defaultHighRes) {
        log("Configuring HLS for high-resolution playback")
        // Disable adaptive bitrate to force highest quality
        hls.config.abr = {
          enabled: false,
        }
        // Start with highest quality level (-1 means highest)
        hls.config.startLevel = -1
        // Set a high default bandwidth estimate to encourage high quality
        hls.config.abrEwmaDefaultEstimate = 10000000 // 10 Mbps
      }
      
      hls.loadSource(`${path}/hls/${src}/master.m3u8`)
      hls.attachMedia(videoElement)

      // After manifest is loaded, ensure we're on the highest level if defaultHighRes is enabled
      if (defaultHighRes) {
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const levels = hls.levels
          if (levels && levels.length > 0) {
            // Find the highest quality level
            const highestLevel = levels.length - 1
            hls.currentLevel = highestLevel
            log(`HLS: Set to highest quality level ${highestLevel} (${levels[highestLevel].height}p)`)
          }
        })
      }

      if (srt && srt.trim() && srt.trim() !== "null" && srt.trim() !== "undefined") {
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

    // Configure for high resolution if defaultHighRes is enabled
    if (defaultHighRes) {
      log("Configuring Shaka for high-resolution playback")
      player.configure({
        abr: {
          enabled: false, // Disable adaptive bitrate to force highest quality
        },
        streaming: {
          bufferingGoal: 10, // Increase buffering goal for smoother high-res playback
          rebufferingGoal: 5,
        },
      })
    }

    try {
      await player.attach(videoElement)
      await player.load(`${path}/dash/${src}/manifest.mpd`)
      log("Loaded Shaka video")

      // After manifest loads, ensure we're on the highest quality if defaultHighRes is enabled
      if (defaultHighRes) {
        const variants = player.getVariantTracks()
        if (variants && variants.length > 0) {
          // Find the variant with the highest resolution
          const highestVariant = variants.reduce((prev, current) => {
            const prevHeight = prev.height || 0
            const currentHeight = current.height || 0
            return currentHeight > prevHeight ? current : prev
          })
          player.selectVariantTrack(highestVariant, true)
          log(`Shaka: Set to highest quality variant (${highestVariant.height}p, ${highestVariant.bandwidth}bps)`)
        }
      }

      // Handle captions for Shaka player - configure once after manifest loads
      const configureShakaCaptions = async () => {
        if (shakaCaptionsConfigured) {
          console.log("Shaka captions already configured, skipping")
          return
        }
        
        try {
          // Small delay to ensure tracks are fully parsed
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Check if manifest already includes text tracks
          const manifestTracks = player.getTextTracks()
          const hasManifestTracks = manifestTracks && manifestTracks.length > 0
          
          if (hasManifestTracks) {
            // Use tracks from manifest, don't add external track
            console.log(`Shaka manifest includes ${manifestTracks.length} text track(s)`)
            
            // Deselect all tracks first to prevent duplicates
            manifestTracks.forEach(track => {
              try {
                if (track.active) {
                  // Shaka doesn't have a deselect method, so we'll just select the one we want
                }
              } catch (e) {
                // Ignore errors
              }
            })
            
            // Select only the first track (this will automatically deselect others)
            player.selectTextTrack(manifestTracks[0])
            player.setTextTrackVisibility(showCaptions)
            shakaCaptionsConfigured = true
            console.log(`Selected manifest track: ${manifestTracks[0].language || 'en'}, visibility: ${showCaptions}`)
          } else if (srt && srt.trim() && srt.trim() !== "null" && srt.trim() !== "undefined") {
            // Only add external track if manifest doesn't have one
            await player.addTextTrackAsync(srt, "en", "subtitles", "text/vtt")
            const addedTracks = player.getTextTracks()
            if (addedTracks && addedTracks.length > 0) {
              // Find the external track we just added (it should be the newest one)
              const externalTrack = addedTracks[addedTracks.length - 1]
              
              // Select only this track (will deselect any others)
              player.selectTextTrack(externalTrack)
              player.setTextTrackVisibility(showCaptions)
              shakaCaptionsConfigured = true
              console.log(`Added and selected external caption track, visibility: ${showCaptions}`)
            }
          } else {
            // No captions available
            player.setTextTrackVisibility(false)
            shakaCaptionsConfigured = true
          }
        } catch (captionError) {
          console.error("Error configuring Shaka caption tracks:", captionError)
          shakaCaptionsConfigured = true // Set flag even on error to prevent retries
        }
      }
      
      // Store handler for cleanup
      shakaCaptionHandler = configureShakaCaptions
      
      // Listen for when streaming starts (manifest is loaded)
      player.addEventListener('streaming', configureShakaCaptions, { once: true })
      
      // Also listen for text track changes to ensure only one is active
      const textTrackChangeHandler = () => {
        const allTracks = player.getTextTracks()
        const activeTracks = allTracks.filter(track => track.active)
        if (activeTracks.length > 1) {
          console.warn(`Multiple Shaka tracks active (${activeTracks.length}), keeping only the first`)
          // Keep only the first active track
          player.selectTextTrack(activeTracks[0])
        }
      }
      player.addEventListener('texttrackchanged', textTrackChangeHandler)
      
      // Store for cleanup
      if (!videoElement.__shakaHandlers) {
        videoElement.__shakaHandlers = []
      }
      videoElement.__shakaHandlers.push({
        type: 'texttrackchanged',
        handler: textTrackChangeHandler
      })
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

    if (srt && srt.trim() && srt.trim() !== "null" && srt.trim() !== "undefined") {
      loadCaptions()
    }
  }

  function loadCaptions() {
    // Do not add native <track> when using Shaka; Shaka manages its own text overlay
    if (playbackMode === "shaka") return
    
    // Validate srt URL before attempting to load
    if (!srt || !srt.trim()) {
      console.warn("No caption URL provided")
      return
    }
    
    // If a track already exists, don't duplicate
    const existing = Array.from(videoElement?.querySelectorAll("track") || [])
    if (existing.length === 0 && videoElement) {
      // Verify the URL is valid before creating the track
      const trackUrl = srt.trim()
      console.log(`Loading caption track from: ${trackUrl}`)
      
      const track = document.createElement("track")
      track.kind = "subtitles"
      track.label = "English"
      track.srclang = "en"
      track.src = trackUrl
      track.default = false // Don't set as default, we'll control visibility via showCaptions
      
      // Set mode based on showCaptions prop when track loads
      track.addEventListener("load", () => {
        if (track.track && track.track.cues) {
          track.mode = showCaptions ? "showing" : "hidden"
          console.log(`Caption track loaded successfully, mode set to: ${track.mode}`)
        } else {
          console.warn("Caption track loaded but no cues found")
        }
      })
      
      // Improved error handling
      track.addEventListener("error", (e) => {
        const error = track.error
        let errorMessage = "Unknown error"
        
        if (error) {
          switch (error.code) {
            case 1: // MEDIA_ERR_ABORTED
              errorMessage = "Caption loading aborted"
              break
            case 2: // MEDIA_ERR_NETWORK
              errorMessage = "Network error loading captions"
              break
            case 3: // MEDIA_ERR_DECODE
              errorMessage = "Caption file decode error"
              break
            case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
              errorMessage = "Caption format not supported"
              break
            default:
              errorMessage = `Error code: ${error.code}`
          }
        }
        
        console.error(`Caption track error for ${trackUrl}: ${errorMessage}`, {
          error,
          track,
          url: trackUrl
        })
        
        // Remove the failed track to avoid confusion
        if (track.parentNode) {
          track.parentNode.removeChild(track)
        }
      })
      
      videoElement.appendChild(track)
      
      // On mobile, tracks might need the video to be loaded first
      if (application.isMobile && videoElement.readyState < 2) {
        videoElement.addEventListener("loadedmetadata", () => {
          const tracks = videoElement.textTracks || []
          const lastTrack = tracks[tracks.length - 1]
          if (lastTrack && lastTrack.kind === "subtitles") {
            lastTrack.mode = showCaptions ? "showing" : "hidden"
            console.log(`Mobile: Set track mode to: ${lastTrack.mode} after metadata load`)
          }
        }, { once: true })
      } else {
        // Set mode immediately if video is already loaded
        setTimeout(() => {
          const tracks = videoElement.textTracks || []
          const lastTrack = tracks[tracks.length - 1]
          if (lastTrack && lastTrack.kind === "subtitles") {
            lastTrack.mode = showCaptions ? "showing" : "hidden"
            console.log(`Set track mode to: ${lastTrack.mode}`)
          }
        }, 100)
      }
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
        // On mobile, text tracks may only be available after canplay
        if (playbackMode !== "shaka" && videoElement.textTracks) {
          const tracks = videoElement.textTracks || []
          for (let i = 0; i < tracks.length; i++) {
            const track = videoElement.textTracks[i]
            if (track.kind === "subtitles" || track.kind === "captions") {
              track.mode = showCaptions ? "showing" : "hidden"
            }
          }
        }
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
      const onLoadedMetadata = () => {
        // Text tracks are available after metadata loads, especially on mobile
        if (playbackMode !== "shaka" && videoElement.textTracks) {
          const tracks = videoElement.textTracks || []
          for (let i = 0; i < tracks.length; i++) {
            const track = videoElement.textTracks[i]
            if (track.kind === "subtitles" || track.kind === "captions") {
              // Force mode change on mobile - sometimes needs multiple attempts
              track.mode = "hidden" // Reset first
              setTimeout(() => {
                track.mode = showCaptions ? "showing" : "hidden"
                console.log(`Caption track ${i} mode set to: ${track.mode} on mobile`)
              }, 50)
            }
          }
        }
      }

      videoElement.addEventListener("play", onPlay)
      videoElement.addEventListener("pause", onPause)
      videoElement.addEventListener("ended", onEnded)
      videoElement.addEventListener("loadeddata", onLoadedData)
      videoElement.addEventListener("canplay", onCanPlay)
      videoElement.addEventListener("loadedmetadata", onLoadedMetadata)
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
        onLoadedMetadata,
        onTimeUpdate,
      }
    }
  })

  onDestroy(() => {
    if (observer) observer.disconnect()
    if (player) {
      // Remove event listeners before destroying
      if (shakaCaptionHandler) {
        player.removeEventListener('streaming', shakaCaptionHandler)
      }
      if (videoElement && videoElement.__shakaHandlers) {
        videoElement.__shakaHandlers.forEach(({ type, handler }) => {
          player.removeEventListener(type, handler)
        })
        delete videoElement.__shakaHandlers
      }
      player.destroy()
    }
    shakaCaptionsConfigured = false
    shakaCaptionHandler = null
    if (videoElement && videoElement.__streamingHandlers) {
      const {
        onPlay,
        onPause,
        onEnded,
        onLoadedData,
        onCanPlay,
        onLoadedMetadata,
        onTimeUpdate,
      } = videoElement.__streamingHandlers
      videoElement.removeEventListener("play", onPlay)
      videoElement.removeEventListener("pause", onPause)
      videoElement.removeEventListener("ended", onEnded)
      videoElement.removeEventListener("loadeddata", onLoadedData)
      videoElement.removeEventListener("canplay", onCanPlay)
      videoElement.removeEventListener("loadedmetadata", onLoadedMetadata)
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
        // Handle hide case immediately - no need to check tracks
        if (!showCaptions) {
          player.setTextTrackVisibility(false)
          console.log(`Shaka caption visibility set to: false (hiding captions)`)
          return // Exit early for hide case
        }
        
        // For show case, we need to ensure a track is selected
        const textTracks = player.getTextTracks()
        
        if (textTracks && textTracks.length > 0) {
          // Find all active tracks
          const activeTracks = textTracks.filter(track => track.active)
          
          // If multiple tracks are active, keep only the first
          if (activeTracks.length > 1) {
            console.log(`Multiple Shaka tracks active (${activeTracks.length}), selecting first one`)
            player.selectTextTrack(activeTracks[0])
          }
          
          // We need to show captions - ensure a track is selected
          if (showCaptions) {
            // We need to show captions - ensure a track is selected
            if (activeTracks.length === 0) {
              // No track is active but we need to show captions - select the first track
              console.log("showCaptions is true but no track is active, selecting first track")
              player.selectTextTrack(textTracks[0])
              
              // Verify selection worked and then set visibility
              setTimeout(() => {
                const verifyTracks = player.getTextTracks()
                const verifyActive = verifyTracks.filter(track => track.active)
                if (verifyActive.length > 0) {
                  player.setTextTrackVisibility(true)
                  console.log(`Shaka caption visibility set to: true, active tracks: ${verifyActive.length}`)
                } else {
                  console.error("Failed to select Shaka track, trying again")
                  // Try one more time
                  player.selectTextTrack(textTracks[0])
                  setTimeout(() => {
                    player.setTextTrackVisibility(true)
                  }, 100)
                }
              }, 100)
              return // Exit early, visibility will be set in setTimeout
            } else {
              // Track is already active, just set visibility to show
              player.setTextTrackVisibility(true)
              console.log(`Shaka caption visibility set to: true, active tracks: ${activeTracks.length}`)
            }
          }
        } else {
          // No tracks available
          console.warn("No Shaka text tracks available")
          player.setTextTrackVisibility(false)
        }
      }
      // Ensure we don't have native HTML5 tracks visible when using Shaka
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
        // Ensure a track exists if srt is provided and valid (regardless of showCaptions state)
        if (srt && srt.trim() && srt.trim() !== "null" && srt.trim() !== "undefined") {
          loadCaptions()
        }
        // Update all existing tracks - with retry for mobile
        const updateTracks = () => {
          const tracks = videoElement.textTracks || []
          for (let i = 0; i < tracks.length; i++) {
            const track = videoElement.textTracks[i]
            if (track.kind === "subtitles" || track.kind === "captions") {
              const targetMode = showCaptions ? "showing" : "hidden"
              if (track.mode !== targetMode) {
                track.mode = targetMode
                console.log(`Set track ${i} mode to: ${targetMode}`)
              }
            }
          }
        }
        updateTracks()
        // Retry on mobile devices where tracks might not be ready immediately
        if (application.isMobile) {
          setTimeout(updateTracks, 100)
          setTimeout(updateTracks, 500)
        }
      }
    }
  })
</script>

{#if testing}
  <!--div class="log-container">
    {#each logMessages as message}
      <div class="log-message {message.type}">
        {message.text}
      </div>
    {/each}
  </div-->
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
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  @media (max-width: 480px) {
    video::cue {
      font-size: 16px;
      padding: 0 20px;
      line-height: 1.4;
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
    position: relative;
    z-index: 1000;
  }

  /* Mobile-specific caption positioning */
  @media (max-width: 768px) {
    video::-webkit-media-text-track-display {
      transform: translateY(calc(-1 * var(--captions-offset, 8vh)));
      bottom: auto;
    }
  }

  /* Ensure captions are visible on mobile Safari */
  @supports (-webkit-touch-callout: none) {
    video::-webkit-media-text-track-display {
      position: relative !important;
      z-index: 1000 !important;
    }
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
    z-index: 1000 !important;
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

  /* Mobile-specific Shaka caption positioning */
  @media (max-width: 768px) {
    :global(.shaka-text-container) {
      bottom: var(--captions-offset, 10vh) !important;
      padding: 0 4vw;
    }
    :global(.shaka-text-container .shaka-text) {
      font-size: clamp(14px, 4vw, 20px) !important;
    }
  }
</style>
