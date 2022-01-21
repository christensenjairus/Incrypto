

const { default: axios } = require('axios');
const Store = require('electron-store')
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
            var data = response.data;
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
            var data = response.data
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

export function getNewMessages(timeOfLastFetch, chatRoomName, serverName) {
    try {
        return axios.post('http://' + serverName + "/api/message/new", {
            timeOfLastFetch: timeOfLastFetch,
            chatRoomName: chatRoomName
        })
    } catch (error) {
        console.error(error);
        return "";
    }
}

export function getAllMessages(chatRoomName, serverName) {
    try {
        return axios.post('http://' + serverName + "/api/message/all", {
            chatRoomName: chatRoomName
        })
    } catch (error) {
        console.error(error);
        return false;
    }
}

export function sendMessage(username, encryptedUsername, msg, color, encryption, key, chatRoomName, serverName) {
    try {
        return axios.post('http://' + serverName + "/api/message", {
            username: username,
            encryptedUsername, encryptedUsername,
            msg: msg,
            color: color,
            encryption: encryption,
            key: key,
            time: (new Date()).getTime(),
            chatRoomName: chatRoomName
        })
    } catch (error) {
        console.error(error);
        return false;
    }
}