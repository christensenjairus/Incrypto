/*
    SCRIPT FOR CONTROLLING CHAT CLIENT AND INDEX.HTML
*/

const { ipcMain, ipcRenderer } = require('electron');
const Store = require('electron-store');
const { server, connection } = require('websocket');
const store = new Store();

const serverName = store.get("serverName", ""); // default to "" if no valid input
// const portNum = '42069'
const portNum = '80'
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
// EncryptionFunction = "plain_text"; // TODO: COMMENT OUT THIS LINE TO USE ENCRYPTION
// EncryptionFunction = "binary";
console.log("encryption type is " + EncryptionFunction)

var content = $('#content');
var input = $('#input');
var mystatus = $('#status');
// var textEntry = $('textEntry');
let savedInputText = "";

function logout() {
    ipcRenderer.invoke('logout');
}

// var colors = ['purple', 'plum', 'orange', 'red', 'green', 'blue', 'magenta'];
// colors.sort(function(a,b) {
//     return Math.random() > 0.5;	
// });

$(function() { // this syntax means it's a function that will be run once once document.ready is true
    "use strict";
    // for better performance - to avoid searching in DOM
    content = $('#content');
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
            // if (DEBUG) console.log("user should be able to type now")
            input.focus();
            var div = $('#content');
            div.animate({
                scrollTop: div[0].scrollHeight
            }, 0); // lowered the animation time to zero so it wasn't annoying on reload
        }
        else {
            input.hide();
            mystatus.text('Error occurred. Username unknown. Please log out and log back in.');
        }
        content.html($('<p>',{text: 'Welcome to the Incrypto Chat! Type in the text box below to begin chatting!'}));
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
            pongCount = 0;
            pingCount = 0;
            if (DEBUG) console.log("Message received: \n" + message.data);
            // insert every single message to the chat window
            document.getElementById("content").innerHTML = "";
            for (var i=0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text, json.data[i].color, json.data[i].time, json.data[i].encryption);
            }
            var div = $('#content');
            div.animate({
                scrollTop: div[0].scrollHeight
            }, 0);
        } else if (json.type === 'message') { // it's a single message
            if (DEBUG) console.log("Message received: \n" + message.data);
            // let the user write another message
            input.prop("disabled", false)
            addMessage(json.data.author, json.data.text, json.data.color, json.data.time, json.data.encryption);
            // if (DEBUG) console.log("should be able to type - message received")
            input.focus();
            var div = $('#content');
            div.animate({
                scrollTop: div[0].scrollHeight
            }, 1000);
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
            var msg = $(this).val();
            if (!msg) {
                return;
            }
            // TODO: get encryption type, encrypt message, get key from authentication

            // send the message as JSON
            // console.log("myname is " + myName);
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
            // document.getElementById('input').attr('disabled', 'disabled')
            // document.getElementById('status').val('Can\'t communicate with the WebSocket server. Reload with "View" > "Reload"');
            // console.log("reloading page")
            // location.reload();
            // mystatus.text('Error');
            ipcRenderer.invoke('login', "").then((result) => { 
                // used to refresh page
            })
        }
        else {
            // input.removeAttr('disabled')
            let message = {"type":"historyRequest", "user":myName, "color":myColor, "encryption":"plain_text", "key":"none", "time": (new Date()).getTime()}
            send(connection, JSON.stringify(message)); // reget the history every 3 seconds
        }
    }, 5000);
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
    function addMessage(author, message, color, dt, encryptionType) {
        message = Decrypt(message, encryptionType);
        author = Decrypt(author, encryptionType)
        // console.log("author is " + Decrypt(author, encryptionType));
        // console.log("encryption type is " + encryptionType)
        if (author != myName) {
            content.append('<div class="myDiv"><p style="text-align: left"><span style="color:' + color + '">'
            + author + '</span>:    ' + message + '</p></div>');
        } else {
            content.append('<div class="myDiv2"><p style="text-align: right"><span style="color:' + color + '">'
            + "Me" + '</span>:  ' + message + '</p><div class="myDiv">'); 
        };

        // content.append('<div class="myDiv"><p style="text-align: left"><span style="color:' + color + '">'
        //     + author + '</span> @ ' + (dt.getHours() < 10 ? '0'
        //     + dt.getHours() : dt.getHours()) + ':'
        //     + (dt.getMinutes() < 10
        //     ? '0' + dt.getMinutes() : dt.getMinutes())
        //     + ': ' + message + '</p></div>');
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
        dropdown.innerHTML += '<a href="#" id="encryption_type_' + i + '")>' + Encryption_Types[i] + '</a>'
        
    }
    for (let i = 0; i < Encryption_Types.length; ++i) {
        document.getElementById("encryption_type_" + i).addEventListener('click', () => {
            changeE_Type(Encryption_Types[i]);
        })
    }
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
    const NOTIFICATION_TITLE = 'New message from ' + author
    const NOTIFICATION_BODY = text
    // const CLICK_MESSAGE = 'Notification clicked!'
    new Notification(NOTIFICATION_TITLE, { body: NOTIFICATION_BODY })
    .onclick = () => {
        document.getElementById('input').focus();
    }
    // console.log("notification should occur now")
    ipcRenderer.invoke('incBadgeCnt', 1).then((result => {
        // update badge count
    }))
}

function send(connection, message) {
    try {
        connection.send(message);

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
        alert("There's an issue with the selected encryption algorithm.");
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
        // console.log("success: toReturn=" + toReturn);
    } catch(e) {
        // console.log("error in decryption: " + e);
        return textin;
    }
    return toReturn;
}