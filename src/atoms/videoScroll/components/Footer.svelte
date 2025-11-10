<script>
  // Props for configurable content
  export let title = "Read more"
  export let credits = [
    { role: "Reporter", name: "Adam Morton" },
    { role: "Video producer", name: "David Fanner" },
    { role: "Design and development", name: "Nick Evershed and Andy Ball" },
    { role: "Executive producer", name: "Marni Cordell" },
  ]

  export let videos = [
    {
      title: "The new fire zone",
      link: "https://www.theguardian.com/environment/ng-interactive/2020/feb/12/living-in-the-climate-emergency-australias-new-fire-zone",
      src: "https://interactive.guim.co.uk/embed/aus/2020/frontline/footer-vids/binna_burra.mp4",
    },
    {
      title: "The taps run dry",
      link: "https://www.theguardian.com/environment/ng-interactive/2020/feb/17/a-climate-emergency-what-happens-when-the-taps-run-dry",
      src: "https://interactive.guim.co.uk/embed/aus/2020/frontline/footer-vids/no_water.mp4",
    },
    {
      title: "The air we breathe",
      link: "https://www.theguardian.com/environment/ng-interactive/2020/feb/20/the-toxic-air-we-breathe-the-health-crisis-from-australias-bushfires",
      src: "https://interactive.guim.co.uk/embed/aus/2020/frontline/footer-vids/air_quality.mp4",
    },
    {
      title: "The dead sea",
      link: "https://www.theguardian.com/environment/ng-interactive/2020/feb/24/the-dead-sea-tasmanias-underwater-forests-disappearing-in-our-lifetime",
      src: "https://interactive.guim.co.uk/embed/aus/2020/frontline/footer-vids/fisheries.mp4",
    },
    {
      title: "The killer heat",
      link: "https://www.theguardian.com/environment/ng-interactive/2020/feb/27/killer-heat-how-a-warming-land-is-changing-australia-forever",
      src: "https://interactive.guim.co.uk/embed/aus/2020/frontline/footer-vids/rising_heat.mp4",
    },
    {
      title: "The lost harvest",
      link: "https://www.theguardian.com/environment/ng-interactive/2020/mar/02/from-grape-to-grain-how-a-warming-climate-is-changing-the-food-australia-produces",
      src: "https://interactive.guim.co.uk/embed/aus/2020/frontline/footer-vids/wine_region.mp4",
    },
  ]
</script>

<footer class="footer-container">
  <div class="footer">
    <h2 class="src-headline-bold-20">{title}</h2>

    <div class="footer-video-thumbnails">
      <ul class="footer-grid">
        {#each videos as vid}
          <li>
            <div class="footer-item-container">
              <video
                playsinline="true"
                autoplay="true"
                loop="true"
                nocontrols="true"
                muted="true"
                class="footervid"
              >
                <source src={vid.src} type="video/mp4" />
              </video>
              <div class="footer-text-content">
                <h2 class="src-headline-bold-20">{vid.title}</h2>
              </div>
              <a
                class="anchor"
                href={vid.link}
                target="_blank"
                aria-label={vid.title}
                data-ignore='global-link-styling'
              ></a>
            </div>
          </li>
        {/each}
      </ul>
    </div>

    <div class="credits-section">
      <div class="credits-column">
        <h2 class="src-headline-bold-20">Credits</h2>
        <div class="credits-inner">
          {#each credits as credit}
            <p class="credit-line">
              <span class="role">{credit.role}:</span>
              {credit.name}
            </p>
          {/each}
        </div>
      </div>

      <!--div class="credits-column">
        <h2 class="src-headline-bold-20"></h2>
        <div class="credits-inner">
          <p class="credit-line"></p>
        </div>
      </div-->
    </div>
  </div>
</footer>

<style lang="scss">
  .footer-container {
    width: 100%;
    background-color: black;
    color: white;
    border-top: 2px solid white;
    position: relative;
    padding: 20px;
  }

  .footer {
    $footer-breakpoints: (
      tablet: 740px,
      desktop: 980px,
      leftCol: 1140px,
      wide: 1300px,
    );

    h2 {
      color: #bdbdbd;
      margin: 10px;

      @include mq($until: tablet) {
        margin-left: 10px;
      }
    }

    .footer-video-thumbnails {
      width: 100%;
    }

    .credits-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;

      @include mq($until: tablet) {
        grid-template-columns: 1fr;
        gap: 15px;
      }
    }

    .credits-column {
      h2 {
        color: #bdbdbd;
        margin-bottom: 10px;
      }
    }

    .credits-inner {
      padding: 10px;
      box-sizing: border-box;
    }

    .credit-line {
      margin: 8px 0;
      line-height: 1.4;

      .role {
        font-weight: bold;
      }

      a {
        color: inherit;
        text-decoration: none;

        &:hover {
          color: #ffe500;
        }
      }
    }

    .footer-grid {
      margin: 0;
      padding: 0;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr; // mobile default: 1 column
      column-gap: 20px; // horizontal spacing between columns
      row-gap: 20px; // vertical spacing between rows
      margin-bottom: 20px;

      // Between mobile and tablet: 2 columns
      @include mq($from: phablet, $until: tablet) {
        grid-template-columns: repeat(2, 1fr);
      }

      // Tablet and above: 3 columns
      @include mq($from: tablet) {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    .footer-grid li {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .footer-grid li .footer-item-container {
      width: 100%;
      aspect-ratio: 16 / 9;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
      color: #fff;
    }
    .footer-grid li .footer-item-container .footervid {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .footer-grid li .footer-item-container {
      background-color: black;
    }
    .footer-grid li .footer-item-container .footer-text-content {
      position: absolute;
      top: 0px;
      bottom: 0px;
      left: 0px;
      right: 0px;
      padding: 20px;
      box-sizing: border-box;
      z-index: 300;
      pointer-events: none;
    }
    .footer-grid li .footer-item-container h2 {
      font-size: 24px;
      font-weight: 500;
      margin: 0.05em 0;
      line-height: 30px;
      color: inherit;
    }
    .footer-grid li .footer-item-container a {
      color: inherit;
      background: #000;
      background: linear-gradient(
        166deg,
        rgba(0, 0, 0, 0.874387) 0%,
        rgba(255, 255, 255, 0) 46%
      );
    }
    .footer-grid li .footer-item-container .anchor {
      position: absolute;
      z-index: 200 !important;
      top: 0;
      right: 0;
      left: 0;
      bottom: 0;
    }
    // (grid handles responsive layout; no extra mobile overrides required)

  }
</style>
