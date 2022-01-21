// CONTAINS DOM MANIPULATION FOR LOGIN PAGE

import {login} from '../javascript/chat_http.js';
const { ipcRenderer } = require('electron');
const Store = require('electron-store')
const store = new Store(); // initalize Store
var attempt = 3; // Variable to count number of attempts.

$(function() { // run this as soon as the document loads
  if (document.getElementById("username") != null) {
    document.getElementById("username").value = store.get("lastUser", ""); // show last username used
  }
  if (document.getElementById("serverName") != null) {
    document.getElementById("serverName").value = store.get("serverName", "");
  }
});

let username = "";

// GRAB LOGIN INFORMATION AND SEND TO LOGIN FUNCTION
const loginButton = document.getElementById('submit');
loginButton.addEventListener('click', () => {
  username = document.getElementById("username").value;
  ipcRenderer.invoke('setName', username);
  var password = document.getElementById("password").value;
  var serverName = document.getElementById("serverName").value;
  login(username, password, serverName);
});

// ALLOW <ENTER> TO BE THE SAME AS CLICKING SUBMIT
var password = document.getElementById("password");
password.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    document.getElementById("submit").click();
  }
});
var usernameBox = document.getElementById("username");
usernameBox.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    document.getElementById("submit").click();
  }
});
var serverName = document.getElementById("serverName");
serverName.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    document.getElementById("submit").click();
  }
});
password.focus();