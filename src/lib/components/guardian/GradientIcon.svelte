<script>

    export let previous;
    export let next;
    export let styles = {};
  
    const defaultStyles = {
      svg: "_svg_ihy3w_6",
      previous: "_previous_ihy3w_12",
      next: "_next_ihy3w_16"
    };
  
    function mergeStyles(defaults, custom) {
      return { ...defaults, ...custom };
    }
  
    const mergedStyles = mergeStyles(defaultStyles, styles);
  
    const gradientId = "gradient-" + Math.random().toString(36).substring(2, 9);

  </script>
  
  <style lang="scss">
    /* Guardian gradient stop color utility classes adapted from component.scss */
    .stop-color--con { stop-color: var(--con); }
    .stop-color--lab { stop-color: var(--lab); }
    .stop-color--libdem { stop-color: var(--libdem); }
    .stop-color--green { stop-color: var(--green); }
    .stop-color--ukip { stop-color: var(--ukip); }
    .stop-color--snp { stop-color: var(--snp); }
    .stop-color--dup { stop-color: var(--dup); }
    .stop-color--alliance { stop-color: var(--alliance); }
    .stop-color--alba { stop-color: var(--alba); }
    .stop-color--uup { stop-color: var(--uup); }
    .stop-color--sdlp { stop-color: var(--sdlp); }
    .stop-color--pc { stop-color: var(--pc); }
    .stop-color--sf { stop-color: var(--sf); }
    .stop-color--reform { stop-color: var(--reform); }
    .stop-color--ind { stop-color: var(--ind); }
    .stop-color--other { stop-color: var(--other); }
    .stop-color--speaker { stop-color: var(--speaker); }
    .stop-color--undeclared { stop-color: var(--undeclared); }
    .stop-color--noc { stop-color: var(--noc); }
    .stop-color--wpb { stop-color: var(--wpb); }
    /* Add more as needed based on palette */
    ._svg_ihy3w_6 {
      width: 24px;
      height: 11px;
      display: block;
    }
  </style>
  
  <svg
    class={mergedStyles.svg}
    width="24"
    height="11"
    viewBox="0 0 24 11"
    xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient
        id={gradientId}
        x1="5.5"
        y1="5.5"
        x2="12"
        y2="5.5"
        gradientUnits="userSpaceOnUse">
        <stop
          class={`${mergedStyles.previous} stop-color--${previous.toLowerCase()}`} />
        <stop
          class={`${mergedStyles.next} stop-color--${next.toLowerCase()}`}
          offset="1" />
      </linearGradient>
    </defs>
    <path
      d="M0 5.434C0 2.43288 2.43288 0 5.434 0H5.69626C6.85818 0 7.9797 0.426401 8.84813 1.19834C10.6456 2.79612 13.3544 2.79612 15.1519 1.19834C16.0203 0.426401 17.1418 0 18.3037 0L18.566 0C21.5671 0 24 2.43288 24 5.434V5.566C24 8.56712 21.5671 11 18.566 11H18.3037C17.1418 11 16.0203 10.5736 15.1519 9.80166C13.3544 8.20388 10.6456 8.20388 8.84813 9.80166C7.9797 10.5736 6.85818 11 5.69626 11H5.434C2.43288 11 0 8.56712 0 5.566V5.434Z"
      fill={"url(#" + gradientId + ")"}
    />
  </svg>
  