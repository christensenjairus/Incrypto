/*
  I HAVE NO IDEA HOW TO EXPLAIN THIS FILE. DON'T WORRY ABOUT IT
*/

const electron = require('electron');

process.once('loaded', () => {
  global.ipcRenderer = electron.ipcRenderer;
});

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
require('source-map-support').install();

function setBadgeCount(count) {
  if (process.platform === 'darwin') {
    remote.app.setBadgeCount(count);
  }
}