/*
    SCRIPT FOR CONTROLLING LOGIN AND REGISTRATION PAGES
*/

const { ipcRenderer } = require('electron');
const Store = require('electron-store')
const { server, connection } = require('websocket');
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

      // open web socket and verify credentials
      const portNum = '42069'
      const serverIPandPortNum = serverName + ':' + portNum; // <---- Insert hostname or IP of server here
      
      // if user is running mozilla then use it's built-in WebSocket
      window.WebSocket = window.WebSocket || window.MozWebSocket;
      // if browser doesn't support WebSocket, just show some notification and exit
      if (!window.WebSocket) {
        alert('Sorry, but your browser doesn’t support WebSocket.');
        return;
      }
      // open connection
      var connection = new WebSocket('ws://' + serverIPandPortNum);
      connection.onopen = function () {
        console.log('connection to server made')
        let message = {"type":"AuthRequest", "user": username, "passwordHash":hashCode(password), "encryption":"plain_text", "time": (new Date()).getTime()}
        connection.send(JSON.stringify(message));
        console.log("Message sent: \n" + JSON.stringify(message));
      }
      connection.onerror = function (error) {
        console.log("error in connection to server")
      }
      connection.onmessage = function(message) {
        console.log(message.data)
        let credResponse = JSON.parse(message.data);
        if (credResponse.result == "success") {
          console.log("success in login");
          store.set("lastUser", username);
          store.set("serverName", serverName);
          connection.close()
          ipcRenderer.invoke('login', "").then((result) => { 
            // THIS FUNCTION RUNS THE "LOGIN" HANDLER IN MAIN.JS
          })
        }
        else {
          console.log("login failed")
          if (credResponse.key == "username_not_exist") {
            // alert("Username does not exist")
            alert("Incorrect credentials")
            return false;
          }
          else if (credResponse.key == "password_wrong") {
            alert("Incorrect credentials")
            return false;
          }
          else if (credResponse.key == "already_loggedin") {
            alert("You're logged in somewhere else. Please log out there before continuing");
            return false;
          }
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

      if (password != password2) {
        alert("Passwords do not match")
        return false;
      }

      // open web socket and verify credentials
      const portNum = '42069'
      const serverIPandPortNum = serverName + ':' + portNum; // <---- Insert hostname or IP of server here
      
      // if user is running mozilla then use it's built-in WebSocket
      window.WebSocket = window.WebSocket || window.MozWebSocket;
      // if browser doesn't support WebSocket, just show some notification and exit
      if (!window.WebSocket) {
        alert('Sorry, but your browser doesn’t support WebSocket.');
        return;
      }
      // open connection
      var connection = new WebSocket('ws://' + serverIPandPortNum);
      connection.onopen = function () {
        console.log('connection to server made')
        let message = {"type":"RegistrationRequest", "user": username, "passwordHash":hashCode(password), "encryption":"plain_text", "time": (new Date()).getTime()}
        connection.send(JSON.stringify(message));
        console.log("Message sent: \n" + JSON.stringify(message));
      }
      connection.onerror = function (error) {
        console.log("error in connection to server")
        alert("Could not connect to " + serverName)
      }
      connection.onmessage = function(message) {
        console.log(message.data)
        let credResponse = JSON.parse(message.data);
        if (credResponse.result == "success") {
          console.log("success in registration");
          store.set("lastUser", username);
          store.set("serverName", serverName);
          connection.close()
          ipcRenderer.invoke('login', "").then((result) => { 
            // THIS FUNCTION RUNS THE "LOGIN" HANDLER IN MAIN.JS
          })
        }
        else {
          console.log("registration failed")
          if (credResponse.key == "username_exists") {
            alert("Username is taken. Please try another");
            return false;
          }
          alert("Registration failure");
          return false;
        }}
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

