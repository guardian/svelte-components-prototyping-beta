<script>
  import { onMount } from "svelte";
  import { writable } from 'svelte/store';
  //import { loadSrt } from "$lib/helpers/parseSrt.js";
  //import { soundOn } from '$lib/stores/soundOn.js';
  //import { active } from '$lib/stores/active.js';
  import subtitlesParser from "subtitles-parser";




  export let srt = "https://interactive.guim.co.uk/embed/aus/2024/07/leaving-gaza/hamada-voice-canada.srt"
  export let src = "https://interactive.guim.co.uk/embed/aus/2024/07/leaving-gaza/hamada-voice-canada.mp3"
  export let pic = "https://interactive.guim.co.uk/embed/aus/2024/07/leaving-gaza/hamada.jpg"
  export let track = ""
  let audioUrl = `${src}`;
  let loaded = false
  let mounted = false
  let observer
  let audioElement
  let inView = false
  let playable = false


  let audioContext;
  let audioBuffer;
  let source;
  let gainNode;
  let isPlaying = false;
  let panelWidth = 0;
  let canvas;
  let ctx;
  let analyser;
  let monologue = [];

  let startingTime = 0;
  let elapsedTime = 0;
  let currentTime = 0;
  let duration = 0;
  let muted = true
  let isActive = true 

  // Progress store to bind with the progress bar
  const progress = writable(0);

  let now = 0;

  let fbcArray;
  const maxBarHeight = 50;

  /*
  const subscribed = soundOn.subscribe(value => {
    if (!loaded && mounted) {
      preload();
    }
    muted = !value;
    if (gainNode) {
      gainNode.gain.value = muted ? 0 : 1;
    }

    if (loaded && mounted) {
      if (isPlaying) {
        if (muted) {
          pauseAudio();
        }
      }
    }
  });

  */

  /*
  const getActive = active.subscribe(current => {
    isActive = current === id ? true : false;

    if (isActive && loaded && !muted && !isPlaying) {
      //playAudio()
    }

  });
  */

  async function loadSrt(filePath) {
    const response = await fetch(filePath);
    const srtText = await response.text();
    const parsedData = subtitlesParser.fromSrt(srtText, true);
    return parsedData;
  }


  // Function to initialize the AudioContext
  const initializeAudioContext = () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain(); // Create a gain node
  };

  const preload = async () => {
    initializeAudioContext();
    await loadAudio(audioUrl);
  }

  // Load the audio file
  const loadAudio = async (url) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    loaded = true
    duration = audioBuffer.duration
    playable = true
  };

  // Play the audio
  const playAudio = () => {
    if (audioBuffer) {

      if (muted) {
        //soundOn.set(true);
      }

      if (source && isPlaying) {
        source.stop(0);
      }

      analyser = audioContext.createAnalyser();
      source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      //analyser.connect(audioContext.destination);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination); // Connect gain node to the audio context destination
      startingTime = audioContext.currentTime - elapsedTime;
      source.start(0, elapsedTime);
      isPlaying = true;

      source.onended = () => {
        isPlaying = false;
      };
      requestAnimationFrame(updateProgress);
    }
  };

  const resetAudio = () => {
    
    if (isPlaying && source) {
      source.stop(0);
    }
    initializeAudioContext();
    isPlaying = false;
    startingTime = 0;
    elapsedTime = 0;
    currentTime = 0;
    progress.set(0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Pause the audio
  const pauseAudio = () => {
    if (source && isPlaying) {
      source.stop(0);
      elapsedTime = audioContext.currentTime - startingTime;
      isPlaying = false;
    }
  };

  const playPause = async () => {
    if (!audioContext) {
      track = "Loading track";
      initializeAudioContext();
      await loadAudio(audioUrl);
    }

    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const updateProgress = () => {
    if (isPlaying) {
      elapsedTime = audioContext.currentTime - startingTime;
      progress.set((elapsedTime / audioBuffer.duration) * 100);
      requestAnimationFrame(updateProgress);
      frameLooper();
    }
  };

  function updateTime() {
    currentTime = (duration / 100 * $progress) * 1000;

    if ($progress > 99) {
      resetAudio();
    }

    monologue = monologue.map(({ startTime, endTime, text }) => ({
      startTime,
      endTime,
      text,
      class: getHighlightClass(startTime, endTime),
    }));
  }

  function getHighlightClass(start, end) {
    return currentTime >= start && currentTime <= end ? "highlight" : "hide";
  }

  function frameLooper() {
    if (!isPlaying || canvas == null) return;
    requestAnimationFrame(frameLooper);
    updateTime();

    fbcArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(fbcArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / fbcArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < fbcArray.length; i++) {
      barHeight = fbcArray[i] / 5;
      if (barHeight > maxBarHeight) {
        barHeight = maxBarHeight;
      }
      ctx.fillStyle = '#546380';
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }

  function handleIntersection(entries) {
    entries.forEach(entry => {
      inView = (entry.isIntersecting) ? true : false

      if (inView && loaded && !muted && !isPlaying) {
        playAudio()
      }

      if (!inView && isPlaying) {
        pauseAudio()
      }

    });
  }

  onMount(async () => {
    ctx = canvas.getContext('2d');
    monologue = await loadSrt(`${srt}`);
    mounted = true

    return () => {
      if (observer) observer.disconnect();
      if (subscribed) subscribed();
    };

  });

  $: if (inView) {
    if (!loaded && !muted) {
      preload();
    }
  }

  $: if (!inView && isPlaying) {
    pauseAudio();
  }

  $: if (audioElement) {
    if (audioElement != null) {
      observer = new IntersectionObserver(handleIntersection, { threshold: 1 });
      observer.observe(audioElement);
    }
  }


</script>

<div bind:this={audioElement} class="audio_player">
  <div class="audio_controls">
    <div class="{isPlaying ? 'audio_play' : 'audio_pause'}" on:click={playPause}></div>

    <div class="audio_panel" bind:clientWidth={panelWidth}>
      <canvas bind:this={canvas} width={panelWidth} height="50"></canvas>
    </div>

    <div class="byline_block" style="background-image:url({pic});"></div>
  </div>

  <div class="progress-bar-container">
    <div class="progress-bar" style="width: {$progress}%"></div>
  </div>

  <div class="transcript">
    {#if loaded}
    {#each monologue as { startTime, endTime, text }}
      <div class={getHighlightClass(startTime, endTime)}>{text}</div>
    {/each}
    {:else}
    <div>{track}</div>
    {/if}
  </div>
</div>

<style lang="scss">
  .progress-bar-container {
    width: 100%;
    background-color: lightgrey;
    height: 5px;
    margin-top: 3px;;
  }

  .progress-bar {
    float: left;
    height: 5px;
    background-color: #546380;
  }

  .byline_block {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    float: right;
    background-size: cover;
  }
  
  .audio_player {
    background-color: lightgrey;
    padding: 10px;
    width: calc(100% - 0px);
    display: inline-block;
    min-width: 240px;

    .audio_controls {
      width: 100%;
      display: inline-block;
    }

    .audio_panel {
      width: calc(100% - 120px);
      float: left;
      margin-left: 10px;
      height: 50px;
      position: relative;

      svg {
        path {
          fill: none;
          stroke-width: 1px;

          &.track {
            stroke: #546380;
          }

          &.overlay {
            stroke: orange;
            transition: stroke-dasharray 0.3s;
          }
        }
      }
    }
  }
  
  .highlight {
    color: white;
  }

  .hide {
    display: none;
  }

  .transcript {
    margin-top: 5px;
    width: calc(100% - 0px);
    box-sizing: border-box;
    display: inline-block;
    font-family: "Guardian Text Sans Web", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
    font-weight: 300;
    font-size: 14px;
    line-height: 110%;
    box-sizing: border-box;
    width: 100%;
    display: block;
    background-color: #546380;
    color: white;

    @include mq($until: mobileLandscape) {
      min-height: 40px;
    }
    
    @include mq($from: mobileLandscape) {
      min-height: 25px;
    }

    div {
      padding: 5px;
    }
  }

  .audio_play,
  .audio_pause {
    float: left;

    @media (max-width: 768px) {
      width: 50px;
      height: 50px;
    }

    @media (min-width: 769px) {
      width: 50px;
      height: 50px;
    }

    background-color: #546380;
    color: white;
    mask-size: contain;
    mask-repeat: no-repeat;

    &.audio_play {
      mask-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgODAgODAiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDgwIDgwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHBhdGggZD0iTTQwLDAuOEMxOC4zLDAuOCwwLjgsMTguMywwLjgsNDBTMTguMyw3OS4yLDQwLDc5LjJTNzkuMiw2MS43LDc5LjIsNDBTNjEuNywwLjgsNDAsMC44eiBNMzUuMSw1OS42aC05LjhWMjAuNGg5LjhWNTkuNnogTTU0LjYsNTkuNmgtOS44VjIwLjRoOS44VjU5LjZ6Ii8+PC9zdmc+);
    }

    &.audio_pause {
      mask-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgODAgODAiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDgwIDgwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PGc+PHBhdGggZD0iTTQwLDAuOEMxOC4zLDAuOCwwLjgsMTguMywwLjgsNDBTMTguMyw3OS4yLDQwLDc5LjJTNzkuMiw2MS43LDc5LjIsNDBTNjEuNywwLjgsNDAsMC44eiBNMzAuMSw2MC4zVjQwLjRWMTkuN0w1OS45LDQwTDMwLjEsNjAuM3oiLz48L2c+PC9zdmc+);
    }
  }
</style>