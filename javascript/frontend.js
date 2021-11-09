/*
    SCRIPT FOR CONTROLLING CHAT CLIENT AND INDEX.HTML
*/

const { ipcMain, ipcRenderer } = require('electron');
const Store = require('electron-store');
const { server, connection } = require('websocket');
// const { username } = require('./login.js');
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
if (myColor == false) {
    myColor = "black"
}

var content = $('#content');
var input = $('#input');
var mystatus = $('#status');
let savedInputText = "";

var colors = ['purple', 'plum', 'orange', 'red', 'green', 'blue', 'magenta'];
colors.sort(function(a,b) {
    return Math.random() > 0.5;	
});

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
            connection.send(JSON.stringify(message));
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
        // just in there were some problems with connection...
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
                addMessage(json.data[i].author, json.data[i].text, json.data[i].color, new Date(json.data[i].time));
            }
            var div = $('#content');
            div.animate({
                scrollTop: div[0].scrollHeight
            }, 0);
        } else if (json.type === 'message') { // it's a single message
            if (DEBUG) console.log("Message received: \n" + message.data);
            // let the user write another message
            input.prop("disabled", false)
            addMessage(json.data.author, json.data.text, json.data.color, new Date(json.data.time));
            // if (DEBUG) console.log("should be able to type - message received")
            input.focus();
            var div = $('#content');
            div.animate({
                scrollTop: div[0].scrollHeight
            }, 1000);
            if (json.data.author != myName) showNotification(json.data.author, json.data.text)
        } else if (json.type == "logout") {
            alert("'You've logged in somewhere else. You'll be logged out here")
            connection.close();
            ipcRenderer.invoke('logout', "").then((result) => { 
                // THIS FUNCTION RUNS THE "LOGIN" HANDLER IN MAIN.JS
            })
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
            let message = {"type":"message", "user": myName, "msg":msg, "userColor":myColor, "encryption":"plain_text", "key":"none", "time": (new Date()).getTime()}
            try {
                connection.send(JSON.stringify(message));
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
    setInterval(function() {
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
            connection.send(JSON.stringify(message)); // reget the history every 3 seconds
        }
    }, 5000);
    setInterval(function() {
        let message = {type:"ping"}
        connection.send(JSON.stringify(message));
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
    function addMessage(author, message, color, dt) {
        content.append('<p><span style="float:right; color:' + color + '">'
            + author + '</span> @ ' + (dt.getHours() < 10 ? '0'
            + dt.getHours() : dt.getHours()) + ':'
            + (dt.getMinutes() < 10
            ? '0' + dt.getMinutes() : dt.getMinutes())
            + ': ' + message + '</p>');
    }

    document.getElementById('status').addEventListener('click', () => {
        var newColor = getRandomColor(); // generate random color
        myColor = newColor
        mystatus.css('color', myColor)
        store.set(myName + "_Color", newColor)
        document.getElementById("content").innerHTML + "";
        let message = {"type":"colorChange", "user": myName, "userColor":myColor, "encryption":"plain_text", "key":"none", "time": (new Date()).getTime()}
        connection.send(JSON.stringify(message));
        
        if (DEBUG) console.log("Message sent: \n" + JSON.stringify(message));
    })
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
    console.log("notification should occur now")
    ipcRenderer.invoke('incBadgeCnt', 1).then((result => {
        // update badge count
    }))
}

