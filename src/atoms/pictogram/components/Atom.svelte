<script>
  import Icon from "./icon.svelte"

  const iconIndexes = Array.from({ length: 10 }, (_, index) => index)
  const factoids = [
    { label: "70% in 2007", percent: 70, fill: "green" },
    { label: "15% in 2026", percent: 15, fill: "green" },
  ]

  function pictogramIconProps(index, percent, count, fill) {
    const units = (percent / 100) * count
    const full = Math.min(count, Math.floor(units + Number.EPSILON))
    const partial = Math.round((units - full) * 100)

    if (index < full) return { fill: fill }

    if (index === full && partial > 0) {
      return { fill: fill, emptyFill: "lightgrey", fillPercent: partial }
    }

    return { fill: "lightgrey" }
  }
</script>

<div class="atom">
  <div id="graphicContainer">
    <div class="vis-chart-headline">The share of something</div>

    {#each factoids as { label, percent, fill } (label)}
      <div class="vis-chart-standfirst" style="margin-bottom: 10px;">{label}</div>

      <div class="chart">
        {#each iconIndexes as index (index)}
          <div class="icon">
            <Icon {...pictogramIconProps(index, percent, iconIndexes.length, fill)} />
          </div>
        {/each}
      </div>
    {/each}

    <div class="vis-chart-source">
      Guardian graphic.
    </div>
  </div>
</div>

<style lang="scss">
  .atom {
    width: 100%;
    position: relative;

    .chart {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 0.75rem 1rem;
      justify-items: center;
    }

    .icon {
      display: grid;
      width: 100%;
      max-width: 100px;
      aspect-ratio: 70 / 173.2;
    }
  }
</style>
