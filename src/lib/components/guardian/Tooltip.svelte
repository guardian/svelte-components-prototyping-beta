<script>
	// import { mustache } from '$lib/helpers/guardian/toolbelt.js';
	export let x = 0;
	export let y = 0;
	export let text = {};
	export let visible = false;
	export let template

	
  </script>
  
  <div
	class="tooltip"
	style="
	  position: absolute;
	  left: {x}px;
	  top: {y + 10}px; /* 10px offset to position below the mouse */
	  transform: translateX(-50%);
	  display: {visible ? 'block' : 'none'};
	"
  >
  	{#if text}

	<div class="tooltip-details">

		{@html text}

	</div>


	{/if}
  </div>
  
  <style lang=scss>
	.tooltip {
	  background-color:white;
	  color: black;
	//   padding: 4px 8px;
	  border-radius: 4px;
	  pointer-events: none; /* so it doesn’t capture mouse events */
	//   white-space: nowrap;
	  font-size: 14px;
	  line-height: 120%;;
	  font-family: "Guardian Text Sans Web", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
		width: 200px;
	}

	.tooltip-details {
		// width: 100%;
		padding: 2px;
		// overflow: hidden;
		transition: max-height 0.2s;
		position: relative;
	}

	._svg_circle {
		float: left;
		margin-right: 5px;
		margin-top:2px;
	}

	small {
		font-size: 10px;
		color: #707070;
	}
  
</style>
