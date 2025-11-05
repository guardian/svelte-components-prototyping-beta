<script>
	import { onMount } from 'svelte';

	/** @type {string} - The selector for the atom element to resize */
	export let atomName = "#gv-atom"

	/**
	 * Detects height changes of an element and calls a callback when changes occur
	 * @param {HTMLElement} element - The element to watch
	 * @param {() => void} callback - Function to call when height changes
	 */
	function onElementHeightChange(element, callback) {
		let lastHeight = element.clientHeight;
		
		function run() {
			const newHeight = element.clientHeight;
			if (lastHeight !== newHeight) {
				callback();
				lastHeight = newHeight;
			}

			if (element.onElementHeightChangeTimer) {
				clearTimeout(element.onElementHeightChangeTimer);
			}
			element.onElementHeightChangeTimer = setTimeout(run, 200);
		}

		run();
	}

	function updateParentVarFromArticleBackground() {
		try {
			const root = window.parent.document.documentElement;
			const articleBg = getComputedStyle(root).getPropertyValue('--article-background').trim();
			
			// Only set the property if the article background value exists
			if (articleBg) {
				root.style.setProperty('--interactive-atom-background', articleBg);
			}
		} catch (error) {
			console.log('Failed to update parent variable from article background:', error);
		}
	}

	onMount(() => {
		if (!window.frameElement) return;

		const target = document.querySelector(atomName);
		if (!target) {
			console.warn(`Resizer: Could not find element with selector "${atomName}"`);
			return;
		}

		// Post message to parent window to adjust the height
		window.parent.postMessage({
			sentinel: 'amp',
			type: 'embed-size',
			height: document.body.scrollHeight
		}, '*');

		// Hide the overflow to avoid scrollbars
		document.body.style.overflow = 'hidden';

		// Set the initial height of the iframe
		window.frameElement.height = target.offsetHeight;

		// Watch for changes in the target's height
		onElementHeightChange(target, () => {
			window.frameElement.height = target.offsetHeight + 250
		});

		const parentRoot = window.parent.document.documentElement;

		updateParentVarFromArticleBackground();

		const observer = new window.parent.MutationObserver(() => {
			updateParentVarFromArticleBackground();
		});

		observer.observe(parentRoot, {
			attributes: true,
			attributeFilter: ['style']
		});

	});
</script>