// CONTAINS LOGIC FOR REGISTER PAGE

const { default: axios } = require('axios');
const Store = require('electron-store')
const store = new Store(); // initalize Store

function hashCode(password){
    return password.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

export function register(username, password, password2, serverName) {
    if (password != password2) {
        alert("Passwords do not match")
        return false;
    }
    password = hashCode(password);
    if (serverName === "") {
        alert("Please enter a valid server name");
        return false;
    }
    try {
        axios.post('http://' + serverName + "/api/register", {
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
}