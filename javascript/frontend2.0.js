/*
SCRIPT FOR CONTROLLING CHAT CLIENT AND INDEX.HTML
*/

import {getNewMessages, getAllMessages, sendMessage, changeColor} from "./chat_http.js"
const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const DOMPurify = require('dompurify');

const serverName = store.get("serverName", ""); // default to "" if no valid input

const DEBUG = true; // turn this on & use it with 'if(DEBUG)' to display more console.log info
var displayAll = true;
await ipcRenderer.invoke('getSeeAllMessages').then((result) => { 
    displayAll = result;
});

var myName;
await ipcRenderer.invoke('getName').then((result) => { 
    myName = result;
});
var myColor;
await ipcRenderer.invoke('getColor').then((result) => { 
    myColor = result;
});
var sessionID = await store.get(myName + "_key", "");
console.log("SessionID: " + sessionID)

var chatRoom = [];
var chatRoomName = "ChatRoom1"

let EncryptionFunction = store.get("encryptionType", Encryption_Types[0]);  // TODO: switch this back to default Encryption
//default encryption type is first in file
ipcRenderer.invoke('getEncryptionType').then((result) => {
    EncryptionFunction = result;
})

console.log("encryption type is " + EncryptionFunction)

var content = document.getElementById("chatbox");
var input = document.getElementById("input");
var mystatus = document.getElementById("status");

// var textEntry = $('textEntry');
let savedInputText = "";

function logout() {
    ipcRenderer.invoke('logout');
}

$(function() { // this syntax means it's a function that will be run once once document.ready is true
    "use strict";
    // for better performance - to avoid searching in DOM
    // content = $('#content');
    content = document.getElementById("chatbox");
    input = $('#input');
    mystatus = $('#status');
    
    // async function getPing() {
    //     try {
    //         const response = await axios.get('http://' + serverName + '/ping', {
    //             // params: {
    //             //     ID: 12345
    //             // }  
    //             type: "ping"  
    //         });
    //       console.log(response);
    //     } catch (error) {
    //       console.error(error);
    //     }
    // }
    // getPing();
    
    // if user is running mozilla then use it's built-in WebSocket
    // window.WebSocket = window.WebSocket || window.MozWebSocket;
    // if browser doesn't support WebSocket, just show some notification and exit
    // if (!window.WebSocket) {
    //     content.html($('<p>', { text: 'Sorry, but your browser doesn’t support WebSocket.' }));
    //     input.hide();
    //     $('span').hide();
    //     return;
    // }
    // open connection
    // var connection = new WebSocket('ws://' + serverIPandPortNum);
    
    // /*
    // * What to do when connection is first made
    // */
    // connection.onopen = function () {
    //     if (DEBUG) console.log("connection made")
    //     if (myName != "") {
    
    
    
    
    //         // get history of chat
    //         let message = {"type":"historyRequest", "user":myName, "color":myColor, "encryption":"plain_text", "key":"none", "time": (new Date()).getTime()}
    //         send(connection, JSON.stringify(message));
    //         if (DEBUG) console.log("Message sent: \n" + JSON.stringify(message));
    //         // end of getting chat history
    //         input.prop("disabled", false);
    //         input.focus();
    //     }
    //     else {
    //         input.hide();
    //         mystatus.text('Error occurred. Username unknown. Please log out and log back in.');
    //     }
    //     content.innerhtml += `<p>Welcome to the Incrypto Chat! Type in the text box below to begin chatting!</p>`;
    // };
    
    // /*
    // * What to do when the socket receives a message
    // */
    // connection.onmessage = function (message) {
    //     try {
    //         var json = JSON.parse(message.data);
    //     } catch (e) {
    //         console.log('Invalid JSON: ', message.data);
    //         return;
    //     }
    //     if (json.type == "pong") { // do nothing
    //         pongCount = pongCount + 1;
    //         return;
    //     }
    //     if (json.type === 'history') { // entire message history
    //         populateChat(message, json);
    //     } else if (json.type === 'message') { // it's a single message
    //         if (DEBUG) console.log("Message received: \n" + message.data);
    //         // let the user write another message
    //         input.prop("disabled", false)
    //         addMessage(json.data.author, json.data.text, json.data.color, json.data.time, "", json.data.encryption);
    //         // if (DEBUG) console.log("should be able to type - message received")
    //         input.focus();
    //         var div = $('#chatbox');
    //         div.animate({
    //             scrollTop: div[0].scrollHeight
    //         }, 100);
    //         // if (json.data.author != myName) {
    //         //     try {
    //         //         json.data.text = eval(json.data.encryption + '_REVERSE("' + json.data.text + '")');
    //         //     } catch (e) {
    //         //         console.log("Don't have decryption algorithm for " + json.data.encryption + " in message sent from " + json.data.author);
    //         //         return; // don't get notifications for messages that are gibberish
    //         //     }
    //         if (Encrypt(myName) != json.data.author) {
    //             showNotification(Decrypt(json.data.author, json.data.encryption), Decrypt(json.data.text, json.data.encryption));
    //         }
    //     } else if (json.type == "logout") {
    //         clearInterval(pingIntervalID);
    //         clearInterval(historyIntervalID);
    //         connection.close();
    //         // window.stop();
    //         alert("You've logged in somewhere else. You'll be logged out here.")
    //         ipcRenderer.invoke('forceLogout').then(() => { // this is a jenky solution to the problem - the login handler isn't working when called here and we don't know why
    //         });
    //         // logout();
    //         return;
    //     } else {
    //         console.log('Unexpected Json Value: ', json);
    //     }
    // };
    
    async function refreshChat(timeOfLastFetch, chatRoomName, isStarting) {
        getNewMessages(timeOfLastFetch, chatRoomName, serverName).then(async response => {
            store.set("timeOfLastFetch_" + sessionID, (new Date()).getTime());
            var messages = response.data;
            let newJSON = [];
            for (var i = 0; i < messages.length; ++i) {
                newJSON.push(messages[i])
                if (!isStarting && Decrypt(messages[i].author, messages[i].encryption) != myName) {
                    showNotification(Decrypt(messages[i].author, messages[i].encryption), Decrypt(messages[i].text, messages[i].encryption));
                }
                // if (Decrypt(messages[i].author, messages[i].encryption) == myName) myColor = messages[i].color;
            }
            await appendChat(newJSON)
            if (myColor) mystatus.text(myName).css('color', myColor);
            else mystatus.text(myName).css('color', "#0000FF");
            input.focus();
            scroll();
        })
    }
    refreshChat("", chatRoomName, true)
    // refresh every 5 seconds
    setInterval(function() {
        refreshChat(store.get("timeOfLastFetch_" + sessionID, ""), chatRoomName, false)
        scroll();
    }, 5000)
    
    function appendChat(newJSON) {
        let dtOfLastMessage = "";
        if (chatRoom.length != 0) dtOfLastMessage = chatRoom[chatRoom.length - 1].time;
        
        for (var i=0; i < newJSON.length; i++) {
            addMessage(newJSON[i].author, newJSON[i].text, newJSON[i].color, newJSON[i].time, dtOfLastMessage, newJSON[i].encryption, newJSON[i].guid); 
            dtOfLastMessage = newJSON[i].time;
        }
        
        if (chatRoom.length > 1) chatRoom.concat(newJSON);
        else chatRoom = newJSON;
        newJSON = [];
    }

    function scroll() {
        var div = $('#chatbox');
        div.animate({
            scrollTop: div[0].scrollHeight
        }, 100);
    }

    function jump() {
        var div = $('#chatbox');
        div.scrollTop = div.scrollHeight;
    }
    
    /*
    * Add message to the chat window
    */
    function addMessage(author, message, color, dt, dtOfLastMessage, encryptionType, guid) {
        
        let UnencryptedMessage = Decrypt(message, encryptionType);
        author = Decrypt(author, encryptionType);
        
        let purifiedMessage = DOMPurify.sanitize(UnencryptedMessage);
        if (purifiedMessage === "") return;
        // console.log("author is " + Decrypt(author, encryptionType));
        // console.log("encryption type is " + encryptionType)
        const time = new Date(dt);
        const lastTime = new Date(dtOfLastMessage);
        let difference = time - lastTime;
        if ((UnencryptedMessage !== message) || displayAll === true) { // either we've decypted the message, or displayAll is toggled
            message = purifiedMessage;
            if (difference > 20000) {
                content.innerHTML += `<div class="text-center"><span class="between">` + time.toLocaleString() + `</span></div>`;
            }
            if (author == myName) {
                content.innerHTML += `<div class="d-flex align-items-center text-right justify-content-end" id="` + guid + `">
                <div class="pr-2"> <span class="name">Me</span>
                <p class="msg" style="background-color:` + color + `; color:white">` + message + `</p>
                </div>
                <div><img src="../icons/icons8-hacker-64.png" width="30" class="img1" /></div>
                </div>`
            } else {
                content.innerHTML += `<!-- Sender Message-->
                <div class="d-flex align-items-center" id="` + guid + `">
                <div class="text-left pr-1"><img src="../icons/icons8-hacker-60.png" width="30" class="img1" /></div>
                <div class="pr-2 pl-1"> <span class="name">` + author + `</span>
                <p class="msg" style="background-color:` + color + `; color:white">` + message + `</p>
                </div>
                </div>`;
            };
        }
    }
    
    /**
    * Send message when user presses Enter key
    */
    input.keydown(async function(e) {
        if (e.keyCode === 13) {
            let msg = $(this).val();
            if (!msg) {
                return;
            }
            
            // protect against xss and bad characters
            let characterInString = false;
            msg = msg.split('').map(char => {
                if (char === '"') char = '\'\''; // replace " with two 's
                else if (char === '\\') char = '/'; // replace backslashes with forward slashes
                else if (char != " ") characterInString = true;
                return char;
            }).join('');
            if (!characterInString) return; // the message is only spaces
            let tmp1 = DOMPurify.sanitize(msg); // remove cross site scripting possibilities
            if (tmp1 !== msg) alert("To protect against cross site scripting, we will remove what we view as dangerous text from your message.")
            msg = tmp1;
            msg = Encrypt(msg);
            if (msg == "") return; // if encryption fails
            
            sendMessage(myName, Encrypt(myName), msg, myColor, EncryptionFunction, sessionID, chatRoomName, serverName).then(async response => {
                console.log(response.data)
                if (response.data == 'Recieved') {
                    await refreshChat(store.get("timeOfLastFetch_" + sessionID, ""), chatRoomName, false)
                    scroll();
                    savedInputText = "";
                    document.getElementById('input').value = "";
                    ipcRenderer.invoke('setBadgeCnt', 0);
                    return;
                }
                else {
                   alert("There was an issue sending your message");
                }
            })
        }
    });
    
    
    document.getElementById('status').addEventListener('click', async () => {
        // console.log("Color was " + myColor)
        myColor = getRandomColor(); // generate random color
        // console.log("Color is now " + myColor)
        mystatus.text(myName).css('color', myColor);
        ipcRenderer.invoke('setColor', myColor);
        var result = changeColor(myName, myColor, serverName);

        // if (result != false) {
        //     // await store.set(myName + "_Color", myColor);
        //     // await ipcRenderer.invoke('setColor', myColor);
        //     // mystatus.css('color', myColor)
        //     content.innerHTML = "";
        //     chatRoom = [];
        //     // await refreshChat("", chatRoomName, true);
        //     jump();
        // }
        // else {
        //     alert("There's been an issue processing your color change request.")
        // }
    })
    
    
    // add NAVBAR functionality
    document.getElementById('logoutButton').addEventListener('click', () => {
        logout();
    })
    
    var dropdown = document.getElementById('dropdown');
    for (let i = 0; i < Encryption_Types.length; ++i) {
        dropdown.innerHTML += '<a class="dropdown-item" href="#" id="encryption_type_' + i + '")>' + Encryption_Types[i] + '</a>'
    }
    for (let i = 0; i < Encryption_Types.length; ++i) {
        document.getElementById("encryption_type_" + i).addEventListener('click', () => {
            changeE_Type(Encryption_Types[i]);
        })
    }
    
    dropdown = document.getElementById('dropdownOptions');
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="displayAllMessages">All messages</a>'
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="displayOnlyUnencryptedMessages">Filter unencrypted messages</a>'
    document.getElementById("displayAllMessages").addEventListener('click', () => {
        ipcRenderer.invoke('setSeeAllMessages', true);
        ipcRenderer.invoke('login');
    });
    document.getElementById("displayOnlyUnencryptedMessages").addEventListener('click', () => {
        ipcRenderer.invoke('setSeeAllMessages', false);
        ipcRenderer.invoke('login')
    });
    
});

// _________________ Helper Functions ________________________________

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function changeE_Type(EncryptionType) {
    ipcRenderer.invoke('changeMessageE_Type', EncryptionType);
}

// function setRandomColor() {
//     $("#colorpad").css("background-color", getRandomColor());
// }

function showNotification(author, text) {
    const NOTIFICATION_TITLE = author
    const notification = {
        title: author,
        body: text,
        // icon: __dirname + "/../icons/hacker-25899.png"
        icon: "../icons/hacker-25899.png"
    }
    new Notification(NOTIFICATION_TITLE, notification).onclick = () => {
        document.getElementById('input').focus();
    };
    ipcRenderer.invoke('incBadgeCnt', 1);
}

function Encrypt(textin) {
    let toReturn = "";
    try {
        toReturn = eval(EncryptionFunction + '("' + textin + '")');
    } catch(e) {
        alert("There's an issue with the selected encryption algorithm: " + e);
        // return textin;
        return "";
    }
    return toReturn;
}

function EncryptOther(textin, encryptionType) {
    let toReturn = "";
    try {
        toReturn = eval(encryptionType + '("' + textin + '")');
    } catch(e) {
        return textin;
    }
    return toReturn;
}

function Decrypt(textin, encryptionType) {
    let toReturn = "";
    try {
        toReturn = eval(encryptionType + '_REVERSE("' + textin + '")');
        // alert("success: toReturn=" + toReturn);
    } catch(e) {
        // alert("error in decryption: " + e);
        return textin;
    }
    return toReturn;
}