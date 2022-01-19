// CONTAINS DOM MANIPULATION FOR REGISTER PAGE

import {register} from './register_http.mjs';
const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store(); // initalize Store
var attempt = 3; // Variable to count number of attempts.

$(function() { // run this as soon as the document loads
    if (document.getElementById("serverName") != null) {
        document.getElementById("serverName").value = store.get("serverName", "");
    }
});

let username = "";

// GRAB REGISTRATION INFORMATION AND SEND TO REGISTER FUNCTION
const registerButton = document.getElementById('submit')
registerButton.addEventListener('click', () => {
    username = document.getElementById("username").value;
    ipcRenderer.invoke('setName', username)
    var password = document.getElementById("password").value;
    var password2 = document.getElementById("password2").value;
    var serverName = document.getElementById("serverName").value;
    register(username, password, password2, serverName);
});

// ALLOW <ENTER> TO BE THE SAME AS CLICKING SUBMIT
var username = document.getElementById("username");
username.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("register").click();
    }
});
var password = document.getElementById("password");
password.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("register").click();
    }
});
var password2 = document.getElementById("password2");
password2.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("register").click();
    }
});
var serverName = document.getElementById("serverName");
serverName.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("register").click();
    }
});
username.focus();
