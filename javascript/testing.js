const { ipcMain, ipcRenderer } = require('electron');
const Store = require('electron-store');
// const { server, connection } = require('ws');
var http = require('http');
const store = new Store();
const DOMPurify = require('dompurify');
const axios = require('axios');

const serverName = store.get("serverName", ""); // default to "" if no valid input
const portNum = '5050'
const serverIPandPortNum = serverName + ':' + portNum; // <---- Insert hostname or IP of server here

http.create





async function getPing() {
    try {
        const response = await axios.get(serverIPandPortNum + '/ping', {
            // params: {
            //     ID: 12345
            // }    
        });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
}
getPing();