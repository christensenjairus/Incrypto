/*
    SCRIPT FOR CONTROLLING LOGIN AND REGISTRATION PAGES
*/

const { ipcRenderer } = require('electron');
const Store = require('electron-store')
const store = new Store(); // initalize Store
var attempt = 3; // Variable to count number of attempts.

hashCode = function(password){
  return password.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

if (document.getElementById('submit') != null) {
  const loginButton = document.getElementById('submit');
  loginButton.addEventListener('click', () => {
      var username = document.getElementById("username").value;
      var password = document.getElementById("password").value;
      var serverName = document.getElementById("serverName").value;

      if (serverName === "") {
        alert("Please enter a valid server name");
        return false;
      }
      if (store.get("username_" + username, "") == "") { // username does not exist
          --attempt;
          alert("Username does not exist. You have "+attempt+" attempts left");
          if(attempt == 0){
            document.getElementById("username").disabled = true;
            document.getElementById("password").disabled = true;
            document.getElementById("submit").disabled = true;
          }
          return false;
      }
      if (hashCode(password) === store.get("passwordHash_" + username)) {
          // worked = true;
          store.set("username_" + username, username);
          store.set("lastUser", username);
          store.set("serverName", serverName);
          alert ("Login successful");
          ipcRenderer.invoke('login', "").then((result) => { /* THIS FUNCTION RUNS THE "LOGIN" HANDLER IN MAIN.JS */})
          return false;
      }
      else{// sandbox: true,
          attempt --;// Decrementing by one.
          alert("Incorrect password. You have "+attempt+" attempts left");
          // Disabling fields after 3 attempts.
          if(attempt == 0){
              document.getElementById("username").disabled = true;
              document.getElementById("password").disabled = true;
              document.getElementById("submit").disabled = true;
              return false;
          }
      }
  });

  var password = document.getElementById("password");
  password.addEventListener("keyup", function(event) {
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
}

if (document.getElementById('register') != null) {
  const registerButton = document.getElementById('register')
  registerButton.addEventListener('click', () => {
      var username = document.getElementById("usernameReg").value;
      var password = document.getElementById("password").value;
      var password2 = document.getElementById("password2").value;
      var serverName = document.getElementById("serverName").value;

      if (serverName === "") {
        alert("Please enter a valid server name");
        return false;
      }
      if (store.get("username_" + username, "") != "") {
        console.log("username taken");
        return;
      }
      if (password != password2) {
        console.log("passwords to not match");
        return;
      }

      store.set("username_" + username, username);
      store.set("passwordHash_" + username, hashCode(password));
      store.set("lastUser", username);
      store.set("serverName", serverName);
      alert ("Registration successful");
      ipcRenderer.invoke('login', "").then((result) => { /* THIS FUNCTION RUNS THE "LOGIN" HANDLER IN MAIN.JS */})
      return false;
  })

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
}

$(function() { // run this as soon as the document loads
    if (document.getElementById("username") != null) {
        document.getElementById("username").value = store.get("lastUser", ""); // show last username used
    }
    document.getElementById("serverName").value = store.get("serverName", "");
});

