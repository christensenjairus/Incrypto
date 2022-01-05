/*
    SCRIPT FOR CONTROLLING CHAT CLIENT AND INDEX.HTML
*/

const { ipcMain, ipcRenderer } = require('electron');
const Store = require('electron-store');
const { server, connection } = require('ws');
const store = new Store();
const DOMPurify = require('dompurify');

const serverName = store.get("serverName", ""); // default to "" if no valid input
// const portNum = '42069'
const portNum = '5050'
const serverIPandPortNum = serverName + ':' + portNum; // <---- Insert hostname or IP of server here

const DEBUG = true; // turn this on & use it with 'if(DEBUG)' to display more console.log info

var myName;
ipcRenderer.invoke('getName', "").then((result) => { 
    myName = result;
});
var myColor;
ipcRenderer.invoke('getColor', "").then((result) => { 
    myColor = result;
});

let pingIntervalID;
let historyIntervalID;

let EncryptionFunction = store.get("encryptionType", Encryption_Types[0]);  // TODO: switch this back to default Encryption
                                                                            //default encryption type is first in file
ipcRenderer.invoke('getEncryptionType', "").then((result) => {
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
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Sorry, but your browser doesn’t support WebSocket.' }));
        input.hide();
        $('span').hide();
        return;
    }
    // open connection
    var connection = new WebSocket('ws://' + serverIPandPortNum);

    /*
    * What to do when connection is first made
    */
    connection.onopen = function () {
        if (DEBUG) console.log("connection made")
        if (myName != "") {
            mystatus.text(myName + ': ').css('color', myColor);
            // get history of chat
            let message = {"type":"historyRequest", "user":myName, "color":myColor, "encryption":"plain_text", "key":"none", "time": (new Date()).getTime()}
            send(connection, JSON.stringify(message));
            if (DEBUG) console.log("Message sent: \n" + JSON.stringify(message));
            // end of getting chat history
            input.prop("disabled", false);
            input.focus();
        }
        else {
            input.hide();
            mystatus.text('Error occurred. Username unknown. Please log out and log back in.');
        }
        content.innerhtml += `<p>Welcome to the Incrypto Chat! Type in the text box below to begin chatting!</p>`;
    };

    /*
    * What to do in case of a socket error
    */
    connection.onerror = function (error) {
        // just in case there were some problems with connection...
        // content.html($('<p>', {text: 'Sorry, but there\'s some problem with your ' + 'connection or the server is down.'}));
        ipcRenderer.invoke('login', "").then((result) => { 
            // used to refresh page
        })
    };

    let pingCount = 0;
    let pongCount = 0;
    let lengthOfHistory5SecondsAgo = "";
    let history5SecondsAgo = "";

    /*
    * What to do when the socket receives a message
    */
    connection.onmessage = function (message) {
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('Invalid JSON: ', message.data);
            return;
        }
        if (json.type == "pong") { // do nothing
            pongCount = pongCount + 1;
            return;
        }
        if (json.type === 'history') { // entire message history
            populateChat(message, json);
        } else if (json.type === 'message') { // it's a single message
            if (DEBUG) console.log("Message received: \n" + message.data);
            // let the user write another message
            input.prop("disabled", false)
            addMessage(json.data.author, json.data.text, json.data.color, json.data.time, "", json.data.encryption);
            // if (DEBUG) console.log("should be able to type - message received")
            input.focus();
            var div = $('#chatbox');
            div.animate({
                scrollTop: div[0].scrollHeight
            }, 100);
            // if (json.data.author != myName) {
            //     try {
            //         json.data.text = eval(json.data.encryption + '_REVERSE("' + json.data.text + '")');
            //     } catch (e) {
            //         console.log("Don't have decryption algorithm for " + json.data.encryption + " in message sent from " + json.data.author);
            //         return; // don't get notifications for messages that are gibberish
            //     }
            if (Encrypt(myName) != json.data.author) {
                showNotification(Decrypt(json.data.author, json.data.encryption), Decrypt(json.data.text, json.data.encryption));
            }
        } else if (json.type == "logout") {
            clearInterval(pingIntervalID);
            clearInterval(historyIntervalID);
            connection.close();
            // window.stop();
            alert("You've logged in somewhere else. You'll be logged out here.")
            ipcRenderer.invoke('forceLogout').then(() => { // this is a jenky solution to the problem - the login handler isn't working when called here and we don't know why
            });
            // logout();
            return;
        } else {
            console.log('Unexpected Json Value: ', json);
        }
    };

    function populateChat(message, json) { // this was done in an attempt to speed up onmessage handler
        pongCount = 0;
        pingCount = 0;
            if (DEBUG) console.log("Message received: \n" + message.data);
            // insert every single message to the chat window

            // this code was supposed to speed it up, it does not
            // if (json.data.length === lengthOfHistory5SecondsAgo) { // don't waste time if number of messages and message colors are the same
            //     let AllTheSame = true;
            //     for (let i = 0; i < json.data.length; ++i) { // make sure all the colors are the same too
            //         if (history5SecondsAgo[i].color == json.data[i].color) {
            //             AllTheSame = false;
            //         }
            //     }
            //     if (AllTheSame === true) return;
            // }

            document.getElementById("chatbox").innerHTML = "";
            lengthOfHistory5SecondsAgo = json.data.length;
            history5SecondsAgo = json.data;
            let dtOfLastMessage = "";
            for (var i=0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text, json.data[i].color, json.data[i].time, dtOfLastMessage, json.data[i].encryption);
                dtOfLastMessage = json.data[i].time;
            }
            var div = $('#chatbox');
            div[0].scrollTop = div[0].scrollHeight;
    }

    connection.onclose = function () {
        ipcRenderer.invoke('login', "").then((result) => { 
            // used to refresh page
        })
    };

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
            let message = {"type":"message", "user":myName, "userEnc":tmp, "msg":msg, "userColor":myColor, "encryption":EncryptionFunction, "key":"none", "time": (new Date()).getTime()}
            try {
                send(connection, JSON.stringify(message));
                if (DEBUG) console.log("Message sent: \n" + JSON.stringify(message));
                savedInputText = "";
            } catch(error) {
                console.log("message not sent")
            }
            $(this).val('');
            // disable the input field to make the user wait until server sends back response
            input.attr('disabled', 'disabled');
            // if (DEBUG) console.log("Input turned off until response is received")
            ipcRenderer.invoke('setBadgeCnt', 0).then((result) => { 
            })
        }
    });

    
    /**
    * This method is optional. If the server wasn't able to
    * respond to the in 5 seconds then show some error message
    * to notify the user that something is wrong.
    */
    historyIntervalID = setInterval(function() {
        if (connection.readyState !== 1) {
            ipcRenderer.invoke('login', "").then((result) => { 
                // used to refresh page
            })
        }
        else {
            // input.removeAttr('disabled')
            let message = {"type":"historyRequest", "user":myName, "color":myColor, "encryption":"plain_text", "key":"none", "time": (new Date()).getTime()}
            send(connection, JSON.stringify(message)); // reget the history every 3 seconds
        }
    }, 30000); // grab history every 30 seconds
    pingIntervalID = setInterval(function() {
        let message = {type:"ping"}
        send(connection, JSON.stringify(message));
        // console.log("ping sent")
        pingCount = pingCount + 1;
            if (pingCount > 55 && pongCount < 55) {
                if (document.getElementById('input').value != "Can\'t communicate with the WebSocket server.") {
                    savedInputText = document.getElementById('input').value
                    // console.log("input saved")
                }
                document.getElementById('input').value = ("Can\'t communicate with the WebSocket server.")
                input.attr('disabled', 'disabled')
            }
            else {
                input.removeAttr('disabled')
                if (document.getElementById('input').value === "Can\'t communicate with the WebSocket server.") {
                    document.getElementById('input').value = savedInputText;
                    // console.log("input restored");
                }
                input.focus();
                mystatus.text(myName).css('color', myColor);
            }
            return;
    }, 100)

    /*
    * Add message to the chat window
    */
    function addMessage(author, message, color, dt, dtOfLastMessage, encryptionType) {
        let UnencryptedMessage = Decrypt(message, encryptionType);
        author = Decrypt(author, encryptionType);

        let purifiedMessage = DOMPurify.sanitize(UnencryptedMessage);
        if (purifiedMessage === "") return;
        // console.log("author is " + Decrypt(author, encryptionType));
        // console.log("encryption type is " + encryptionType)
        const time = new Date(dt);
        const lastTime = new Date(dtOfLastMessage);
        let difference = time - lastTime;

        if (UnencryptedMessage !== message || displayAll) { // either we've decypted the message, or displayAll is toggled
            message = purifiedMessage;
            if (difference > 20000) {
                content.innerHTML += `<div class="text-center"><span class="between">` + time.toLocaleString() + `</span></div>`;
            }
            if (author == myName) {
                content.innerHTML += `<div class="d-flex align-items-center text-right justify-content-end ">
                                <div class="pr-2"> <span class="name">Me</span>
                                    <p class="msg" style="background-color:` + color + `; color:white">` + message + `</p>
                                </div>
                                <div><img src="../icons/icons8-hacker-64.png" width="30" class="img1" /></div>
                            </div>`
            } else {
                content.innerHTML += `<!-- Sender Message-->
                <div class="d-flex align-items-center">
                <div class="text-left pr-1"><img src="../icons/icons8-hacker-60.png" width="30" class="img1" /></div>
                <div class="pr-2 pl-1"> <span class="name">` + author + `</span>
                    <p class="msg" style="background-color:` + color + `; color:white">` + message + `</p>
                </div>
                </div>`;
            };
        }
    }

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
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="displayAllMessages">Show all messages</a>'
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="displayOnlyUnencryptedMessages">Show only unencrypted messages</a>'
    document.getElementById("displayAllMessages").addEventListener('click', () => {
        // changeE_Type(Encryption_Types[i]);
        alert("display all")
    });
    document.getElementById("displayOnlyUnencryptedMessages").addEventListener('click', () => {
        // changeE_Type(Encryption_Types[i]);
        alert("display unencrypted messages")
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