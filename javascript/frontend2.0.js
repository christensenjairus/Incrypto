/*
SCRIPT FOR CONTROLLING CHAT CLIENT AND INDEX.HTML
*/

import {getNewMessages, sendMessage} from "./chat_http.mjs"
const { ipcMain, ipcRenderer } = require('electron');
const Store = require('electron-store');
var http = require('http');
const store = new Store();
const DOMPurify = require('dompurify');
const axios = require('axios');

const serverName = store.get("serverName", ""); // default to "" if no valid input

const DEBUG = true; // turn this on & use it with 'if(DEBUG)' to display more console.log info
var displayAll = true;
ipcRenderer.invoke('getSeeAllMessages').then((result) => { 
    displayAll = result;
});

var myName;
ipcRenderer.invoke('getName').then((result) => { 
    myName = result;
});
var myColor;
ipcRenderer.invoke('getColor').then((result) => { 
    myColor = result;
});
var myKey = store.get(myName + "_key", "");
var chatRoom = [];

let pingIntervalID;
let historyIntervalID;

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
    mystatus.text(myName + ': ').css('color', myColor);
    getNewMessages("", serverName).then(response => {
        // console.log(response.data.body)
        let messages = JSON.parse(response.data.body)
        let newJSON = [];
        for (var i = 0; i < messages.data.length; ++i) {
            // chatRoom.push(messages.data[i])
            // console.log("received message from server: " + messages.data[i])
            newJSON.push(messages.data[i])
        }
        
        appendChat(newJSON)
    })
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
    // * What to do in case of a socket error
    // */
    // connection.onerror = function (error) {
    //     // just in case there were some problems with connection...
    //     // content.html($('<p>', {text: 'Sorry, but there\'s some problem with your ' + 'connection or the server is down.'}));
    //     ipcRenderer.invoke('login')
    // };
    
    let pingCount = 0;
    let pongCount = 0;
    let lengthOfHistory5SecondsAgo = "";
    let history5SecondsAgo = "";
    
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
    
    
    function appendChat(newJSON) { // this was done in an attempt to speed up onmessage handler
        // pongCount = 0;
        // pingCount = 0;
        // if (DEBUG) console.log("Message received: \n" + message.data);
        // insert every single message to the chat window
        
        // document.getElementById("chatbox").innerHTML = "";
        // lengthOfHistory5SecondsAgo = json.data.length;
        // history5SecondsAgo = json.data;
        console.log("ADDING THIS DATA TO CHAT: " + newJSON);
        let dtOfLastMessage = "";
        // console.log(json)
        
        // if (typeof json.length !== 'undefined') {
        for (var i=0; i < newJSON.length; i++) {
            var messageIfAlreadyExists = document.getElementById(newJSON[i].guid);
            if ((typeof(document.getElementById(newJSON[i].guid)) != 'undefined') /*&& (document.getElementById(newJSON[i].guid) != null)*/) { // only add messages that aren't already added!
                // alert("getting through")
                addMessage(newJSON[i].author, newJSON[i].text, newJSON[i].color, newJSON[i].time, dtOfLastMessage, newJSON[i].encryption, newJSON[i].guid);
            }    
            dtOfLastMessage = newJSON[i].time;
            // if (i + 1 == newJSON.length) { // scroll to last message
            //     var message = document.getElementById(newJSON[i].guid);
            //     message.scrollIntoView({behavior: "smooth"})
            // }
        }
        chatRoom.push(newJSON);
        var div = $('#chatbox');
            div.animate({
                scrollTop: div[0].scrollHeight
            }, 100);
        
        // $('#chatbox').animate({scrollTop: $('#chatbox').scrollHeight},"fast");
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
        console.log("message is being added now")
        if ((UnencryptedMessage !== message) || displayAll === true) { // either we've decypted the message, or displayAll is toggled
            console.log("message is being added now 2")
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
                // var message = document.getElementById(guid);
                // message.scrollIntoView({behavior: "smooth"})
            } else {
                content.innerHTML += `<!-- Sender Message-->
                <div class="d-flex align-items-center" id="` + guid + `">
                <div class="text-left pr-1"><img src="../icons/icons8-hacker-60.png" width="30" class="img1" /></div>
                <div class="pr-2 pl-1"> <span class="name">` + author + `</span>
                <p class="msg" style="background-color:` + color + `; color:white">` + message + `</p>
                </div>
                </div>`;
                // var message = document.getElementById(guid);
                // message.scrollIntoView({behavior: "smooth"})
            };
        }
    }
    
    // connection.onclose = function () {
    //     ipcRenderer.invoke('login');
    // };
    
    /**
    * Send message when user presses Enter key
    */
    input.keydown(function(e) {
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
            
            var tmp = Encrypt(myName);
            //let message = {"type":"message", "user":myName, "userEnc":tmp, "msg":msg, "userColor":myColor, "encryption":EncryptionFunction, "key":"none", "time": (new Date()).getTime()}
            sendMessage(myName, tmp, msg, myColor, EncryptionFunction, myKey, serverName).then(response => {
                if (response == false) {
                    console.error("Message was not sent.");
                    return;
                }
                else {
                    console.log("message sent")
                    // console.log(response.data.body)
                    let messages = JSON.parse(response.data.body)
                    let newJSON = [];
                    for (var i = 0; i < messages.data.length; ++i) {
                        // chatRoom.push(messages.data[i])
                        // console.log("received message from server: " + messages.data[i])
                        newJSON.push(messages.data[i])
                    }
                    
                    appendChat(newJSON)
                }
            })
            // try {
            //     send(connection, JSON.stringify(message));
            //     if (DEBUG) console.log("Message sent: \n" + JSON.stringify(message));
            //     savedInputText = "";
            // } catch(error) {
            //     console.log("message not sent")
            // }
            // $(this).val('');
            // disable the input field to make the user wait until server sends back response
            // input.attr('disabled', 'disabled');
            // if (DEBUG) console.log("Input turned off until response is received")
            ipcRenderer.invoke('setBadgeCnt', 0);
        }
    });
    
    
    //     /**
    //     * This method is optional. If the server wasn't able to
    //     * respond to the in 5 seconds then show some error message
    //     * to notify the user that something is wrong.
    //     */
    //     historyIntervalID = setInterval(function() {
    //         if (connection.readyState !== 1) {
    //             ipcRenderer.invoke('login');
    //         }
    //         else {
    //             // input.removeAttr('disabled')
    //             let message = {"type":"historyRequest", "user":myName, "color":myColor, "encryption":"plain_text", "key":"none", "time": (new Date()).getTime()}
    //             send(connection, JSON.stringify(message)); // reget the history every 3 seconds
    //         }
    //     }, 30000); // grab history every 30 seconds
    //     pingIntervalID = setInterval(function() {
    //         let message = {type:"ping"}
    //         send(connection, JSON.stringify(message));
    //         // console.log("ping sent")
    //         pingCount = pingCount + 1;
    //             if (pingCount > 55 && pongCount < 55) {
    //                 if (document.getElementById('input').value != "Can\'t communicate with the WebSocket server.") {
    //                     savedInputText = document.getElementById('input').value
    //                     // console.log("input saved")
    //                 }
    //                 document.getElementById('input').value = ("Can\'t communicate with the WebSocket server.")
    //                 input.attr('disabled', 'disabled')
    //             }
    //             else {
    //                 input.removeAttr('disabled')
    //                 if (document.getElementById('input').value === "Can\'t communicate with the WebSocket server.") {
    //                     document.getElementById('input').value = savedInputText;
    //                     // console.log("input restored");
    //                 }
    //                 input.focus();
    //                 mystatus.text(myName).css('color', myColor);
    //             }
    //             return;
    //     }, 100)
    
    
    
    document.getElementById('status').addEventListener('click', () => {
        var newColor = getRandomColor(); // generate random color
        myColor = newColor
        store.set(myName + "_Color", newColor);
        ipcRenderer.invoke('setColor', myColor);
        mystatus.css('color', myColor)
        let allMyEncNames = [];
        for (let i = 0; i < Encryption_Types.length; ++i) {
            allMyEncNames[i]=EncryptOther(myName, Encryption_Types[i]);
        }
        // create array of encrypted names using all encryption algorithms
        let allNamesJSON = JSON.stringify(allMyEncNames);
        // json stringify that array
        console.log(allMyEncNames);
        // add that value to the message
        let message = {"type":"colorChange", "user": myName, "allNames":allNamesJSON, "userColor":myColor, "encryption":"plain_text", "key":"none", "time": (new Date()).getTime()}
        send(connection, JSON.stringify(message));
        // ipcRenderer.invoke('setColor', myColor);
        
        // if (DEBUG) console.log("Message sent: \n" + JSON.stringify(message));
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

function setRandomColor() {
    $("#colorpad").css("background-color", getRandomColor());
}

function showNotification(author, text) {
    const NOTIFICATION_TITLE = author
    const NOTIFICATION_BODY = text
    const notification = {
        title: author,
        body: text,
        icon: __dirname + "/../icons/hacker-25899.png"
    }
    new Notification(NOTIFICATION_TITLE, notification).onclick = () => {
        document.getElementById('input').focus();
    };
    ipcRenderer.invoke('incBadgeCnt', 1).then((result => {
        // update badge count
    }))
}

function send(connection, message) {
    try {
        connection.send(message);
        // console.log(message);
        input.removeAttr('disabled')
        if (document.getElementById('input').value === "Can\'t communicate with the WebSocket server.") {
            document.getElementById('input').value = savedInputText;
        }
        input.focus();
        mystatus.text(myName).css('color', myColor);
    } catch(e) { // will execute if connection.send fails (which means that connection is not set up yet)
        // change DOM here because of failure
        if (document.getElementById('input').value != "Can\'t communicate with the WebSocket server.") {
            savedInputText = document.getElementById('input').value
        }
        document.getElementById('input').value = ("Can\'t communicate with the WebSocket server.")
        input.attr('disabled', 'disabled')
    }
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