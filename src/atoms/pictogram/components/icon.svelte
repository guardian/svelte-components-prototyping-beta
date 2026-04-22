<script module>
  let clipSerial = 0
</script>

<script>
  let {
    fill = 'red',
    emptyFill = 'lightgrey',
    fillPercent = undefined,
  } = $props()

  /** Unique per instance so many icons can share one page. */
  const clipId = `g-icon-clip-${clipSerial++}`

  const p =
    fillPercent === undefined || fillPercent === null
      ? null
      : Math.min(100, Math.max(0, Number(fillPercent)))

  const usePartial = p !== null && p > 0 && p < 100
  const solidColor =
    p === null ? fill : p <= 0 ? emptyFill : p >= 100 ? fill : null

  /** Left p% of the icon bbox (objectBoundingBox: origin top-left, L→R). */
  const clipW = p === null ? 1 : p / 100
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  version="1.1"
  viewBox="0 0 70 173.2"
  preserveAspectRatio="xMidYMid meet"
  class="guardian-icon"
>
  <!-- Generator: Adobe Illustrator 30.3.0, SVG Export Plug-In . SVG Version: 2.1.3 Build 182)  -->
  {#if usePartial}
    <defs>
      <clipPath id={clipId} clipPathUnits="objectBoundingBox">
        <rect x="0" y="0" width={clipW} height="1" />
      </clipPath>
    </defs>
    <g class="icon-empty">
      <circle cx="35" cy="15" r="14.1" fill={emptyFill} />
      <path
        fill={emptyFill}
        d="M68.6,53.5v-3.7c0-9.7-7.9-17.6-17.6-17.6h-31.9c-9.7,0-17.6,7.9-17.6,17.6v3.7s0,0,0,0v40.6c0,3.3,2.7,6.1,6.1,6.1s6.1-2.7,6.1-6.1v-39.2h3.5v108c0,4.5,3.6,8.1,8.1,8.1s8.1-3.6,8.1-8.1v-61.4h3.4v61.4c0,4.5,3.6,8.1,8.1,8.1s8.1-3.6,8.1-8.1V54.9h3.5v39.2c0,3.3,2.7,6.1,6.1,6.1s6.1-2.7,6.1-6.1v-40.6s0,0,0,0Z"
      />
    </g>
    <g clip-path={`url(#${clipId})`}>
      <circle cx="35" cy="15" r="14.1" fill={fill} />
      <path
        fill={fill}
        d="M68.6,53.5v-3.7c0-9.7-7.9-17.6-17.6-17.6h-31.9c-9.7,0-17.6,7.9-17.6,17.6v3.7s0,0,0,0v40.6c0,3.3,2.7,6.1,6.1,6.1s6.1-2.7,6.1-6.1v-39.2h3.5v108c0,4.5,3.6,8.1,8.1,8.1s8.1-3.6,8.1-8.1v-61.4h3.4v61.4c0,4.5,3.6,8.1,8.1,8.1s8.1-3.6,8.1-8.1V54.9h3.5v39.2c0,3.3,2.7,6.1,6.1,6.1s6.1-2.7,6.1-6.1v-40.6s0,0,0,0Z"
      />
    </g>
  {:else}
    <circle cx="35" cy="15" r="14.1" fill={solidColor} />
    <path
      fill={solidColor}
      d="M68.6,53.5v-3.7c0-9.7-7.9-17.6-17.6-17.6h-31.9c-9.7,0-17.6,7.9-17.6,17.6v3.7s0,0,0,0v40.6c0,3.3,2.7,6.1,6.1,6.1s6.1-2.7,6.1-6.1v-39.2h3.5v108c0,4.5,3.6,8.1,8.1,8.1s8.1-3.6,8.1-8.1v-61.4h3.4v61.4c0,4.5,3.6,8.1,8.1,8.1s8.1-3.6,8.1-8.1V54.9h3.5v39.2c0,3.3,2.7,6.1,6.1,6.1s6.1-2.7,6.1-6.1v-40.6s0,0,0,0Z"
    />
  {/if}
</svg>

<style>
  .guardian-icon {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
