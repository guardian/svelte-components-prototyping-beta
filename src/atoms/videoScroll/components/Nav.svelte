<script>
  import { createEventDispatcher } from 'svelte';
  import { showCaptions, isMuted, isVideoPlaying, toggleCaptions, toggleMuted, toggleVideoPlayback } from '$lib/stores/videoScroll.js'
  import GuardianSvg from './guardianSvg.svelte'
  import CaptionsSvg from './captionsSvg.svelte'
  import CaptionsOffSvg from './captionsOffSvg.svelte'
  import MutedSvg from './mutedSvg.svelte'
  import UnmutedSvg from './unmutedSvg.svelte'
  import PlaySvg from './playSvg.svelte'
  import PauseSvg from './pauseSvg.svelte'
  
  const dispatch = createEventDispatcher();
  
  // Props for configurable behavior
  let { hasAudio = true,
        hasCaptions = true,
        displayCaptions = true,
        showControls = true,
        showGuardianBadge = true,
        color = 'yellow' } = $props();
  
  // Video progress state
  let videoProgress = $state(0);
  
  // Calculate circumference for SVG progress bar (2 * π * radius)
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  
  // Event handlers
  const handlePlayPause = () => {
    toggleVideoPlayback();
    dispatch('playPause');
  };
  
  const handleAudio = () => {
    console.log('=== AUDIO BUTTON CLICKED ===');
    console.log('Current muted state:', $isMuted);
    console.log('Button props:', { hasAudio, showControls });
    toggleMuted();
    console.log('New muted state:', $isMuted);
    dispatch('audioToggle');
  };
  
  const handleCaptions = () => {
    toggleCaptions();
    dispatch('captionsToggle');
  };
  
  const handleGuardianClick = () => {
    dispatch('guardianClick');
  };
  
  // Keyboard event handler
  const handleKeydown = (event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };
  
  // Function to update progress bar
  function updateVideoProgress(currentTime, duration) {
    if (duration > 0) {
      videoProgress = (currentTime / duration) * 100;
      //console.log(`Updating video progress: ${videoProgress.toFixed(1)}%`);
    }
  }
  
  // Function to reset progress bar
  function resetVideoProgress() {
    videoProgress = 0;
    //console.log('Progress bar reset to 0%');
  }
  
  // Expose functions for external use
  const api = {
    updateVideoProgress,
    resetVideoProgress
  };
  
  // Make the API available on the component instance
  if (typeof window !== 'undefined') {
    window.navApi = api;
  }
</script>

<nav class="nav-controls" role="navigation" aria-label="Video controls">
  {#if showGuardianBadge}
    <button 
      class="controls guardian-badge"
      on:click={handleGuardianClick}
      on:keydown={(e) => handleKeydown(e, handleGuardianClick)}
      type="button"
      aria-label="Guardian logo"
    >
      <span>
        <GuardianSvg color={color} />
      </span>
    </button>
  {/if}
  
  <div class="player-controls" style="visibility: {showControls ? 'visible' : 'hidden'}">
    <div class="play-pause-container">
      <button 
        on:click={handlePlayPause}
        on:keydown={(e) => handleKeydown(e, handlePlayPause)}
        class="controls play-pause-btn"
        class:video_play={$isVideoPlaying}
        class:video_pause={!$isVideoPlaying}
        type="button"
        aria-label="{$isVideoPlaying ? 'Pause' : 'Play'} video"
      >
        <span>
          {#if $isVideoPlaying}
            <PauseSvg color={color} />
          {:else}
            <PlaySvg color={color} />
          {/if}
        </span>
      </button>
      
      <!-- Custom progress bar overlay -->
      <div class="progress-overlay">
        <svg class="progress-svg" viewBox="0 0 44 44">
          <circle
            class="progress-trail"
            cx="22"
            cy="22"
            r="19"
            stroke-width="3"
            fill="none"
          />
          <circle
            class="progress-fill"
            cx="22"
            cy="22"
            r="19"
            stroke-width="3"
            fill="none"
            stroke-dasharray="{circumference}"
            stroke-dashoffset="{circumference - (videoProgress / 100) * circumference}"
            transform="rotate(0 22 22)"
            style="stroke: {color}"
          />
        </svg>
      </div>
    </div>
    
    {#if showControls}
      <button 
        on:click={() => {
          console.log('Audio button clicked!');
          handleAudio();
        }}
        on:keydown={(e) => handleKeydown(e, handleAudio)}
        class="controls"
        class:muted={$isMuted}
        class:unmuted={!$isMuted}
        type="button"
        aria-label="{$isMuted ? 'Unmute' : 'Mute'} audio"
      >
        {#if $isMuted}
          <MutedSvg color={color} />
        {:else}
          <UnmutedSvg color={color} />
        {/if}

      </button>
      
    {/if}
    
    {#if hasCaptions}
      <button 
        on:click={handleCaptions}
        on:keydown={(e) => handleKeydown(e, handleCaptions)}
        class="controls"
        class:captions={$showCaptions}
        class:captions-off={!$showCaptions}
        type="button"
        aria-label="{$showCaptions ? 'Hide' : 'Show'} captions"
      >
        
          {#if $showCaptions}
            <CaptionsSvg color={color} />
          {:else}
            <CaptionsOffSvg color={color} />
          {/if}
       
      </button>
    {/if}
  </div>
</nav>

<style lang="scss">
  .nav-controls {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    width: 100%;
    z-index: 100;
    padding: 8px 6px;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1), 
                 2px 2px 3px rgba(0, 0, 0, 0.1), 
                 1px -1px 3px rgba(0, 0, 0, 0.1), 
                 -1px 1px 3px rgba(0, 0, 0, 0.1);

    // Background for mobile devices
    @include mq($until: tablet) {
      background-color: rgba(0, 0, 0, 0.7);
    }

    .controls {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      position: relative;
      border-radius: 50%;
      float: right;
      border: none;
      background: transparent;
      
      cursor: pointer;
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      &:focus {
        outline: none;
      }
      
      // Style for span containers
      span {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .player-controls {
      width: 180px;
      height: 44px;
      margin-left: calc(50% - (180px / 2));
    }

    .play-pause-container {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 44px;
      float: right;
      margin-top: 4px;
      margin-left: 4px;
    }

    .play-pause-btn {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
    }

    .progress-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
    }

    .progress-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .progress-trail {
      stroke: rgba(255, 255, 255, 0.2);
    }

    .progress-fill {
      stroke-linecap: round;
      transition: stroke-dashoffset 0.1s ease;
    }

    // Guardian badge
    .guardian-badge {
      margin-right: 10px;
    }

    // Captions button
    .captions {
      margin-right: 10px;
    }

    .captions-off {
      margin-right: 10px;
    }

    // Audio controls
    .muted {
      margin-right: 10px;
    }

    .unmuted {
      margin-right: 10px;
    }

  }
</style>