<script>
  import { onMount, onDestroy } from 'svelte';
  import Hls from 'hls.js';

  // Props using Svelte 5 syntax
  let { 
    src = "coachella-wide",
    path = "https://interactive.guim.co.uk/embed/aus/2024/07/leaving-gaza",
    placeholder = "https://interactive.guim.co.uk/embed/aus/2024/07/leaving-gaza/coachella-wide.jpg",
    srt = "https://interactive.guim.co.uk/embed/aus/2024/07/leaving-gaza/coachella-wide.vtt",
    testing = false
  } = $props();

  // Component state using Svelte 5 syntax
  let videoElement;
  let player;
  let shaka = null;
  let muted = $state(true);
  let isPlaying = $state(false);
  let loaded = $state(false);
  let observer;
  let logMessages = $state([]);
  let isActive = $state(false);
  let vidLoaded = $state(false);
  let application = $state({});

  // Platform detection
  let isAndroid = $state(false);
  let isIOS = $state(false);

  // Breakpoint configurations
  const PIXEL_BREAKPOINTS = [
    { maxWidth: 401, value: 400 },
    { maxWidth: 481, value: 480 },
    { maxWidth: 641, value: 640 },
    { maxWidth: 961, value: 960 },
    { maxWidth: 1281, value: 1280 },
    { maxWidth: 1920, value: 1280 },
    { maxWidth: Infinity, value: 1920 }
  ];

  const IOS_BREAKPOINTS = [
    { maxWidth: 231, value: 230 },
    { maxWidth: 271, value: 270 },
    { maxWidth: 361, value: 360 },
    { maxWidth: 541, value: 540 },
    { maxWidth: 721, value: 720 },
    { maxWidth: Infinity, value: 1080 }
  ];

  // Utility functions
  function getSize(width, breakpoints) {
    for (let i = 0; i < breakpoints.length; i++) {
      if (width < breakpoints[i].maxWidth) {
        return breakpoints[i].value;
      }
    }
    return breakpoints[breakpoints.length - 1].value;
  }

  function pixelWidth(width) {
    return getSize(width, PIXEL_BREAKPOINTS);
  }

  function iosSize(width) {
    return getSize(width, IOS_BREAKPOINTS);
  }

  function isIOSDevice() {
    if (typeof navigator !== 'undefined') {
      const iDevices = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
      ];
      return !!navigator.platform && iDevices.includes(navigator.platform);
    }
    return false;
  }

  function isMobileDevice() {
    if (typeof navigator !== 'undefined') {
      const regex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return regex.test(userAgent.substr(0, 4)) || /iPad/i.test(navigator.userAgent);
    }
    return false;
  }

  function randomString(length) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  function isLocalStorageAvailable() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('verify', 'confirm');
        if (localStorage.getItem('verify') === 'confirm') {
          localStorage.removeItem('verify');
          return true;
        }
      } catch(e) {
        return false;
      }
    }
    return false;
  }

  // Logging utility
  function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${message}`;
    logMessages = [...logMessages, { text: formattedMessage, type }];
    
    if (type === 'error') {
      console.error(message);
    } else {
      console.log(message);
    }
  }

  // Platform detection and settings
  async function detectPlatform() {
    const settings = {};

    if (typeof navigator !== 'undefined') {
      settings.platform = navigator.platform.toLowerCase();
      settings.userAgent = navigator.userAgent.toLowerCase();
      settings.isMobile = isMobileDevice();

      settings.app = {
        isApp: window.location.origin === "file://" || 
               window.location.origin === null || 
               window.location.origin === "https://mobile.guardianapis.com",
        isIos: isIOSDevice(),
        isAndroid: /(android)/i.test(navigator.userAgent),
        isiPhone: /(iPhone)/i.test(navigator.platform),
        isiPad: /iPad/i.test(navigator.userAgent)
      };
    } else {
      console.warn('Navigator is not defined. Running in a non-browser environment.');
      settings.platform = 'unknown';
      settings.userAgent = 'unknown';
      settings.isMobile = false;
      settings.app = {
        isApp: false,
        isIos: false,
        isAndroid: false,
        isiPhone: false,
        isiPad: false
      };
    }

    settings.localstore = isLocalStorageAvailable();
    settings.randomID = randomString(32);
    settings.screenWidth = document.documentElement.clientWidth;
    settings.screenHeight = document.documentElement.clientHeight;
    settings.portrait = settings.screenWidth < 740;
    settings.pixelWidth = pixelWidth(settings.screenWidth);
    settings.iosWidth = iosSize(settings.screenWidth);
    settings.smallScreen = settings.screenWidth < 540;

    return settings;
  }

  // Video player initialization
  function initializeVideoPlayer() {
    if (isAndroid || isIOS) {
      if (isAndroid) {
        log('Using Shaka player for Android');
        initShakaPlayer();
      } else {
        log('Using standard player for iOS');
        initStandardPlayer();
      }
      return;
    }

    if (shaka && shaka.Player && shaka.Player.isBrowserSupported()) {
      log('Using Shaka player');
      initShakaPlayer();
    } else if (Hls.isSupported()) {
      log('Using HLS player');
      initHLSPlayer();
    } else if (videoElement.canPlayType('video/mp4')) {
      log('Using standard MP4 player');
      initStandardPlayer();
    } else {
      log('No supported video format found', 'error');
    }
  }

  function initHLSPlayer() {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(`${path}/hls/${src}/master.m3u8`);
      hls.attachMedia(videoElement);
      
      if (srt) {
        loadCaptions();
      }
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error', data);
        log('HLS error, trying standard player');
        initStandardPlayer();
      });
    }
  }

  async function initShakaPlayer() {
    player = new shaka.Player();

    try {
      await player.attach(videoElement);
      await player.load(`${path}/dash/${src}/manifest.mpd`);
      log("Loaded Shaka video");

      if (srt) {
        await player.addTextTrackAsync(srt, 'en', 'subtitles', 'text/vtt');
        const textTracks = player.getTextTracks();
        
        if (textTracks.length > 0) {
          player.selectTextTrack(textTracks[0]);
          player.setTextTrackVisibility(true);
        }
      }
    } catch (error) {
      console.error('Error loading video with Shaka Player:', error);
      log('Shaka player error, trying standard player');
      initStandardPlayer();
    }
  }

  function initStandardPlayer() {
    const videoUrl = `${path}/${src}-${application.iosWidth}.mp4`;
    videoElement.setAttribute('src', videoUrl);
    videoElement.load();

    videoElement.addEventListener('error', () => {
      log('Standard video error', 'error');
    });

    if (srt) {
      loadCaptions();
    }
  }

  function loadCaptions() {
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'English';
    track.srclang = 'en';
    track.src = srt;
    track.default = true;
    videoElement.appendChild(track);
  }

  // Event handlers
  function toggleSound() {
    console.log("toggleSound");
    muted = !muted;
    videoElement.muted = muted;
  }

  function togglePlayPause() {
    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
  }

  function handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (videoElement && isActive) {
          videoElement.play();
          isPlaying = true;
        }
      } else {
        if (videoElement && !isActive) {
          videoElement.pause();
          isPlaying = false;
        }
      }
    });
  }

  // Lifecycle
  onMount(async () => {
    application = await detectPlatform();

    const body = document.querySelector("body");
    isAndroid = body ? body.classList.contains("android") : false;
    isIOS = body ? body.classList.contains("ios") : false;

    videoElement.setAttribute('crossorigin', 'anonymous');

    // Load Shaka player
    shaka = await import('shaka-player');
    shaka.polyfill.installAll();

    // Initialize player
    if (!vidLoaded) {
      vidLoaded = true;
      initializeVideoPlayer();
    }

    // Set up event listeners
    if (videoElement) {
      videoElement.addEventListener('play', () => {
        isPlaying = true;
      });

      videoElement.addEventListener('pause', () => {
        isPlaying = false;
      });

      videoElement.addEventListener('ended', () => {
        isPlaying = false;
      });

      loaded = true;

      observer = new IntersectionObserver(handleIntersection, { threshold: 1 });
      observer.observe(videoElement);
    }
  });

  onDestroy(() => {
    if (observer) observer.disconnect();
    if (player) player.destroy();
  });
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

<div class="video-wrapper">
  <video 
    bind:this={videoElement} 
    poster={placeholder} 
    muted={muted} 
    playsinline
  ></video>
  
  <div 
    class="overlay" 
    on:click={togglePlayPause} 
    style="opacity: {isPlaying ? '0' : '0.5'}"
  >
    <svg viewBox="0 0 64 64" width="64" height="64" fill="white">
      <polygon points="16,0 64,32 16,64" />
    </svg>
  </div>
  
  <div 
    on:click={toggleSound} 
    class="mutation" 
    style="
      background-image: {muted ? 'url(__assetsPath__/muted.svg)' : 'url(__assetsPath__/playing.svg)'};
      background-color: {muted ? '#faa90d' : 'rgb(207, 248, 251)'};
    "
  ></div>
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
    display: inline-block;
    position: relative;
    
    @media (max-height: 780px) {
      // height: calc(100vh - 60px - 50px - 10px - 10px);
    }
  }

  video {
    width: 100%;
    height: 100%;
    
    @media (max-height: 780px) {
      object-fit: contain;
    }
  }

  .mutation {
    width: 30px;
    height: 30px;
    position: absolute;
    left: 20px;
    bottom: 20px;
    cursor: pointer;
    background-position: center;
    background-size: 80%;
    background-repeat: no-repeat;
    border-radius: 50%;
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
    font-size: 18px;
    background-color: transparent;
    color: #ffbc01;
    text-align: center;
    padding: 0 80px;
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
</style>
