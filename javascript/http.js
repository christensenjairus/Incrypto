const { default: axios } = require('axios');
const Store = require('electron-store');
const store = new Store(); // initalizes Store for ALL the LOGIN, REGISTER, and FRONTEND Pages
const DOMPurify = require('dompurify'); 
const crypto = require('crypto');

// ---------- API ENDPOINTS ------------------------------------------

async function login(username, password, serverName) {
    if (serverName === "") {
        ipcRenderer.invoke('alert','Can not connect without a server','Please enter a valid server name', "error", false);
        ipcRenderer.invoke('logout');
        return false;
    }
    password = crypto.createHash('sha256').update(password).digest('hex');
    var time = (new Date()).getTime()
    try {
        axios.post('http://' + serverName + "/api/login", {
        username: username,
        password: password,
        time: time,
        chatRooms: [
            {name:"Chatroom_Global", lastActivity:time}
        ]
    }).then(async response => {
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
            try {
                var myPrivateKey = fs.readFileSync(require('path').join(__dirname,'../keys/PrivateKey_' + username));
            }
            catch (e) {
                await sendGetKeys(username, serverName, data.sessionID) // if private key is not found, get it before going to the chat page
            }
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
    }, async error => {
        ipcRenderer.invoke('alert',"Could not connect to server", error.message, "error", false);
        ipcRenderer.invoke('logout');
    })
} catch (error) {
    console.error(error);
    ipcRenderer.invoke('logout');
}
}

async function register(username, password, password2, serverName) {
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
    password = crypto.createHash('sha256').update(password).digest('hex');
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
            await sendCreateKeys(username, serverName, data.sessionID)
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
    }, async error => {
        ipcRenderer.invoke('alert',"Could not connect to server", error.message, "error", false);
        ipcRenderer.invoke('toregister');
    })
} catch (error) {
    console.error(error);
    ipcRenderer.invoke('toregister');
}
}

function getNewMessages(username, timeOfLastMessage, chatRoomName, serverName, sessionID, numberOfChats) {
    try {
        return axios.post('http://' + serverName + "/api/message/new", {
        timeOfLastMessage: timeOfLastMessage,
        chatRoomName: chatRoomName,
        sessionID: sessionID,
        username: username,
        numberOfChats: numberOfChats
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
async function sendMessage(username, msg, color, chatRoomName, serverName, sessionID) {
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

async function diffieHellman(username, clientPartial, serverName, sessionID) {
    try {
        return await axios.post('http://' + serverName + "/api/keys/diffieHellman", {
            username: username,
            clientPartial: clientPartial,
            sessionID, sessionID
        })
    } catch (error) {
        console.error(error);
        return;
    }
}

async function generateSharedKey(username, serverName, sessionID) {
    // retrieve from server new prime numbers for diffie-hellman math
    if (debug) console.log("Starting Part 1 of Diffie Hellman...")
    var response = await negociate(username, serverName, sessionID)
    if (response.data == null || response.data.base == null || response.data.mod == null) {
        ipcRenderer.invoke('alert','','Unable to retrieve mod and base from server', "error", false);
        return;
    }
    var base = response.data.base;
    var mod = response.data.mod;

    // create client prime number for diffie-hellman math
    const getlargePrime = require('get-large-prime');
	let clientExponent = await getlargePrime(1024);
    clientExponent = clientExponent.toString();

    // do math, sent diffie-hellman data to server
    var clientPartial = compute(base, clientExponent, mod);
    if (debug) console.log("Client's partial key: " + clientPartial)
    if (debug) console.log("Starting Part 2 of Diffie Hellman...")

    response = await diffieHellman(username, clientPartial, serverName, sessionID)
    if (response.data.error != null) {
        ipcRenderer.invoke('alert','',"Server error. Please try again", "error", false);
        ipcRenderer.invoke('logout')
    }

    // generate Shared Key from server's diffie-hellman data
    var serverPartial = response.data.serverPartial;
    var sharedSecret = compute(serverPartial, clientExponent, mod);
    if (debug) console.log("SharedSecret: " + sharedSecret)
    store.set("sharedSecret_" + username, sharedSecret);
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

// ----------- Encryption / Decryption Functions -----------------------------------------

const CryptoJS = require('crypto-js');
const { ipcRenderer } = require('electron');
const encrypt = (content, password) => CryptoJS.AES.encrypt(JSON.stringify({ content }), password).toString()
const decrypt = (crypted, password) => JSON.parse(CryptoJS.AES.decrypt(crypted, password).toString(CryptoJS.enc.Utf8)).content

async function sendGetKeys(username, serverName, sessionID) {
    // generate shared key
    await generateSharedKey(username, serverName, sessionID);
    // retrieve new keys from server
    var response = await getKeys(username, serverName, sessionID);
    if (response.data == "Error") {
        ipcRenderer.invoke('alert','Unable to get your keys',"You may want to log out and back in", "error", false);
        return;
    }
    var data = response.data;
    const hashOfSharedKey = crypto.createHash('sha256', await store.get("sharedKey_" + username, "")).digest('hex');
    var decrypted = decrypt(data, hashOfSharedKey);
    if (debug) console.log("Hash of Shared Secret used to decrypt: " + hashOfSharedKey)
    fs.writeFileSync(require('path').join(__dirname,'../keys/PrivateKey_' + username), decrypted)
    if (debug) console.log("Decrypted Private Key Saved");
    return decrypted;
}

async function sendCreateKeys(username, serverName, sessionID) {
    // generate shared key
    await generateSharedKey(username, serverName, sessionID);
    // retrieve new keys from server
    var response = await createKeys(username, serverName, sessionID)
    if (response.data == "Error") {
        ipcRenderer.invoke('alert','Unable to get your keys',"You may want to log out and back in", "error", false);
        return;
    }
    var data = response.data;
    const hashOfSharedKey = crypto.createHash('sha256', await store.get("sharedKey_" + username, "")).digest('hex');
    var decrypted = decrypt(data, hashOfSharedKey);
    if (debug) console.log("Hash of Shared Secret used to decrypt: " + hashOfSharedKey)
    fs.writeFileSync(require('path').join(__dirname,'../keys/PrivateKey_' + username), decrypted)
    if (debug) console.log("Decrypted Private Key Saved");
    return decrypted;
}

function compute(base, exponent, modulo){
    const bigintModArith = require('bigint-mod-arith')
    const JSONbig = require('json-bigint')
    if (debug) console.log("Base: " + base)
	var base = BigInt(base.toString());
    if (debug) console.log("Exponent: " + exponent)
	var exponent = BigInt(exponent.toString());
    if (debug) console.log("Modulo: " + modulo)
	var modulo = BigInt(modulo.toString());
    var res = bigintModArith.modPow(base, exponent, modulo) // diffie-hellman math
    res = JSONbig.stringify(res) // turn into string (gets rid of the strange data type BigInt)
	return res;
}