const Store = require('electron-store')
const store = new Store(); // initalize Store
var attempt = 3; // Variable to count number of attempts.

hashCode = function(password){
  return password.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

// Below function Executes on click of login button.
function validate() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var serverName = document.getElementById("serverName").value;

    // USE THIS TO SET A PASSWORD FOR TESTING
    // store.set("username", username);
    // store.set("passwordHash_" + username, hashCode(password));
    // ^ HAVE THIS COMMENTED OUT

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
        window.location = "index.html"; // Redirecting to other page.
        return false;
    }
    else{
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
}

function createAccount() {
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
    window.location = "index.html"; // Redirecting to other page.
    return false;
}

$(function() { // run this as soon as the document loads
    if (document.getElementById("username") != null) {
        document.getElementById("username").value = store.get("lastUser", ""); // show last username used
    }
    document.getElementById("serverName").value = store.get("serverName", "");
});
