<script>
  import { onMount } from 'svelte'
	import Nav from './Nav.svelte'
  
	import { showCaptions, isMuted, isVideoPlaying } from '$lib/stores/videoScroll.js'

    let { videos,
		url = 'https://interactive.guim.co.uk/embed/aus/2025/06/frontline',
		hasAudio = false,
		muted = true,
		active = 0,
		scrollToNextBlock = null,
		colour = '#FF0000'} = $props()


let overlay = $state(false)
let showControls = $state(false)
let hasCaptions = $state(false)
let activeVideoHasAudio = $state(false)
let mounted = $state(false)

$inspect(videos)



// Update overlay based on active video
$effect(() => {
	console.log('Videos component - Available videos:', videos.map(v => ({ vid: v.vid, src: v.src, hasAudio: v.hasAudio })))
	console.log('Videos component - Active:', active)
	const activeVideo = videos.find(video => video.vid === active);
	overlay = activeVideo?.overlay || false;
  showControls = activeVideo?.controls || false;
  hasCaptions = activeVideo?.hasCaptions || false;
  activeVideoHasAudio = activeVideo?.hasAudio || false;
	console.log(`Overlay updated to: ${overlay} for video ${active}`, activeVideo);
	console.log(`Active video hasAudio: ${activeVideo?.hasAudio}, showControls: ${showControls}, hasCaptions: ${hasCaptions}`);
})

// Debug showCaptions store changes
$effect(() => {
	console.log('showCaptions store changed to:', $showCaptions)
})

// Effect to handle video playback state changes
$effect(() => {
	console.log('Video playback state changed to:', $isVideoPlaying)
	handleVideoPlaybackChange($isVideoPlaying)
})

// Effect to initialize playback state when active video changes
$effect(() => {
	const activeVideo = videos.find(video => video.vid === active);
	if (activeVideo) {
		console.log(`Initializing playback state for video ${activeVideo.vid}, autoplay: ${activeVideo.autoplay}`);
		// Set initial state based on autoplay setting
		import('$lib/stores/videoScroll.js').then(({ setVideoPlaying }) => {
			setVideoPlaying(activeVideo.autoplay);
		});
	}
})

// Effect to update muted state of all videos when store changes
$effect(() => {
	console.log('=== MUTED STATE CHANGED ===');
	console.log('Store isMuted:', $isMuted);
	console.log('Available videos:', videos.map(v => ({ vid: v.vid, hasAudio: v.hasAudio, controls: v.controls })));
	
	videos.forEach(video => {
		const videoElement = document.getElementById(`media-element-${video.vid}`);
		if (videoElement) {
			// Only unmute if the video has audio, otherwise keep muted
			const shouldBeMuted = $isMuted || !video.hasAudio;
			videoElement.muted = shouldBeMuted;
			
			// Also set volume to ensure audio is audible when unmuted
			if (!shouldBeMuted && video.hasAudio) {
				videoElement.volume = 1.0;
			}
			
			console.log(`Video ${video.vid}: hasAudio=${video.hasAudio}, shouldBeMuted=${shouldBeMuted}, actualMuted=${videoElement.muted}, volume=${videoElement.volume}`);
		} else {
			console.log(`Video element not found for video ${video.vid}`);
		}
	});
})

// Effect to update muted state when videos array changes
$effect(() => {
	if (videos.length > 0) {
		console.log('Videos array changed, updating muted states');
		videos.forEach(video => {
			const videoElement = document.getElementById(`media-element-${video.vid}`);
			if (videoElement) {
				const shouldBeMuted = $isMuted || !video.hasAudio;
				videoElement.muted = shouldBeMuted;
				console.log(`Initial muted state for video ${video.vid}: ${shouldBeMuted}`);
			}
		});
	}
})

// Effect to handle caption track changes when showCaptions changes
$effect(() => {
	console.log('showCaptions changed to:', $showCaptions);
	videos.forEach(video => {
		if (video.hasCaptions && video.subs) {
			const videoElement = document.getElementById(`media-element-${video.vid}`);
			if (videoElement) {
				if ($showCaptions) {
					// Enable captions
					if (videoElement.textTracks.length > 0) {
						for (let i = 0; i < videoElement.textTracks.length; i++) {
							const track = videoElement.textTracks[i];
							if (track.kind === 'captions') {
								track.mode = 'showing';
								console.log(`Caption track enabled for video ${video.vid}`);
							}
						}
					} else {
						// Add caption track if none exists
						addCaptionTrack(videoElement, video.vid, video.subs);
					}
				} else {
					// Disable captions
					if (videoElement.textTracks.length > 0) {
						for (let i = 0; i < videoElement.textTracks.length; i++) {
							const track = videoElement.textTracks[i];
							if (track.kind === 'captions') {
								track.mode = 'hidden';
								console.log(`Caption track disabled for video ${video.vid}`);
							}
						}
					}
				}
			}
		}
	});
})

// Function to handle video playback state changes
function handleVideoPlaybackChange(shouldPlay) {
	const activeVideo = videos.find(video => video.vid === active);
	if (!activeVideo) {
		console.log('No active video found for playback control')
		return
	}

	const videoElement = document.getElementById(`media-element-${activeVideo.vid}`);
	if (!videoElement) {
		console.log(`Video element not found for video ${activeVideo.vid}`)
		return
	}

	console.log(`Controlling video ${activeVideo.vid}: shouldPlay=${shouldPlay}, autoplay=${activeVideo.autoplay}`);
	
	if (shouldPlay) {
		console.log(`Playing video ${activeVideo.vid} via controls`)
		videoElement.play().catch(error => {
			console.log(`Failed to play video ${activeVideo.vid}:`, error)
		})
	} else {
		console.log(`Pausing video ${activeVideo.vid} via controls`)
		videoElement.pause()
	}
}

// Function to test caption file accessibility
async function testCaptionFile(videoId, subsPath) {
  try {
    const captionPath = `${url}/${subsPath}`;
    console.log(`Testing caption file accessibility: ${captionPath}`);
    
    // Try to fetch the caption file
    const response = await fetch(captionPath);
    if (response.ok) {
      console.log(`Caption file accessible for video ${videoId}: ${subsPath}`);
      return true;
    } else {
      console.error(`Caption file not found for video ${videoId}: ${subsPath} (${response.status})`);
      return false;
    }
  } catch (error) {
    console.error(`Error testing caption file for video ${videoId}:`, error);
    return false;
  }
}

// Test caption files when videos change
$effect(() => {
  if (videos.length > 0) {
    videos.forEach(video => {
      if (video.hasCaptions && video.subs) {
        testCaptionFile(video.vid, video.subs)
      }
    })
  }
})

function standardPlayer(src, videoElement) {

    try {
      const screenWidth = document.documentElement.clientWidth;
      const iosWidth = calculateIOSWidth(screenWidth);
      console.log(`Screen width: ${screenWidth}px, iOS width: ${iosWidth}px`);
      const videoPath = `${url}/${src.trim()}-${iosWidth}.mp4`;
      console.log(`Loading MP4 source: ${videoPath}`);
      videoElement.src = videoPath;
      videoElement.load();
      console.log(`Loading standard video: ${videoPath}`);
    } catch (error) {
		console.log(`Standard player error: ${error.message}`, 'error');
    }
  }

  function calculateIOSWidth(width) {
  const iosBreakpoints = [
    { maxWidth: 231, value: 230 },
    { maxWidth: 271, value: 270 },
    { maxWidth: 361, value: 360 },
    { maxWidth: 541, value: 540 },
    { maxWidth: 721, value: 720 },
    { maxWidth: 1081, value: 1080 },
    { maxWidth: 1281, value: 1280 },
    { maxWidth: Infinity, value: 1920 }
  ];
  
  for (let i = 0; i < iosBreakpoints.length; i++) {
    if (width < iosBreakpoints[i].maxWidth) {
      return iosBreakpoints[i].value;
    }
  }
  return iosBreakpoints[iosBreakpoints.length - 1].value;
}

function stopAllVideos() {
  videos.forEach(video => {
    const videoElement = document.getElementById(`media-element-${video.vid}`);
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
      console.log(`Stopped video ${video.vid}`);
    }
  });
}

async function playActiveVideo() {
  const activeVideo = videos.find(video => video.vid === active);
  console.log(`=== PLAYING VIDEO ${active} ===`);
  console.log('All videos:', videos.map(v => ({ vid: v.vid, src: v.src, autoplay: v.autoplay })));
  console.log('Active video found:', activeVideo);
  
  if (activeVideo) {
    console.log(`Attempting to play video ${activeVideo.vid}`);
    const videoElement = document.getElementById(`media-element-${activeVideo.vid}`);
    
    if (videoElement) {
      console.log(`Video element found for ${activeVideo.vid}`);
      console.log(`Video element src: ${videoElement.src}`);
      console.log(`Video element readyState: ${videoElement.readyState}`);
      
      // Load the video if it hasn't been loaded yet
      if (!videoElement.src) {
        console.log(`Loading video source for ${activeVideo.vid}`);
        standardPlayer(activeVideo.src, videoElement);
        
        // Wait for the video to load before trying to play
        await new Promise((resolve) => {
          videoElement.addEventListener('loadeddata', resolve, { once: true });
          videoElement.addEventListener('error', resolve, { once: true });
        });
      }
      
      // Ensure video is ready to play
      if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
        console.log(`Playing video ${activeVideo.vid}, autoplay: ${activeVideo.autoplay}`);
        
        if (activeVideo.autoplay) {
          try {
            await videoElement.play();
            console.log(`Successfully started playing video ${activeVideo.vid}`);
            mounted = true
            // Update the playback state to reflect that video is now playing
            import('$lib/stores/videoScroll.js').then(({ setVideoPlaying }) => {
              setVideoPlaying(true);
            });
          } catch (error) {
            console.log(`Autoplay failed for video ${activeVideo.vid}:`, error);
            // If autoplay fails, set the state to false
            import('$lib/stores/videoScroll.js').then(({ setVideoPlaying }) => {
              setVideoPlaying(false);
            });
          }
        } else {
          console.log(`Video ${activeVideo.vid} has autoplay disabled`);
          // For non-autoplay videos, set the state to false
          import('$lib/stores/videoScroll.js').then(({ setVideoPlaying }) => {
            setVideoPlaying(false);
          });
        }
      } else {
        console.log(`Video ${activeVideo.vid} not ready yet, readyState: ${videoElement.readyState}`);
      }
    } else {
      console.log(`Video element not found for video ${activeVideo.vid}`);
    }
  } else {
    console.log(`No video found with vid: ${active}`);
    console.log('Available video IDs:', videos.map(v => v.vid));
  }
}

$effect(() => {
	console.log('Active video changed to:', active);
	
	// Reset progress bar when active video changes
	if (window.navApi) {
		window.navApi.resetVideoProgress();
	}
	
	// Use setTimeout to ensure DOM is ready
	setTimeout(async () => {
		// Stop all videos first
		stopAllVideos();
		
		// Then play the active video
		await playActiveVideo();
	}, 100);
})

// Handle video events
function handleVideoLoad(videoId) {
  console.log(`Video ${videoId} loaded`);
  const videoElement = document.getElementById(`media-element-${videoId}`);
  if (videoElement && videoId === active) {
    const video = videos.find(v => v.vid === videoId);
    
    // Set the correct muted state
    const shouldBeMuted = $isMuted || !video.hasAudio;
    videoElement.muted = shouldBeMuted;
    
    // Set volume for unmuted videos with audio
    if (!shouldBeMuted && video.hasAudio) {
      videoElement.volume = 1.0;
    }
    
    console.log(`Video ${videoId} loaded with muted state: ${shouldBeMuted}, volume: ${videoElement.volume}`);
    
    // Add track event listeners for captions
    if (video?.hasCaptions && video.subs) {
      videoElement.addEventListener('loadstart', () => {
        console.log(`Video ${videoId} load started`);
      });
      
      // Listen for track loading events
      videoElement.addEventListener('loadedmetadata', () => {
        console.log(`Video ${videoId} metadata loaded`);
        // Check if captions are available
        if (videoElement.textTracks && videoElement.textTracks.length > 0) {
          console.log(`Caption tracks found for video ${videoId}:`, videoElement.textTracks.length);
          for (let i = 0; i < videoElement.textTracks.length; i++) {
            const track = videoElement.textTracks[i];
            console.log(`Track ${i}: kind=${track.kind}, label=${track.label}, mode=${track.mode}`);
            if (track.kind === 'captions') {
              track.mode = 'showing';
              console.log(`Caption track ${i} set to showing mode`);
            }
          }
        } else {
          console.log(`No caption tracks found for video ${videoId}`);
          // Try to add caption track dynamically if not present
          if ($showCaptions) {
            addCaptionTrack(videoElement, videoId, video.subs);
          }
        }
      });
      
      // Add caption track if captions are enabled
      if ($showCaptions) {
        // Wait a bit for the video to be ready, then add caption track
        setTimeout(() => {
          if (videoElement.textTracks.length === 0) {
            addCaptionTrack(videoElement, videoId, video.subs);
          }
        }, 100);
      }
    }
    
    if (video?.autoplay) {
      console.log(`Auto-playing video ${videoId} after load`);
      videoElement.play().catch(error => {
        console.log('Autoplay failed for video', videoId, error);
        // If autoplay fails, set the state to false
        import('$lib/stores/videoScroll.js').then(({ setVideoPlaying }) => {
          setVideoPlaying(false);
        });
      });
    } else {
      // For non-autoplay videos, set the state to false
      import('$lib/stores/videoScroll.js').then(({ setVideoPlaying }) => {
        setVideoPlaying(false);
      });
    }
  }
}

// Handle caption track events
function handleCaptionTrackLoad(videoId) {
  console.log(`Caption track loaded successfully for video ${videoId}`);
}

function handleCaptionTrackError(videoId, error) {
  console.error(`Caption track error for video ${videoId}:`, error);
}

// Handle video canplay event
function handleVideoCanPlay(videoId) {
  console.log(`Video ${videoId} can play`);
  const videoElement = document.getElementById(`media-element-${videoId}`);
  if (videoElement && videoId === active) {
    const video = videos.find(v => v.vid === videoId);
    if (video?.autoplay && videoElement.paused) {
      console.log(`Auto-playing video ${videoId} after canplay`);
      videoElement.play().catch(error => {
        console.log('Autoplay failed for video', videoId, error);
        // If autoplay fails, set the state to false
        import('$lib/stores/videoScroll.js').then(({ setVideoPlaying }) => {
          setVideoPlaying(false);
        });
      });
    } else if (!video?.autoplay) {
      // For non-autoplay videos, set the state to false
      import('$lib/stores/videoScroll.js').then(({ setVideoPlaying }) => {
        setVideoPlaying(false);
      });
    }
  }
}

// Handle video play event
function handleVideoPlay(videoId) {
  console.log(`Video ${videoId} started playing`);
  if (videoId === active) {
    import('$lib/stores/videoScroll.js').then(({ setVideoPlaying }) => {
      setVideoPlaying(true);
    });
  }
}

// Handle video pause event
function handleVideoPause(videoId) {
  console.log(`Video ${videoId} paused`);
  if (videoId === active) {
    import('$lib/stores/videoScroll.js').then(({ setVideoPlaying }) => {
      setVideoPlaying(false);
    });
  }
}

// Handle video ended event
function handleVideoEnded(videoId) {
  console.log(`Video ${videoId} ended`);
  if (videoId === active) {
    import('$lib/stores/videoScroll.js').then(({ setVideoPlaying }) => {
      setVideoPlaying(false);
    });
    
    // Check if this video has loop set to false and trigger scroll to next block
    const video = videos.find(v => v.vid === videoId);
    if (video && !video.loop && scrollToNextBlock) {
      console.log(`Video ${videoId} has loop=false, triggering scroll to next block`);
      scrollToNextBlock(videoId);
    }
  }
}

// Handle video timeupdate event for progress tracking
function handleVideoTimeUpdate(videoId) {
  if (videoId === active) {
    const videoElement = document.getElementById(`media-element-${videoId}`);
    if (videoElement && window.navApi) {
      const currentTime = videoElement.currentTime;
      const duration = videoElement.duration;
      if (duration > 0) {
        window.navApi.updateVideoProgress(currentTime, duration);
      }
    }
  }
}

// Handle video audio events for debugging
function handleVideoAudioEvent(videoId, eventType) {
  const videoElement = document.getElementById(`media-element-${videoId}`);
  if (videoElement) {
    console.log(`Video ${videoId} ${eventType}: muted=${videoElement.muted}, volume=${videoElement.volume}, readyState=${videoElement.readyState}`);
  }
}

// Test audio functionality
function testAudioFunctionality(videoId) {
  const videoElement = document.getElementById(`media-element-${videoId}`);
  if (videoElement) {
    console.log(`=== TESTING AUDIO FOR VIDEO ${videoId} ===`);
    console.log(`Video element:`, {
      muted: videoElement.muted,
      volume: videoElement.volume,
      readyState: videoElement.readyState,
      paused: videoElement.paused,
      currentTime: videoElement.currentTime,
      duration: videoElement.duration
    });
    
    const video = videos.find(v => v.vid === videoId);
    console.log(`Video data:`, {
      hasAudio: video?.hasAudio,
      controls: video?.controls
    });
    
    // Try to unmute and set volume
    videoElement.muted = false;
    videoElement.volume = 1.0;
    console.log(`After unmuting: muted=${videoElement.muted}, volume=${videoElement.volume}`);
  }
}

// Function to add caption track to video element
function addCaptionTrack(videoElement, videoId, subsPath) {
  try {
    const captionPath = `${url}/${subsPath}`;
    console.log(`Adding caption track to video ${videoId}: ${captionPath}`);
    
    // Create track element
    const track = document.createElement('track');
    track.kind = 'captions';
    track.label = 'English';
    track.srclang = 'en-us';
    track.default = true;
    track.src = captionPath;
    
    // Add event listeners to track
    track.addEventListener('load', () => {
      console.log(`Caption track loaded successfully for video ${videoId}`);
    });
    
    track.addEventListener('error', (e) => {
      console.error(`Caption track error for video ${videoId}:`, e);
    });
    
    // Add track to video
    videoElement.appendChild(track);
    console.log(`Caption track added to video ${videoId}`);
    
    return true;
  } catch (error) {
    console.error(`Error adding caption track to video ${videoId}:`, error);
    return false;
  }
}

</script>   

<Nav {showControls} {hasCaptions} hasAudio={activeVideoHasAudio} color={colour} />

<div id="sunscreen" class:lunar={overlay} class:solar={!overlay}></div>

<div 
	class="background" 
	>
    {#each videos as video}
      <div 
        class="panel" 
        class:cinema-foreground={video.vid === active} 
        class:cinema-background={video.vid !== active} 
        data-id={video.vid}
      >
        {#if video.vid === active}
          <div class="video-wrapper {video.display}">
            <video
              id="media-element-{video.vid}"
              class="frontline-media"
              playsinline
              preload="auto"
              data-id={video.vid}
              muted={$isMuted || !video.hasAudio}
              loop={video.loop}
              poster={`${url}/${video.src}.jpg`}
              crossorigin="anonymous"
              on:loadeddata={() => handleVideoLoad(video.vid)}
              on:canplay={() => handleVideoCanPlay(video.vid)}
              on:play={() => handleVideoPlay(video.vid)}
              on:pause={() => handleVideoPause(video.vid)}
              on:ended={() => handleVideoEnded(video.vid)}
              on:timeupdate={() => handleVideoTimeUpdate(video.vid)}
              on:loadedmetadata={() => console.log(`Video ${video.vid} metadata loaded`)}
              on:volumechange={() => handleVideoAudioEvent(video.vid, 'volumechange')}
              on:canplaythrough={() => handleVideoAudioEvent(video.vid, 'canplaythrough')}
              on:loadstart={() => console.log(`Video ${video.vid} load started`)}
            >
              <!-- Caption tracks loading dynamically via JavaScript -->
            </video>
          </div>
        {:else}
          <div class="video-wrapper {video.display}"></div>
        {/if}
      </div>
    {/each}
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
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		background-image: linear-gradient(to right, #2f262e, transparent);
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

	video::cue  {
	font-size:26px;
	background-color: transparent;
	color:#ffbc01;

	  	text-shadow:
	   -1px -1px 0px #000,  
	    1px -1px 0px #000,
	    -1px 1px 0px #000,
	     1px 1px 0px #000;

	}

	@media (max-width: 480px) {
		video::cue  {
			font-size:16px;

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
        content: '';
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
        content: '';
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
        opacity: .9; 
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
        opacity: .9; 
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
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-image: linear-gradient(to top, black, transparent);
    }
}

.lunar {
    opacity: 1; // Visible when lunar is active

    &:before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-image: linear-gradient(to top, black, transparent);
    }
}

  </style>