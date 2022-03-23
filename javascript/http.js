const { default: axios } = require('axios');
const Store = require('electron-store');
const store = new Store(); // initalizes Store for ALL the LOGIN, REGISTER, and FRONTEND Pages
const { ipcRenderer } = require('electron');
const DOMPurify = require('dompurify'); 

function hashCode(password){
    return password.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

function login(username, password, serverName) {
    if (serverName === "") {
        alert("Please enter a valid server name");
        ipcRenderer.invoke('logout');
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
        // try {
        var data = response.data;
        if (data.result === 'success') {
            store.set(username + "_sessionID", data.sessionID);
            ipcRenderer.invoke('setSessionID', data.sessionID);
            store.set("lastUser", username);
            ipcRenderer.invoke('setColor', data.color)
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
                alert("Incorrect credentials")
                ipcRenderer.invoke('logout');
                return false;
            }
            else {
                alert("We're not sure what happened. Please try again")
                ipcRenderer.invoke('logout');
                return false;
            }
        }
        // } catch (e) {
        //     alert(e)
        // }
    }, error => {
        alert("Could not connect to provided server\nError: " + error);
        ipcRenderer.invoke('logout');
    })
} catch (error) {
    console.error(error);
    ipcRenderer.invoke('logout');
}
}

function register(username, password, password2, serverName) {
    if (password != password2) {
        alert("Passwords do not match")
        ipcRenderer.invoke('toregister');
        return false;
    }
    password = hashCode(password);
    if (serverName === "") {
        alert("Please enter a valid server name");
        ipcRenderer.invoke('toregister');
        return false;
    }
    try {
        axios.post('http://' + serverName + "/api/register", {
        username: username,
        password: password,
        encryption: "plain_text", 
        time: (new Date()).getTime()
    }).then(async response => {
        // try {
        var data = response.data
        if (data.result === 'success') {
            store.set(username + "_sessionID", data.sessionID);
            ipcRenderer.invoke('setSessionID', data.sessionID);
            store.set("lastUser", username);
            ipcRenderer.invoke('setColor', data.color)
            store.set("serverName", serverName);
            // store.set("mod", data.mod);
            // store.set("base", data.base);
            // let myPrivatePrime = generatePrime();
            // store.set("privatePrime_" + username, myPrivatePrime);
            // sendDiffieHellman(username, data.base, myPrivatePrime, data.mod, serverName, data.sessionID);
            ipcRenderer.invoke('login');
        }
        else {
            if (data.sessionID === "username_exists") {
                alert("That username is taken. Please try another")
                ipcRenderer.invoke('toregister');
                return false;
            }
            else {
                alert("We're not sure what happened. Please try again")
                ipcRenderer.invoke('toregister');
                return false;
            }
        }
        return
        // } catch (e) {
        //     alert(e);
        // }
    }, error => {
        alert("Cannot connect to that server");
        ipcRenderer.invoke('toregister');
    })
} catch (error) {
    console.error(error);
    ipcRenderer.invoke('toregister');
}
}

function diffieHellman(username, clientResult, myPrivatePrime, mod, serverName, sessionID) {
    try {
        console.log("Name is: " + username);
        console.log("SessionID: " + sessionID);
        return axios.post('http://' + serverName + "/api/keys/diffieHellman", {
        username: username,
        diffieHellman: clientResult,
        sessionID, sessionID
    }).then(response => {
        // TODO
        // alert("DATA RECIEVED!")
        // var mod = store.get("mod", "");
        // console.log("Final Diffie Hellman (3)-----------")
        // console.log("Mod is: " + mod)
        // var base = store.get("base", "")
        // console.log("Base is: " + response.data.diffieHellman)
        // var myPrivatePrime = generatePrime();
        // console.log("My private prime is: " + myPrivatePrime)
        var result = powerMod(response.data.diffieHellman, myPrivatePrime, mod);
        console.log("Our shared key is: " + result)
        store.set("SharedKey_" + username, result)
        // alert("Our shared key is: " + result)
    })
} catch (error) {
    console.error(error);
    return "";
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

function getAllUsers(username, chatRoomName, serverName, sessionID) {
    try {
        return axios.post('http://' + serverName + "/api/users/all", {
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
    userArray.forEach(async user => {
        if (user.encryptForUser == true) {
            var recipient = { recipient: "", text: ""};
            // console.log("Encrypting message for: " + user.username)
            recipient.recipient = user.username
            recipient.text = Custom_AES(msg, user.username);
            message.push(recipient) // encrypt message with their public key
        }   
    })
    // console.log(message)
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


function sendDiffieHellman(myName, base, myPrivatePrime, mod, serverName, sessionID) {
    // var mod = store.get("mod", "");
    // console.log("Diffie Hellman 2----------------------------------")
    // console.log("Mod is: " + mod)
    // var base = store.get("base", "")
    // console.log("Base is: " + base)
    // var myPrivatePrime = generatePrime();
    // console.log("My private prime is: " + myPrivatePrime)
    var result = powerMod(base, myPrivatePrime, mod);
    // console.log("Sending back to server: " + result)
    diffieHellman(myName, result, myPrivatePrime, mod, serverName, sessionID)
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

async function sendGetKeys(username, serverName, sessionID, remakeSharedKeyBoolean) {
    // console.log("serverName is: " + serverName)
    if (remakeSharedKeyBoolean == true) {
        var mod = "";
        var base = "";
        var response = await negociate(username, serverName, sessionID)
        console.log(response.data)
        store.set("mod_" + username, response.data.mod);
        mod = response.data.mod
        store.set("base_" + username, response.data.base);
        base = response.data.base;
        document.getElementById('status').text = "Parameters Negociated";
        console.log("new parameters negociated")
        // console.log("Negociation complete")
        document.getElementById('status').text = "Generating Diffie Hellman Data";
        let myPrivatePrime = generatePrime();
        store.set("privatePrime_" + username, myPrivatePrime);
        sendDiffieHellman(username, base, myPrivatePrime, mod, serverName, sessionID);
    }
    
    document.getElementById('status').text = "Getting Keys from Server";

    return await getKeys(username, serverName, sessionID).then(async response => {
        document.getElementById('status').text = "Keys Recieved";
        // console.log(response.data)
        const crypto = require('crypto')
        const cryptojs = require('crypto-js')
        const fs = require('fs')
        const hashOfSharedKey = crypto.createHash('sha256', await store.set("SharedKey_" + username, "")).digest('hex');
        // console.log(hashOfSharedKey);
        var bytes = cryptojs.AES.decrypt(response.data, hashOfSharedKey);
        var decrypted = bytes.toString(cryptojs.enc.Utf8)
        // console.log("Decrypted Private Key should be: " + decrypted);
        fs.writeFileSync('./keys/PrivateKey_' + username, decrypted)
        return decrypted;
    })
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
