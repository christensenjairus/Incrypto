// CONTAINS DOM MANIPULATION FOR LOGIN PAGE

var attempt = 3; // Variable to count number of attempts.

$(function() { // run this as soon as the document loads
  if (document.getElementById("username") != null) {
    document.getElementById("username").value = store.get("lastUser", ""); // show last username used
  }
  if (store.get("serverName", "") !== "") {
    document.getElementById("serverName").value = store.get("serverName", "");
  }
  else {
    document.getElementById("serverName").value = "incrypto.christensencloud.us"
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
loginButton.onclick = function(event) {
  document.getElementById('body').innerHTML = ' <div class="loader" id="loader"></div> ' // add loading bar
}

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
