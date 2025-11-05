<script>
  // Props for configurable content
  export let title = "Read more";
  export let credits = [
    { role: "Reporter", name: "Adam Morton" },
    { role: "Video producer", name: "David Fanner" },
    { role: "Design and development", name: "Nick Evershed and Andy Ball" },
    { role: "Executive producer", name: "Marni Cordell" }
  ];
  export let inspiration = {
    title: "Inspired by",
    link: "https://www.washingtonpost.com/graphics/2019/national/gone-in-a-generation/",
    text: "Gone in a generation",
    source: "by the Washington Post"
  };
</script>

<footer class="footer-container">
  <div class="footer" id="footer">
    <h2>{title}</h2>
    
    <div id="the-frontline-series" class="footer-wrapper"></div>
    
    <div class="credits-section">
      <div class="credits-column">
        <h2>Credits</h2>
        <div class="credits-inner">
          {#each credits as credit}
            <p class="credit-line">
              <span class="role">{credit.role}:</span> {credit.name}
            </p>
          {/each}
        </div>
      </div>

      <div class="credits-column">
        <h2>{inspiration.title}</h2>
        <div class="credits-inner">
          <p class="credit-line">
            <a href={inspiration.link} target="_blank" rel="noopener noreferrer">
              {inspiration.text}
            </a> {inspiration.source}
          </p>
        </div>
      </div>
    </div>
  </div>
</footer>

<style lang="scss">
  .footer-container {
    width: 100%;
    background-color: black;
    color: white;
    border-top: 2px solid white;
  }

  .footer {
    margin: 0 auto;
    padding-bottom: 40px;
    max-width: 1100px;
    
    h2 {
      color: #bdbdbd;
      margin: 10px;
      
      @include mq($until: tablet) {
        margin-left: 10px;
      }
    }

    .footer-wrapper {
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
        text-decoration: underline;
        
        &:hover {
          color: #ffe500;
        }
      }
    }

    // Responsive breakpoints
    /*
    @each $bp in (tablet, desktop, leftCol, wide) {
      @include mq($bp) {
        width: map-get($mq-breakpoints, $bp);
      }
    }

    */
  }
</style>