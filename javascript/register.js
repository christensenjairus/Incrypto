// CONTAINS DOM MANIPULATION FOR REGISTER PAGE

var attempt = 3; // Variable to count number of attempts.

$(function() { // run this as soon as the document loads
    if (store.get("serverName", "") !== "") {
        document.getElementById("serverName").value = store.get("serverName", "");
    }
    else {
        document.getElementById("serverName").value = "incrypto.christensencloud.us"
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
username = document.getElementById("username");
username.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("submit").click();
    }
});
var password = document.getElementById("password");
password.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("submit").click();
    }
});
var password2 = document.getElementById("password2");
password2.addEventListener("keyup", function(event) {
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
username.focus();
