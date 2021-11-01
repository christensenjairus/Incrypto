const electron = require('electron');

process.once('loaded', () => {
  global.ipcRenderer = electron.ipcRenderer;
});

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.