<script>
  import { log, logMessages, clearLogs } from '$lib/stores/logger.svelte.js';
  
  function testInfoLog() {
    log('This is a test info message', { timestamp: Date.now() });
  }
  
  function testErrorLog() {
    log('This is a test error message', { component: 'LoggerTest' }, 'error');
  }
  
  function testClearLogs() {
    clearLogs();
  }
</script>

<div class="logger-test">
  <h3>Logger Store Test</h3>
  <p>This component demonstrates that the logger store is working correctly.</p>
  
  <div class="buttons">
    <button on:click={testInfoLog}>Test Info Log</button>
    <button on:click={testErrorLog}>Test Error Log</button>
    <button on:click={testClearLogs}>Clear Logs</button>
  </div>
  
  <div class="log-display">
    <h4>Log Messages ({logMessages.length}):</h4>
    {#if logMessages.length > 0}
      <div class="log-container">
        {#each logMessages as message}
          <div class="log-message {message.type}">
            {message.text}
          </div>
        {/each}
      </div>
    {:else}
      <p><em>No log messages yet.</em></p>
    {/if}
  </div>
</div>

<style lang="scss">
  .logger-test {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin: 20px 0;
    
    h3 {
      margin-top: 0;
      color: #333;
    }
    
    .buttons {
      margin: 15px 0;
      
      button {
        margin: 5px;
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        
        &:nth-child(1) {
          background-color: #007bff;
          color: white;
        }
        
        &:nth-child(2) {
          background-color: #dc3545;
          color: white;
        }
        
        &:nth-child(3) {
          background-color: #6c757d;
          color: white;
        }
        
        &:hover {
          opacity: 0.8;
        }
      }
    }
    
    .log-display {
      margin-top: 20px;
      
      h4 {
        margin-bottom: 10px;
        color: #555;
      }
    }
    
    .log-container {
      margin-top: 10px;
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
  }
</style> 