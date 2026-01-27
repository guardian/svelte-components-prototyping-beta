<script>
  import { onMount } from "svelte"
  import Nav from "./Nav.svelte"
  import Video from "./Video.svelte"

  import {
    showCaptions,
    isMuted,
    isVideoPlaying,
  } from "$lib/stores/videoScroll.svelte.js"

  let {
    videos,
    url = "https://interactive.guim.co.uk/embed/aus/2025/06/frontline",
    hasAudio = false,
    muted = true,
    active = 0,
    scrollToNextBlock = null,
    colour = "#FF0000",
    testing = false,
    onPlaybackMode = null,
  } = $props()

  let overlay = $state(false)
  let showControls = $state(false)
  let hasCaptions = $state(false)
  let activeVideoHasAudio = $state(false)
  let mounted = $state(false)
  let activePlaybackMode = $state("unknown")
  let canvasElement
  let canvasContext
  let animationFrameId = null
  let isRenderingLoopActive = false
  
  // Performance monitoring for canvas rendering
  let renderCount = 0
  let renderStartTime = null
  let renderTimes = []
  
  // Throttling for canvas rendering (30fps = ~33ms between frames)
  const TARGET_FPS = 30
  const FRAME_INTERVAL = 1000 / TARGET_FPS // ~33.33ms
  let lastRenderTime = 0

  //$inspect(videos)

  // Preload all poster images
  function preloadPosterImages() {
    if (!videos || videos.length === 0) return

    videos.forEach((video) => {
      const posterUrl = `${url}/${video.src}.jpg`
      const img = new Image()
      img.src = posterUrl
      // Optional: log when images are loaded for debugging
      img.onload = () => {
        //console.log(`Preloaded poster image: ${posterUrl}`)
      }
      img.onerror = () => {
        console.warn(`Failed to preload poster image: ${posterUrl}`)
      }
    })
  }

  // Preload images when videos are available
  $effect(() => {
    if (videos && videos.length > 0 && url) {
      preloadPosterImages()
    }
  })

  // Update overlay based on active video
  $effect(() => {
    /*
    console.log(
      "Videos component - Available videos:",
      videos.map((v) => ({ vid: v.vid, src: v.src, hasAudio: v.hasAudio })),
    )
    //console.log("Videos component - Active:", active) */
    const activeVideo = videos.find((video) => video.vid === active)
    overlay = activeVideo?.overlay || false
    showControls = activeVideo?.controls || false
    hasCaptions = activeVideo?.hasCaptions || false
    activeVideoHasAudio = activeVideo?.hasAudio || false
    /*
    console.log(
      `Overlay updated to: ${overlay} for video ${active}`,
      activeVideo,
    )
    console.log(
      `Active video hasAudio: ${activeVideo?.hasAudio}, showControls: ${showControls}, hasCaptions: ${hasCaptions}`,
    )
    */
  })

  // Debug showCaptions store changes
  $effect(() => {
    //console.log("showCaptions store changed to:", $showCaptions)
  })

  // Effect to observe video playback state changes (component instances react via props)
  $effect(() => {
    //console.log("Video playback state changed to:", $isVideoPlaying)
    
    // Start/stop rendering loop based on playback state
    if ($isVideoPlaying && canvasContext) {
      startRenderingLoop()
    } else {
      stopRenderingLoop()
    }
    
    // Cleanup on unmount
    return () => {
      stopRenderingLoop()
    }
  })

  // Effect to initialize playback state when active video changes
  $effect(() => {
    const activeVideo = videos.find((video) => video.vid === active)
    if (activeVideo) {

      /*
      console.log(
        `Initializing playback state for video ${activeVideo.vid}, autoplay: ${activeVideo.autoplay}`,
      )
      */
      // Set initial state based on autoplay setting
      import("$lib/stores/videoScroll.svelte.js").then(({ setVideoPlaying }) => {
        setVideoPlaying(activeVideo.autoplay)
      })
    }
  })

  // Handle video events
  function handleVideoLoad(videoId) {
    //console.log(`Video ${videoId} loaded`)
    // Autoplay behavior managed by Video component; ensure store reflects non-autoplay initial state
    const video = videos.find((v) => v.vid === videoId)
    if (videoId === active) {
      import("$lib/stores/videoScroll.svelte.js").then(({ setVideoPlaying }) => {
        setVideoPlaying(!!video?.autoplay)
      })
    }
  }

  // Handle caption track events
  function handleCaptionTrackLoad(videoId) {
    //console.log(`Caption track loaded successfully for video ${videoId}`)
  }

  function handleCaptionTrackError(videoId, error) {
    console.error(`Caption track error for video ${videoId}:`, error)
  }

  // Handle video canplay event
  function handleVideoCanPlay(videoId) {
    //console.log(`Video ${videoId} can play`)
    if (videoId === active) {
      const video = videos.find((v) => v.vid === videoId)
      import("$lib/stores/videoScroll.svelte.js").then(({ setVideoPlaying }) => {
        setVideoPlaying(!!video?.autoplay)
      })
    }
  }

  // Handle video play event
  function handleVideoPlay(videoId) {
    //console.log(`Video ${videoId} started playing`)
    if (videoId === active) {
      import("$lib/stores/videoScroll.svelte.js").then(({ setVideoPlaying }) => {
        setVideoPlaying(true)
      })
    }
  }

  // Handle video pause event
  function handleVideoPause(videoId) {
    //console.log(`Video ${videoId} paused`)
    if (videoId === active) {
      import("$lib/stores/videoScroll.svelte.js").then(({ setVideoPlaying }) => {
        setVideoPlaying(false)
      })
    }
  }

  // Handle video ended event
  function handleVideoEnded(videoId) {
    //console.log(`Video ${videoId} ended`)
    if (videoId === active) {
      import("$lib/stores/videoScroll.svelte.js").then(({ setVideoPlaying }) => {
        setVideoPlaying(false)
      })

      // Check if this video has loop set to false and trigger scroll to next block
      const video = videos.find((v) => v.vid === videoId)
      if (video && !video.loop && scrollToNextBlock) {
        console.log(
          `Video ${videoId} has loop=false, triggering scroll to next block`,
        )
        scrollToNextBlock(videoId)
      }
    }
  }

  // Handle playback mode changes
  function handlePlaybackMode(videoId, mode) {
    if (videoId === active) {
      activePlaybackMode = mode
      //console.log(`Active video ${videoId} playback mode: ${mode}`)
      if (onPlaybackMode) {
        onPlaybackMode(mode)
      }
    }
  }

  // Initialize canvas context
  $effect(() => {
    if (canvasElement) {
      canvasContext = canvasElement.getContext("2d")
      // Set canvas size to match container
      canvasElement.width = canvasElement.offsetWidth
      canvasElement.height = canvasElement.offsetHeight
    }
  })

  // Update canvas when active video changes
  $effect(() => {
    // Stop any active rendering loop
    stopRenderingLoop()

    if (active !== undefined && canvasContext) {
      // Small delay to ensure video element is rendered
      setTimeout(() => {
        drawVideoFrameToCanvas()
        lastRenderTime = performance.now()
        
        // Restart rendering loop if video is playing
        if ($isVideoPlaying) {
          startRenderingLoop()
        }
      }, 100)
    }
  })

  // Function to draw current video frame to canvas
  function drawVideoFrameToCanvas() {
    if (!canvasContext || !canvasElement) return

    // Performance monitoring
    const now = performance.now()
    if (renderStartTime === null) {
      renderStartTime = now
    }
    renderCount++
    renderTimes.push(now)
    
    // Keep only last 60 render times for calculation
    if (renderTimes.length > 60) {
      renderTimes.shift()
    }
    
    // Calculate and log FPS every 30 frames
    if (renderCount % 30 === 0 && renderTimes.length >= 2) {
      const timeSpan = renderTimes[renderTimes.length - 1] - renderTimes[0]
      const fps = ((renderTimes.length - 1) / timeSpan) * 1000
      //console.log(`Canvas render FPS: ${fps.toFixed(2)} (${renderCount} total renders)`)
    }

    // Find the active video element
    const activePanel = document.querySelector(`.panel[data-id="${active}"]`)
    if (!activePanel) return

    const videoElement = activePanel.querySelector("video")
    if (!videoElement || videoElement.readyState < 2) return // Video not ready

    // Update canvas size if needed
    const containerWidth = canvasElement.offsetWidth
    const containerHeight = canvasElement.offsetHeight

    if (
      canvasElement.width !== containerWidth ||
      canvasElement.height !== containerHeight
    ) {
      canvasElement.width = containerWidth
      canvasElement.height = containerHeight
    }

    // Draw the video frame to canvas with proper aspect ratio
    try {
      const videoWidth = videoElement.videoWidth || videoElement.offsetWidth
      const videoHeight = videoElement.videoHeight || videoElement.offsetHeight

      if (videoWidth > 0 && videoHeight > 0) {
        // Calculate aspect ratios
        const videoAspect = videoWidth / videoHeight
        const canvasAspect = containerWidth / containerHeight

        let drawWidth, drawHeight, drawX, drawY

        if (videoAspect > canvasAspect) {
          // Video is wider - fit to height
          drawHeight = containerHeight
          drawWidth = drawHeight * videoAspect
          drawX = (containerWidth - drawWidth) / 2
          drawY = 0
        } else {
          // Video is taller - fit to width
          drawWidth = containerWidth
          drawHeight = drawWidth / videoAspect
          drawX = 0
          drawY = (containerHeight - drawHeight) / 2
        }

        // Clear canvas
        canvasContext.fillStyle = "#000000"
        canvasContext.fillRect(0, 0, containerWidth, containerHeight)

        // Draw video frame
        canvasContext.drawImage(
          videoElement,
          drawX,
          drawY,
          drawWidth,
          drawHeight,
        )
      }
    } catch (error) {
      // Silently handle CORS or other drawing errors
      console.warn("Error drawing video frame to canvas:", error)
    }
  }

  // Continuous rendering loop that runs at 30fps
  function startRenderingLoop() {
    if (isRenderingLoopActive) return
    isRenderingLoopActive = true
    
    function renderLoop() {
      // Stop loop if flag is false
      if (!isRenderingLoopActive) {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
        return
      }
      
      const now = performance.now()
      const timeSinceLastRender = now - lastRenderTime
      
      // Only render if enough time has passed (throttle to 30fps)
      if (timeSinceLastRender >= FRAME_INTERVAL) {
        drawVideoFrameToCanvas()
        lastRenderTime = now
      }
      
      animationFrameId = requestAnimationFrame(renderLoop)
    }
    
    renderLoop()
  }
  
  function stopRenderingLoop() {
    isRenderingLoopActive = false
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }
  
  // Update canvas on video timeupdate (just triggers initial render, loop handles continuous updates)
  function handleVideoTimeUpdate(videoId, event) {
    if (videoId === active && $isVideoPlaying) {
      // Start the rendering loop if not already running
      if (!isRenderingLoopActive) {
        startRenderingLoop()
      }
    }
  }
</script>

<Nav
  {showControls}
  {hasCaptions}
  hasAudio={activeVideoHasAudio}
  color={colour}
/>

<div id="sunscreen" class:lunar={overlay} class:solar={!overlay}></div>

<div class="background">
  {#each videos as video}
    <div
      class="panel"
      class:cinema-foreground={video.vid === active}
      class:cinema-background={video.vid !== active}
      data-id={video.vid}
    >
      {#if video.vid === active}
        <div class="video-wrapper {video.display}">
          <Video
            vid={video.vid}
            src={video.src}
            path={url}
            placeholder={`${url}/${video.src}.jpg`}
            srt={video.hasCaptions && video.subs
              ? `${url}/${video.subs}.srt`
              : null}
            captionVtt={video.hasCaptions && video.subs
                    ? `${url}/${video.subs}.vtt`
                    : null}
            captionTtml={video.hasCaptions && video.subs
                    ? `${url}/${video.subs}.ttml`
                    : null}
            isActive={video.vid === active}
            shouldPlay={$isVideoPlaying && video.vid === active}
            loop={video.loop}
            muted={$isMuted || !video.hasAudio}
            showCaptions={$showCaptions && !!video.hasCaptions}
            defaultHighRes={video.defaultHighRes || false}
            {testing}
            on:loadeddata={() => handleVideoLoad(video.vid)}
            on:canplay={() => handleVideoCanPlay(video.vid)}
            on:play={() => handleVideoPlay(video.vid)}
            on:pause={() => handleVideoPause(video.vid)}
            on:ended={() => handleVideoEnded(video.vid)}
            on:playbackmode={(e) =>
              handlePlaybackMode(video.vid, e.detail?.mode)}
            on:timeupdate={(e) => {
              if (video.vid === active && window.navApi) {
                const { currentTime, duration } = e.detail || {}
                if (duration > 0) {
                  window.navApi.updateVideoProgress(currentTime, duration)
                }
              }
              handleVideoTimeUpdate(video.vid, e)
            }}
          />
        </div>
      {:else}
        <div class="video-wrapper {video.display}"></div>
      {/if}
    </div>
  {/each}
  <div class="background-panel">
    <canvas bind:this={canvasElement}></canvas>
  </div>
</div>

<style lang="scss">
  .background {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: -10;
    background-color: black;

    &:before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-image: linear-gradient(
        to right,
        rgba(0, 0, 0, 1),
        transparent
      );
    }

    .cinema-foreground {
      animation: foreground 2s linear forwards;
    }

    .cinema-background {
      animation: back 2s linear forwards;
    }

    @keyframes foreground {
      from {
        z-index: -10;
        opacity: 0;
      }
      to {
        z-index: 10;
        opacity: 1;
      }
    }
    @keyframes back {
      from {
        z-index: 10;
        opacity: 1;
      }
      to {
        z-index: -10;
        opacity: 0;
      }
    }

    .panel {
      margin-bottom: 0;
      border: none;
      border-radius: 0;
      box-shadow: none;
      position: absolute;
      object-fit: cover;
      width: 100%;
      height: 100%;
      z-index: 10;

      video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .video-wrapper.standard {
        width: 100%;
        height: 100%;
      }

      .standard video {
        width: 100%;
        height: 100%;
      }

      .video-wrapper.squared {
        width: 100%;
        height: auto;
        position: relative;
        top: 25%;
        /*  transform: translateY(-50%);*/
      }
    }

    .panel:last-child {
      opacity: 0.6;
    }

    .background-panel {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: black;
      z-index: 1;

      canvas {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;

        &:before {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background-image: linear-gradient(to top, black, transparent);
        }
      }
    }

    video::cue {
      font-size: 26px;
      background-color: transparent;
      color: #ffbc01;

      text-shadow:
        -1px -1px 0px #000,
        1px -1px 0px #000,
        -1px 1px 0px #000,
        1px 1px 0px #000;
    }

    @media (max-width: 480px) {
      video::cue {
        font-size: 16px;
      }
    }

    video::-webkit-media-text-track-display-backdrop {
      background-color: transparent !important;
    }
    video::cue(b) {
      font-weight: bold;
    }

    /*	video::cue(v[voice="Lisa Groom"]) { color: #ff6600 }
*/
  }

  .solar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
    opacity: 0; // Clear when solar is active

    &:before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-image: linear-gradient(to top, black, transparent);
    }
  }

  .lunar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
    opacity: 1; // Visible when lunar is active

    &:before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-image: linear-gradient(to top, black, transparent);
    }
  }

  @keyframes daytime {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  @keyframes nightime {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  #sunscreen {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 0; // Below blocks (z-index: 2) and nav (z-index: 100)
    transition: opacity 0.3s ease-in-out;
  }

  .solar {
    opacity: 0; // Clear when solar is active

    &:before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-image: linear-gradient(to top, rgba(0, 0, 0, 1), transparent);
    }
  }

  .lunar {
    opacity: 1; // Visible when lunar is active

    &:before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-image: linear-gradient(to top, rgba(0, 0, 0, 1), transparent);
    }
  }
</style>
