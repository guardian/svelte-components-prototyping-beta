<!-- BannerAdvert.svelte -->
<div class="guardianista">
    <div class="gm-epic">
      <h2 class="gm-headline">Support the Guardian</h2>
      <p class="gm-copy">
        We're reader-funded, not billionaire-backed. Support rigorous, independent journalism at a time when it has never mattered more.
      </p>
      <a data-ignore="global-link-styling"
        class="gm-btn"
        href="https://support.theguardian.com/au/contribute?promoCode=75OFFELECTIONAUS&utm_medium=ACQUISITIONS_EDITORIAL_LINK&utm_campaign=auselection25&utm_content=resultspage&utm_term=resultspage&utm_source=GUARDIAN_WEB"
        target="_blank"
        rel="noopener noreferrer"
      >
        Show your support
      </a>
    </div>
  </div>
  
  <style lang="scss">
  $guardian-blue: #052962;
  $teal: #005689;
  $off-white: #fbf6ef;
  $yellow: #ffe500;
  
  $font-headline: "Guardian Headline Full", "Guardian Headline", "Guardian Egyptian Web", Georgia,
    serif;
  $font-sans: "Guardian Text Sans Web", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
  
  .guardianista {
    width: 100%;
    display: block;
  
    a {
      color: $teal;
      text-decoration: none;
      font-family: $font-headline;
  
      &, &:visited, &:hover, &:active {
        color: $teal;
      }
    }
  
    .gm-epic {
      background-color: $off-white;
      color: $guardian-blue;
      padding: 20px;
      font-family: $font-headline;
      font-size: 32px;
      line-height: 32px;
      position: relative;
      box-sizing: border-box ;
  
      .gm-headline,
      .gm-copy {
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        font-feature-settings: "kern";
        font-kerning: normal;
        font-variant-ligatures: common-ligatures;
        color: $guardian-blue;
        line-height: 120%;;
      }
  
      .gm-headline {
        font-weight: 700;
        margin: 0 0 10px;
        font-size: 28px;
      }
  
      .gm-copy {
        font-weight: 200;
        margin: 0 0 10px;
        font-family: "Guardian Headline Full", "Guardian Headline", "Guardian Egyptian Web", Georgia, serif;
        line-height: 32px;
        font-size: 24px;
        font-weight: 200;
        max-width: none;
      }
  
      .gm-btn {
        display: inline-block;
        font-family: $font-sans !important;
        font-size: 17px;
        font-weight: 600;
        line-height: 19px;
        padding: 10px 18px;
        background-color: $yellow;
        border-radius: 20px;
        color: $guardian-blue !important;
        margin-top: 16px;
        cursor: pointer;
        touch-action: manipulation;
      }
    }
  }
  </style>
  