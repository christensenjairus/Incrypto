/*
    SCRIPT FOR CONTROLLING LOGIN AND REGISTRATION PAGES
*/

const { default: axios } = require('axios');
const { ipcRenderer } = require('electron');
const Store = require('electron-store')
// const { server, connection } = require('ws');
const store = new Store(); // initalize Store
var attempt = 3; // Variable to count number of attempts.

function hashCode(password){
  return password.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

let username = "";

if (document.getElementById('submit') != null) {
  const loginButton = document.getElementById('submit');
  loginButton.addEventListener('click', () => {
    username = document.getElementById("username").value;
    ipcRenderer.invoke('setName', username).then((result) => { 
    });
    var password = document.getElementById("password").value;
    var serverName = document.getElementById("serverName").value;

    if (serverName === "") {
      alert("Please enter a valid server name");
      return false;
    }

    const portNum = '5050'
    const serverIPandPortNum = 'http://' + serverName + ':' + portNum; // <---- Insert hostname or IP of server here
      
    try {
      const response = axios.post(serverIPandPortNum + "/api/login", {
        username: username,
        password: hashCode(password),
        encryption: "plain_text", 
        time: (new Date()).getTime()
      }).then(response => {
        var data = JSON.parse(response.data.body)
        if (data.result === 'success') {
          store.set("lastUser", username);
          ipcRenderer.invoke('setColor', data.color)
          store.set("serverName", serverName);
          ipcRenderer.invoke('login');
        }
        else {
          if (data.key === "username_not_exist") {
            alert("Incorrect credentials")
            return false;
          }
          else if (data.key === "password_wrong") {
            alert("Incorrect credentials")
            return false;
          }
          else if (data.key === "already_loggedin") {
            alert("You're logged in somewhere else. Please log out there before continuing");
            return false;
           }
          else {
            alert("We're not sure what happened. Please try again")
            return false;
          }
        }
        return
        })
      } catch (error) {
        console.error(error);
      }
  });

  var password = document.getElementById("password");
  password.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("submit").click();
    }
  });
  password.focus();

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
}

if (document.getElementById('register') != null) {
  const registerButton = document.getElementById('register')
  registerButton.addEventListener('click', () => {
    username = document.getElementById("usernameReg").value;
    ipcRenderer.invoke('setName', username).then((result) => { 
    });
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

    const portNum = '5050'
    const serverIPandPortNum = 'http://' + serverName + ':' + portNum; // <---- Insert hostname or IP of server here
      
    try {
      const response = axios.post(serverIPandPortNum + "/api/register", {
        username: username,
        password: hashCode(password),
        encryption: "plain_text", 
        time: (new Date()).getTime()
      }).then(response => {
        var data = JSON.parse(response.data.body)
        if (data.result === 'success') {
          store.set("lastUser", username);
          ipcRenderer.invoke('setColor', data.color)
          store.set("serverName", serverName);
          ipcRenderer.invoke('login');
        }
        else {
          if (data.key === "username_exists") {
            alert("That username is taken. Please try another")
            return false;
          }
          else {
            alert("We're not sure what happened. Please try again")
            return false;
          }
        }
        return
        })
      } catch (error) {
        console.error(error);
      }

      // // if user is running mozilla then use it's built-in WebSocket
      // window.WebSocket = window.WebSocket || window.MozWebSocket;
      // // if browser doesn't support WebSocket, just show some notification and exit
      // if (!window.WebSocket) {
      //   alert('Sorry, but your browser doesn’t support WebSocket.');
      //   return;
      // }
      // // open connection
      // var connection = new WebSocket('ws://' + serverIPandPortNum);
      // connection.onopen = function () {
      //   console.log('connection to server made')
      //   let message = {"type":"RegistrationRequest", "user": username, "passwordHash":hashCode(password), "encryption":"plain_text", "time": (new Date()).getTime()}
      //   connection.send(JSON.stringify(message));
      //   console.log("Message sent: \n" + JSON.stringify(message));
      // }
      // connection.onerror = function (error) {
      //   console.log("error in connection to server")
      //   alert("Could not connect to " + serverName)
      // }
      // connection.onmessage = function(message) {
      //   console.log(message.data)
      //   let credResponse = JSON.parse(message.data);
      //   if (credResponse.result == "success") {
      //     console.log("success in registration");
      //     store.set("lastUser", username);
      //     ipcRenderer.invoke('setColor', credResponse.color).then((result => {
      //       // set color so that chat knows what color to use
      //     }))
      //     store.set("serverName", serverName);
      //     connection.close()
      //     ipcRenderer.invoke('login');
      //   }
      //   else {
      //     console.log("registration failed")
      //     if (credResponse.key == "username_exists") {
      //       alert("Username is taken. Please try another");
      //       return false;
      //     }
      //     alert("Registration failure");
      //     return false;
      //   }}
  })

  var usernameReg = document.getElementById("usernameReg");
  usernameReg.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("register").click();
    }
  });
  usernameReg.focus();

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
}

$(function() { // run this as soon as the document loads
    if (document.getElementById("username") != null) {
      document.getElementById("username").value = store.get("lastUser", ""); // show last username used
    }
    if (document.getElementById("serverName") != null) {
      document.getElementById("serverName").value = store.get("serverName", "");
    }
});
