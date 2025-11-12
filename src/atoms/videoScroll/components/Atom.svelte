<script >
  import { onMount } from 'svelte'
  import Header from './Header.svelte'
  import Progress from './Progress.svelte'
  import Videos from './Videos.svelte'
  import Footer from './Footer.svelte'
  import Skip from './Skip.svelte'
  import Graphic from './Graphic.svelte'
  import { getJson } from '$lib/helpers/guardian/toolbelt'
  import { showCaptions, isMuted, toggleCaptions, toggleMuted } from '$lib/stores/videoScroll.js'

  let application = null;
  let episode = 4; //
  let videos = $state([])
  let active = $state(0)
  let overlay = $state(false)
  let observer = $state(null);
  let testing = $state(false)
  let progress = $state(0)
  let colour = $state('#c70000')
  let imagePath = $state('https://interactive.guim.co.uk/atoms/2020/02/frontline-episode-4/v/1582496332421/assets')

  // Constants
  const DATA_URL = 'https://interactive.guim.co.uk/docsdata/1w0ugQ5gR8nrSXogJ-foN1IEp9vMzKQ1hMVBMeaddG_k.json'
  const OBSERVER_OPTIONS = {
    root: null,
    rootMargin: '-30% 0px -30% 0px',
    threshold: [0, 0.25, 0.5, 0.75, 1]
  }

  // Calculate scroll progress percentage
  function updateScrollProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrollPercentage = (scrollTop / scrollHeight) * 100
    
    progress = Math.min(Math.max(scrollPercentage, 0), 100) // Clamp between 0-100
  }

  // Effect to log active state changes
  $effect(() => {
    console.log('Active state changed to:', active)
    console.log('Available video IDs:', videos.map(v => v.vid))
    const activeVideo = videos.find(v => v.vid === active)
    console.log('Active video found:', activeVideo)
  })

  async function loadVideos() {
    try {
      const data = await getJson(DATA_URL)
      let film = data.sheets[`episode-${episode}`]
      film.forEach(video => {
        console.log(`Raw video ${video.vid} data:`, video);
        video.vid = +video.vid
        video.hasAudio = video.hasAudio === 'TRUE' ? true : false ; 
        video.loop = video.loop === 'TRUE' ? true : false ; 
        video.controls = video.controls === 'FALSE' ? false : true ; 
        
        // If video has controls, it likely has audio (as per user feedback)
        if (video.controls && !video.hasAudio) {
          console.log(`Video ${video.vid} has controls but no hasAudio flag - assuming it has audio`);
          video.hasAudio = true;
        }
        
        console.log(`Video ${video.vid} data:`, { 
          vid: video.vid, 
          hasAudio: video.hasAudio, 
          controls: video.controls,
          autoplay: video.autoplay,
          overlay: video.overlay,
          display: video.display,
          subs: video.subs
        })
        video.autoplay = true //video.autoplay === 'TRUE' ? true : false ; 
        video.overlay = video.overlay === 'TRUE' ? true : false ; 
        video.display = 'standard'
        video.hasCaptions = video.subs != '' ? true : false ; 
        console.log(`Video ${video.vid} caption data:`, { subs: video.subs, hasCaptions: video.hasCaptions })
      })
      videos = film
      console.log('Videos loaded:', videos)
    } catch (error) {
      console.error('Failed to load videos:', error)
    }
  }

  function scrollToNextBlock(currentBlockId) {
    const nextBlockId = currentBlockId + 1
    const blocks = document.querySelectorAll('.block');
    const nextBlock = blocks[nextBlockId]
    
    if (nextBlock) {
        console.log(`Scrolling to next block: ${nextBlockId}`)
        setTimeout(function() {
            // Pause all videos
            var elementTop = window.pageYOffset + nextBlock.getBoundingClientRect().top - ( window.innerHeight / 2 )
            window.scroll({
                top: elementTop,
                behavior: "smooth"
            });

            }, 100);

    } else {
      console.log(`No next block found for block ${currentBlockId}`)
      console.log('Available blocks:', document.querySelectorAll('.block').length)
    }
  }

  onMount(async () => {
    await loadVideos()
    // Orientation detection for serving portrait vs landscape URLs
    orientationMql = window.matchMedia('(orientation: portrait)')
    isPortrait = orientationMql.matches
    if (orientationMql.addEventListener) {
      orientationMql.addEventListener('change', handleOrientationChange)
    } else if (orientationMql.addListener) {
      // Safari fallback
      orientationMql.addListener(handleOrientationChange)
    }
    
    // Set up intersection observer with a small delay to ensure DOM is ready
    setTimeout(setupBlockObserver, 100)

    // Add scroll event listener for progress tracking
    window.addEventListener('scroll', updateScrollProgress)
    
    // Initial progress calculation
    updateScrollProgress()

    // Cleanup on component destroy
    return () => {
      if (observer) {
        observer.disconnect()
      }
      window.removeEventListener('scroll', updateScrollProgress)
      if (orientationMql) {
        if (orientationMql.removeEventListener) {
          orientationMql.removeEventListener('change', handleOrientationChange)
        } else if (orientationMql.removeListener) {
          orientationMql.removeListener(handleOrientationChange)
        }
      }
    }
  })

  function setupBlockObserver() {
    console.log('Setting up block observer...')
    
    // Clean up existing observer
    if (observer) {
      observer.disconnect()
    }

    observer = new IntersectionObserver((entries) => {
      console.log('=== INTERSECTION OBSERVER TRIGGERED ===')
      entries.forEach((entry) => {
        const blockId = entry.target.getAttribute('data-id')
        const intersectionRatio = entry.intersectionRatio
        console.log(`Block ${blockId}: intersecting=${entry.isIntersecting}, ratio=${intersectionRatio.toFixed(2)}`)
        
        if (entry.isIntersecting) {
          if (blockId !== null) {
            console.log(`Setting active block to: ${blockId}`)
            active = +blockId
          }
        }
      })
    }, OBSERVER_OPTIONS)

    // Observe all blocks
    const blocks = document.querySelectorAll('.block')
    console.log('Found blocks:', blocks.length)
    blocks.forEach((block) => {
      const blockId = block.getAttribute('data-id')
      console.log(`Observing block: ${blockId}`)
      observer.observe(block)
    })
  }

  let clientWidth = $state(0)
  let isPortrait = $state(false)
  let orientationMql = null

  function handleOrientationChange(e) {
    isPortrait = e.matches
  }
</script>


<div class="interactive-wrapper atmosphere" style="--scroll-icon-color: {colour}" bind:clientWidth={clientWidth}>

      <Progress {progress} progressColor={colour} />

      {#if testing}
      <div style="position: fixed; top: 10px; left: 10px; background: red; color: white; padding: 10px; z-index: 10000; font-family: monospace;">
        Active: {active}
      </div>
      {/if}
      
      {#if videos.length > 0}
          <Videos {videos} {active} {scrollToNextBlock} {colour} url={isPortrait ? 'https://interactive.guim.co.uk/embed/aus/2025/06/frontline-mobile' : 'https://interactive.guim.co.uk/embed/aus/2025/06/frontline'} />
      {/if}

      <div class="blocks">

          <div class="block top" style="margin-top:50px;margin-bottom:100vh;"  data-id="0">

              <div class="block-placeholder" data-id="0">
                  
                <Header 
                    headline="Inside Australia's climate emergency: the dead sea" 
                    standfirst="The ocean around southern Australia is a global heating hotspot. One man has watched entire sea forests disappear in his lifetime." 
                    tag="The frontline" 
                />

              </div>

          </div>

          <div class="block" style="margin-top:100vh;margin-bottom:100vh;"  data-id="1">

              <div class="block-inner"></div>

              <div class="block-placeholder" data-id="1"></div>

          </div>

          <div class="block text" style="margin-top:100vh;margin-bottom:100vh;"  data-id="2">

              <div class="block-inner">
                  
                  <div class="text body">

                      <img src="{imagePath}/oceans-locator.png" class="locator"/>

                      <p>There are few places in the world where you can dive among giant kelp forests like those that used to flourish along the Tasmanian east coast. </p>

                      <p>Growing up to 40 metres from the ocean floor, the forests protected a vibrant ecosystem of sponge garden, fur seals, crayfish, weedy sea dragons and countless fish species.</p>

                      <p>Mick Baron, a dive instructor and trained biologist, has watched them disappear.</p>

                      <p>The forests started to die in the north of Tasmania in the 1960s. Baron first noticed them vanishing from Deep Glen Bay, a short boat ride north-east of his dive centre at Eaglehawk Neck, in the late 1990s.</p>

                      <p>The sea along the Tasmanian east coast is a global heating hotspot. Temperatures there have risen at nearly four times the global average. </p>

                      <p>They are about 2C hotter than a little over a century ago.</p>

                      <p>Warm water pushed down the coast by the east Australian current has stripped the area of nutrients, brought new marine species, and killed more than 95% of the giant kelp. The impact on local ecosystems and fisheries has been severe.</p>

                      <p>"Our whole ocean has effectively shifted to the south," Baron says.</p>

                      <div class="skip-btn-container">
                          <div class="skip-btn" data-id="2" on:click={() => scrollToNextBlock(2)}>
                            <Skip color={colour} />
                          </div>
                      </div>

                  </div>
                  
              </div>

              <div class="block-placeholder" data-id="2"></div>

          </div>

          <div class="block" style="margin-top:100vh;margin-bottom:100vh;"  data-id="3">

              <div class="block-placeholder" data-id="3"></div>

          </div>

          <div class="block text" style="margin-top:100vh;margin-bottom:100vh;"  data-id="4">

              <div class="block-inner">
                  
                  <div class="text body">

                      <p>Ocean temperatures vary less than those on land and aquatic species are not adept at adjusting to rapid shifts. In Tasmania, this has been exacerbated by extreme marine heatwaves in three of the past five years.</p>

                      <p>Scientists have linked the heatwaves to rising greenhouse gas emissions.</p>

                      <p>Cayne Layton, a marine ecologist at the University of Tasmania's institute for marine and Antarctic studies, says the fallout has made the Australian state a "sad poster child" for global climate change.</p>

                  </div>

                  <div class="graphic-container">
                    <div class="multimedia">
                        <!--Graphic /-->
                      </div>
                  </div>

                  <div class="text body">    

                      <p>"It's one of the worst, if not the worst, place in the world for kelp forest loss," he says. "The composition of the ocean community has nearly completely changed."</p>

                      <p>Part of the change is basic chemistry: warm water has fewer nutrients than cool water and kelp forests, which do not have roots, need nutrient-rich water to grow.</p>

                      <p>The warmer water also brought new species like the long-spined sea urchin. </p>

                      <p>Scientists found a nearly 50% increase in urchin numbers in Tasmanian rocky reef habitat over the 15 years to 2016, equivalent to 200,000 additional urchins along the coast each year.</p>

                      <p>The urchins, Baron says, have left the ocean floor "like an asphalt driveway".</p>

                      <div class="skip-btn-container">
                          <div class="skip-btn" data-id="4" on:click={() => scrollToNextBlock(4)}>
                            <Skip color={colour} />
                          </div>
                      </div>

                  </div>
                  
              </div>

              <div class="block-placeholder" data-id="4"></div>

          </div>

          <div class="block" style="margin-top:100vh;margin-bottom:100vh;"  data-id="5">

              <div class="block-placeholder" data-id="5"></div>

          </div>

          <div class="block text" style="margin-top:100vh;margin-bottom:100vh;"  data-id="6">

              <div class="block-inner">
                  
                  <div class="text body">

                      <p>Tasmanian waters are also now home to species of kingfish, snapper and octopus that have migrated south from New South Wales. Numbers of once prevalent species have been significantly reduced.</p>

                      <p>The state's huge abalone industry has been forced to reduce its catch by about 40% since 2016 due to the impact of higher temperatures and over-fishing. Some say a larger reduction is needed to give the abalone population a chance to recover.</p>

                      <p>Crayfish, or rock lobsters, which lived in the kelp forests, have been similarly affected. Pacific oyster stocks have been hit by Pacific oyster mortality syndrome, a fast-acting virus that takes hold when the mollusc is stressed by higher water temperatures. Some oyster farms lost their entire stock.</p>

                      <p>Alistair Hobday, a CSIRO senior principal research scientist, says: "It is frustrating, as people feel powerless."</p>

                      <p>Adaptation programs offer some hope. For example, a selective breeding program for a resistant oyster has helped that industry recover. "But we need the research and regulatory support to develop solutions," Hobday says.</p>

                      <div class="skip-btn-container">
                          <div class="skip-btn" data-id="6" on:click={() => scrollToNextBlock(6)}>
                            <Skip color={colour} />
                          </div>
                      </div>

                  </div>

              </div>

              <div class="block-placeholder" data-id="6"></div>

          </div>

          <div class="block" style="margin-top:100vh;margin-bottom:100vh;"  data-id="7">

              <div class="block-placeholder" data-id="7"></div>

          </div>

          <div class="block text" style="margin-top:100vh;"  data-id="8">

              <div class="block-inner">
                  
                  <div class="text body">

                      <p>Baron says there is still beauty to be found along the Tasmanian east coast, but the "three-dimensional" perspective of swimming in giant forests has gone.</p>

                      <p>Scientists are working to develop strains of giant kelp that can thrive in warmer water, but even if it is successful they say it will not replace what was lost. </p>

                      <p>Baron's voice cracks when he considers that his two young grandchildren won't be able to experience what he grew up with.</p>

                      <p>"It's distressing," he says. "This is the cost of climate change."</p>

                  </div>  

                </div>

              <div class="block-placeholder" data-id="8"></div>

          </div>

      </div>

  <Footer />

</div>

<style lang="scss">

  .interactive-wrapper {
    width: 100%;
    overflow: hidden;
    color: white;

    .blocks {
      z-index: 2;
      margin-top: 0.75rem;

      // Text and multimedia blocks
      .block .text, .block .multimedia {
        margin: auto;
        max-width: 780px;
        text-align: center;

        @include mq($until: mobile) {
          padding: 10px;
        }

        @include mq($from: mobile, $until: mobileLandscape) {
          padding: 40px 10px;
        }

        @include mq($from: mobileLandscape, $until: tablet) {
          padding: 40px;
        }

        @include mq($from: tablet, $until: desktop) {
          padding: 40px;
        }
      }

      .block {
        position: relative;

        &:after, &:before {
          content: '';
          display: table;
        }

        &:after {
          clear: both;
        }

        .block-placeholder {
          min-height: 200vh;
        }

        // Consolidated body text styles
        .body p, p.body {
          font-family: "Guardian Text Egyptian Web", Georgia, serif;
          font-size: 19px;
          line-height: 145%;
          margin: auto;
          padding-bottom: 19px;
          text-align: left;
        }

        .locator {
          margin: auto;
          text-align: center;
          max-width: 480px;
          width: 100%;
        }

        .graphic-container {
          width: 100%;
          display: inline-block;
          background-color: rgba(0, 0, 0, 0.5);
          margin-bottom: 19px;

          .multimedia img {
            width: 100%;
          }
        }

        .action-container {
          width: 100%;
          display: inline-block;

          .multimedia img {
            width: 100%;
          }
        }

        .contributions__title {
          font-size: 1.25rem;
          line-height: 1.4375rem;
          font-family: "Guardian Egyptian Web", Georgia, serif;
          font-weight: 900;
          margin-bottom: 0.75rem;
        }

        .intro-slide-inner {
          padding-top: 30vh;

          @include mq($until: mobile) {
            padding: 40px;
          }

          @include mq($from: mobile, $until: mobileLandscape) {
            padding: 40px;
          }

          @include mq($from: mobileLandscape, $until: tablet) {
            padding: 40px;
          }

          @include mq($from: tablet, $until: desktop) {
            padding: 40px;
          }

          .intro-slide {
            position: relative;
            background-color: #00000082;
            max-width: 780px;
            margin-bottom: 0;
            opacity: 1;
            height: auto;
            transition: 1.5s ease-in-out transform, 1.5s ease-in-out opacity;
            display: flex;
            align-items: center;
            transform: translateY(-20px);
            padding: 20px;

            .intro {
              background-image: linear-gradient(black, rgba(0, 0, 0, 0.75) 60%, rgba(0, 0, 0, 0.45) 80%, rgba(0, 0, 0, 0) 100%);
              transition: all ease-in-out 1s;
            }
          }

          @media (max-width: 768px) {
            .intro-slide {
              display: inherit;
            }
          }
        }
      }

      .text .block-placeholder {
          min-height: 0;
      }	

      .top .block-placeholder {
          min-height: 100vh;
      }	

      .skip-btn-container {
        width: 100%;
        height: 51px;
        position: relative;
      }

      .skip-btn {
        width: 50px;
        height: 50px;
        margin: auto;
        cursor: pointer;
        z-index: 90;
        opacity: 0.8;
      }

    }
  }
</style>
