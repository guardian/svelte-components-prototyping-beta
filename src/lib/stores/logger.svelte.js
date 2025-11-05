let logMessages = $state([]);

function log(message, data = null, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const displayMessage = data !== null 
    ? `${message} ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}`
    : message;
  
  const formattedMessage = `[${timestamp}] ${displayMessage}`;
  logMessages.push({ text: formattedMessage, type });
  
  if (type === 'error') {
    console.error(message, data);
  } else {
    console.log(message, data);
  }
}

function clearLogs() {
  logMessages.length = 0;
}

export {
  logMessages,
  log,
  clearLogs
} 