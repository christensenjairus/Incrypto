

const { default: axios } = require('axios');
const Store = require('electron-store')
const store = new Store(); // initalize Store

export function getNewMessages(guidOfLastMessage, serverName) {
    try {
        return axios.post('http://' + serverName + "/api/getNewMessages", {
            guidOfLastMessage: guidOfLastMessage
        })
    } catch (error) {
        console.error(error);
        return "";
    }
}

export function sendMessage(name, encryptedName, msg, color, encryption, key, serverName) {
    // let message = {"type":"message", "user":name, "userEnc":encryptedName, "msg":msg, "userColor":color, "encryption":encryption, "key":key, "time": (new Date()).getTime()}
    // JSON.stringify(message)        
    try {
        return axios.post('http://' + serverName + "/api/message", {
            type: "message",
            user: name,
            userEnc: encryptedName, 
            msg: msg,
            userColor: color,
            encryption: encryption,
            key: key,
            time: (new Date()).getTime()
        })
    } catch (error) {
        console.error(error);
        return false;
    }
}