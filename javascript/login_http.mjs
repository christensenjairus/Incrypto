// CONTAINS LOGIC FOR LOGIN PAGE

const { default: axios } = require('axios');
const Store = require('electron-store');
const store = new Store(); // initalize Store

function hashCode(password){
    return password.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

export function login(username, password, serverName) {
    if (serverName === "") {
        alert("Please enter a valid server name");
        return false;
    }
    password = hashCode(password);
    try {
        axios.post('http://' + serverName + "/api/login", {
            username: username,
            password: password,
            encryption: "plain_text", 
            time: (new Date()).getTime()
        }).then(response => {
            var data = JSON.parse(response.data.body)
            if (data.result === 'success') {
                store.set(username + "_key", data.key);
                store.set("lastUser", username);
                ipcRenderer.invoke('setColor', data.color)
                store.set("serverName", serverName);
                ipcRenderer.invoke('login');
                return;
            }
            else {
                if (data.key === "incorrect_credentials") {
                    alert("Incorrect credentials")
                    return false;
                }
                else {
                    alert("We're not sure what happened. Please try again")
                    return false;
                }
            }
        })
    } catch (error) {
        console.error(error);
    }
}