const { default: axios } = require('axios');
const Store = require('electron-store');
const store = new Store(); // initalizes Store for ALL the LOGIN, REGISTER, and FRONTEND Pages
const { ipcRenderer } = require('electron');
const DOMPurify = require('dompurify'); 
const crypto = require('crypto');

function login(username, password, serverName) {
    if (serverName === "") {
        ipcRenderer.invoke('alert','Can not connect without a server','Please enter a valid server name', "error", false);
        ipcRenderer.invoke('logout');
        return false;
    }
    password = crypto.createHash('sha256', password).digest('hex');
    var time = (new Date()).getTime()
    try {
        axios.post('http://' + serverName + "/api/login", {
        username: username,
        password: password,
        encryption: "plain_text", 
        time: time,
        chatRooms: [
            {name:"Chatroom_Global", lastActivity:time}
        ]
    }).then(response => {
        // try {
        var data = response.data;
        if (data.result === 'success') {
            if (store.get("chatRoomName_" + username, "") == "") store.set("chatRoomName_" + username, "Chatroom_Global")
            if (store.get("sendToAll_" + username, "") == "") store.set("sendToAll_" + username, true)
            store.set(username + "_sessionID", data.sessionID);
            ipcRenderer.invoke('setSessionID', data.sessionID);
            store.set("lastUser", username);
            ipcRenderer.invoke('setColor', data.color);
            store.set("serverName", serverName);
            
            // store.set("mod_" + username, data.mod);
            // store.set("base_" + username, data.base);
            // let myPrivatePrime = generatePrime();
            // store.set("privatePrime_" + username, myPrivatePrime);
            // sendDiffieHellman(username, data.base, myPrivatePrime, data.mod, serverName, data.sessionID);
            ipcRenderer.invoke('login'); // switch to chat window
            return;
        }
        else {
            if (data.sessionID === "incorrect_credentials") {
                ipcRenderer.invoke('alert','','Incorrect Credentials', "error", false);
                ipcRenderer.invoke('logout');
                return false;
            }
            else {
                ipcRenderer.invoke('alert','We are not sure what happened','Please try again', "error", false);
                ipcRenderer.invoke('logout');
                return false;
            }
        }
        // } catch (e) {
        //     alert(e)
        // }
    }, error => {
        ipcRenderer.invoke('alert',"Could not connect to server", error.message, "error", false);
        ipcRenderer.invoke('logout');
    })
} catch (error) {
    console.error(error);
    ipcRenderer.invoke('logout');
}
}

function register(username, password, password2, serverName) {
    if (username == "" || password == "") {
        ipcRenderer.invoke('alert',"", "Fill in all the boxes", "error", false);
        ipcRenderer.invoke('toregister');
        return false;
    }
    if (password != password2) {
        ipcRenderer.invoke('alert',"", "Passwords do not match", "error", false);
        ipcRenderer.invoke('toregister');
        return false;
    }
    password = crypto.createHash('sha256', password).digest('hex');
    var time = (new Date()).getTime();
    if (serverName === "") {
        ipcRenderer.invoke('alert',"", "Please enter a valid server name", "error", false);
        ipcRenderer.invoke('toregister');
        return false;
    }
    try {
        axios.post('http://' + serverName + "/api/register", {
        username: username,
        password: password,
        encryption: "plain_text", 
        time: time,
        chatRooms: [
            {name:"Chatroom_Global", lastActivity:time}
        ]
    }).then(async response => {
        // try {
        var data = response.data
        if (data.result === 'success') {
            store.set("chatRoomName_" + username, "Chatroom_Global")
            store.set("sendToAll_" + username, true)
            store.set(username + "_sessionID", data.sessionID);
            ipcRenderer.invoke('setSessionID', data.sessionID);
            store.set("lastUser", username);
            ipcRenderer.invoke('setColor', data.color)
            store.set("serverName", serverName);
            // store.set("mod", data.mod);
            // store.set("base", data.base);
            // let myPrivatePrime = generatePrime();
            // store.set("privatePrime_" + username, myPrivatePrime);
        
            // await sendDiffieHellman(username, data.base, myPrivatePrime, data.mod, serverName, data.sessionID);
            await sendCreateKeys(username, serverName, data.sessionID, true)
            ipcRenderer.invoke('login');
        }
        else {
            if (data.sessionID === "username_exists") {
                ipcRenderer.invoke('alert',"", "That username is taken. Please try another", "error", false);
                ipcRenderer.invoke('toregister');
                return false;
            }
            else {
                ipcRenderer.invoke('alert',"", "We are not sure what happened. Please try again", "error", false);
                ipcRenderer.invoke('toregister');
                return false;
            }
        }
        return
        // } catch (e) {
        //     alert(e);
        // }
    }, error => {
        ipcRenderer.invoke('alert',"Could not connect to server", error.message, "error", false);
        ipcRenderer.invoke('toregister');
    })
} catch (error) {
    console.error(error);
    ipcRenderer.invoke('toregister');
}
}

function getNewMessages(username, timeOfLastMessage, chatRoomName, serverName, sessionID) {
    try {
        return axios.post('http://' + serverName + "/api/message/new", {
        timeOfLastMessage: timeOfLastMessage,
        chatRoomName: chatRoomName,
        sessionID: sessionID,
        username: username
    })
} catch (error) {
    console.error(error);
    return "";
}
}

function getAllMessages(username, chatRoomName, serverName, sessionID) {
    try {
        return axios.post('http://' + serverName + "/api/message/all", {
        chatRoomName: chatRoomName,
        username: username,
        sessionID: sessionID
    })
} catch (error) {
    console.error(error);
    return false;
}
}

function getAllUsers(username, serverName, sessionID) {
    try {
        return axios.post('http://' + serverName + "/api/users/all", {
            username: username,
            sessionID: sessionID
        })
    } catch (error) {
        console.error(error);
        return false;
    }
}

function getChatRoomUsers(username, chatRoomName, serverName, sessionID) {
    try {
        return axios.post('http://' + serverName + "/api/users/chatroom", {
            chatRoomName: chatRoomName,
            username: username,
            sessionID: sessionID
        })
    } catch (error) {
        console.error(error);
        return false;
    }
}

// sendMessage(myName, msg, myColor, chatRoomName, serverName, sessionID)
function sendMessage(username, msg, color, chatRoomName, serverName, sessionID) {
    var message = [];
    var guid = createGuid();
    var successfulEncryptionCount = 0;
    userArray.forEach(async user => {
        if (user.encryptForUser == true) {
            var recipient = { recipient: "", text: ""};
            // console.log("Encrypting message for: " + user.username)
            recipient.recipient = user.username
            recipient.text = Custom_AES(msg, user.username);
            if (recipient.text != "") successfulEncryptionCount++;
            message.push(recipient) // encrypt message with their public key
        }   
    })
    // console.log(message)
    if (successfulEncryptionCount == 0) {
        ipcRenderer.invoke('alert',"Incrypto is not encrypting messages correctly. This problem is usually experienced when the app is installed in a read-only mode. Please reinstall the app with more permissions.", "", false);
        return;
    }
    try {
        return axios.post('http://' + serverName + "/api/message", {
            username: username,
            message: message,
            color: color,
            sessionID: sessionID,
            time: (new Date()).getTime(),
            chatRoomName: chatRoomName,
            sessionID: sessionID,
            guid: guid
        })
    } catch (error) {
        console.error(error);
        return false;
    }
}

async function changeColor(username, color, serverName, sessionID) {
    try {
        return axios.post('http://' + serverName + "/api/color", {
        username: username,
        color: color,
        sessionID: sessionID
    })
} catch (error) {
    console.error(error);
    return false;
}
}

async function getActiveUsers(username, serverName, sessionID) {
    try {
        return axios.post('http://' + serverName + "/api/users/active", {
        username: username,
        sessionID: sessionID
    })
    } catch (e) {
        console.error(error);
        return false;
    }
}

function createChatRoom(username, serverName, sessionID, chatRoomName) {
    try {
        return axios.post('http://' + serverName + "/api/users/chatroom/create", {
            username: username,
            sessionID: sessionID,
            chatRoomName: chatRoomName
        })
    } catch (error) {
        console.error(error);
        return false;
    }
}

function joinChatRoom(username, serverName, sessionID, chatRoomName) {
    try {
        return axios.post('http://' + serverName + "/api/users/chatroom/join", {
            username: username,
            sessionID: sessionID,
            chatRoomName: chatRoomName
        })
    } catch (error) {
        console.error(error);
        return false;
    }
}

function leaveChatRoom(username, serverName, sessionID, chatRoomName) {
    try {
        return axios.post('http://' + serverName + "/api/users/chatroom/leave", {
            username: username,
            sessionID: sessionID,
            chatRoomName: chatRoomName
        })
    } catch (error) {
        console.error(error);
        return false;
    }
}

// ------------------- HELPER FUNCTIONS

function generatePrime() {
    const range = [0, 100];
    const getPrimes = (min, max) => {
        const result = Array(max + 1)
        .fill(0)
        .map((_, i) => i);
        for (let i = 2; i <= Math.sqrt(max + 1); i++) {
            for (let j = i ** 2; j < max + 1; j += i) delete result[j];
        }
        return Object.values(result.slice(min));
    };
    const getRandomNum = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };
    const getRandomPrime = ([min, max]) => {
        const primes = getPrimes(min, max);
        return primes[getRandomNum(0, primes.length - 1)];
    };
    return(getRandomPrime(range))
}

// calculates   base^exponent % modulus
function powerMod(base, exponent, modulus) {
    if (modulus === 1) return 0;
    var result = 1;
    base = base % modulus;
    while (exponent > 0) {
        if (exponent % 2 === 1)  //odd number
        result = (result * base) % modulus;
        exponent = exponent >> 1; //divide by 2
        base = (base * base) % modulus;
    }
    return result;
}

// ---------------- KEY EXCHANGE FUNCTIONS -------------------------------------------------------------

async function negociate(username, serverName, sessionID) {
    try {
        return await axios.post('http://' + serverName + "/api/keys/negociate", {
        username: username,
        sessionID: sessionID
    })
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function diffieHellman(username, myPrivatePrime, myPrivatePrimeKey, serverName, sessionID) {
    try {
        console.log("Name is: " + username);
        console.log("SessionID: " + sessionID);
        var response = await axios.post('http://' + serverName + "/api/keys/diffieHellman", {
            username: username,
            diffieHellman: myPrivatePrime,
            sessionID, sessionID
        })

            // var result = powerMod(response.data.diffieHellman, myPrivatePrime, mod);
            var result = myPrivatePrime.computeSecret(myPrivatePrimeKey, "base64")
            console.log("Our shared key is: " + result)
            store.set("SharedKey_" + username, result)
            return;
    } catch (error) {
        console.error(error);
        return;
    }
}

async function runnegociate(username, serverName, sessionID) {
    var g = "";
    var response = await negociate(username, serverName, sessionID)
    g = response.data.g;
    store.set("g_" + username, g);
    let myPrivatePrime = require('crypto').createDiffieHellman(g);
    let myPrivatePrimeKey = myPrivatePrime.generateKeys("base64")
    // alert("My Private Prime Key: " + myPrivatePrimeKey)
    store.set("privatePrimeKey_" + username, myPrivatePrimeKey);
    await diffieHellman(username, myPrivatePrime, myPrivatePrimeKey, serverName, sessionID)
}

async function getKeys(username, serverName, sessionID) {
    try {
        return axios.post('http://' + serverName + "/api/keys/getKeys", {
        username: username,
        sessionID: sessionID
    })
} catch (e) {
    console.error(error);
    return false;
}
}

async function createKeys(username, serverName, sessionID) {
    try {
        return axios.post('http://' + serverName + "/api/keys/createKeys", {
        username: username,
        sessionID: sessionID
    })
} catch (e) {
    console.error(error);
    return false;
}
}

async function sendGetKeys(username, serverName, sessionID) {
    // console.log("serverName is: " + serverName)
    await runnegociate(username, serverName, sessionID);
    var response = await getKeys(username, serverName, sessionID)
    const crypto = require('crypto')
    const cryptojs = require('crypto-js')
    const fs = require('fs')
    const hashOfSharedKey = crypto.createHash('sha256', await store.get("SharedKey_" + username, "")).digest('hex');
    // console.log(hashOfSharedKey);
    var bytes = cryptojs.AES.decrypt(response.data, hashOfSharedKey);
    var decrypted = bytes.toString(cryptojs.enc.Utf8)
    // console.log("Decrypted Private Key should be: " + decrypted);
    fs.writeFileSync(require('path').join(__dirname,'../keys/PrivateKey_' + username), decrypted)
    // process.env.PrivateKey = decrypted;
    return decrypted;
}

async function sendCreateKeys(username, serverName, sessionID) {
    // console.log("serverName is: " + serverName)
    await runnegociate(username, serverName, sessionID);
    // document.getElementById('status').text = "Getting Keys from Server";

    var response = await createKeys(username, serverName, sessionID)
    const crypto = require('crypto')
    const cryptojs = require('crypto-js')
    const fs = require('fs')
    const hashOfSharedKey = crypto.createHash('sha256', await store.get("SharedKey_" + username, "")).digest('hex');
    // console.log(hashOfSharedKey);
    var bytes = cryptojs.AES.decrypt(response.data, hashOfSharedKey);
    var decrypted = bytes.toString(cryptojs.enc.Utf8)
    // console.log("Decrypted Private Key should be: " + decrypted);
    fs.writeFileSync(require('path').join(__dirname,'../keys/PrivateKey_' + username), decrypted)
    // process.env.PrivateKey = decrypted;
    // alert("New Keys Saved")
    return decrypted;
}