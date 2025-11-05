<script>
  import { log, logMessages } from '$lib/stores/logger.svelte.js';
  let { testing = false } = $props();
</script>

{#if testing}
    {#if logMessages.length > 0}
    <div class="log-container">
        {#each logMessages as message}
        <div class="log-message {message.type}">
            {message.text}
        </div>
        {/each}
    </div>
    {/if}
{/if}


<style lang="scss">
      
    .log-container {
        margin-top: 20px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        max-height: 200px;
        overflow-y: auto;
    }

    .log-message {
        padding: 4px 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);

        &.error {
            color: #d32f2f;
        }

        &:last-child {
            border-bottom: none;
        }
    }
    
  </style>