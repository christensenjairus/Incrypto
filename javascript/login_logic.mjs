// CONTAINS LOGIC FOR LOGIN PAGE

const { default: axios } = require('axios');
const Store = require('electron-store');
const store = new Store(); // initalize Store

// const portNum = '5050'
const portNum = '443'
let serverIPandPortNum = '';

function hashCode(password){
    return password.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

export function login(username, password, serverName) {
    if (serverName === "") {
        alert("Please enter a valid server name");
        return false;
    }
    password = hashCode(password);
    serverIPandPortNum = 'http://' + serverName/* + ":" + portNum*/;
    try {
        axios.post(serverIPandPortNum + "/api/login", {
            username: username,
            password: password,
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
            return;
        })
    } catch (error) {
        console.error(error);
    }
}