<script>
  export let color = '#c70000';
</script>

<span>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    viewBox="0 0 248.3 248.3" style="enable-background:new 0 0 248.3 248.3;" xml:space="preserve">
        <g>
        <path class="skipPath" d="M124.2,248.3c68.6,0,124.2-55.6,124.2-124.2S192.7,0,124.2,0C55.6,0,0,55.6,0,124.2S55.6,248.3,124.2,248.3z
            M52.7,70.4l71.4,71.4l71.4-71.4l28.3,28.3l-99.7,99.7L24.5,98.7L52.7,70.4z" fill="{color}"/>
        </g>
    </svg>
</span>

<style lang="scss">
span {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    left: 0;
    right: 0;
    margin: auto;
    
    svg {
    width: 100%;
    height: 100%;
    max-width: 50px;
    max-height: 50px;
    
        .skipPath {
            fill: var(--scroll-icon-color);
        }
    }
}

</style>