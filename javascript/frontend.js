/*
    SCRIPT FOR CONTROLLING CHAT CLIENT AND INDEX.HTML
*/

const Store = require('electron-store');
const { server, connection } = require('websocket');
const store = new Store();

const serverName = store.get("serverName", ""); // default to "" if no valid input
const portNum = '42069'
const serverIPandPortNum = serverName + ':' + portNum; // <---- Insert hostname or IP of server here

const DEBUG = false; // turn this on & use it with 'if(DEBUG)' to display more console.log info
var myName = false;
var content = $('#content');
var input = $('#input');
var mystatus = $('#status');
var myColor = false;

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
    // my color assigned by the server
    myColor = false;
    myName = false;
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
        myName = store.get("lastUser", ""); // TODO: get a better way of knowing who's logged in
        myColor = store.get(myName+"_Color", "black"); // default color is black
        // if (DEBUG) console.log("color is: " + myColor)
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
        content.html($('<p>', {text: 'Sorry, but there\'s some problem with your ' + 'connection or the server is down.'}));
    };

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
        if (DEBUG) console.log("Message received: \n" + message.data);
        if (json.type === 'history') { // entire message history
            // insert every single message to the chat window
            document.getElementById("content").innerHTML = "";
            for (var i=0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text, json.data[i].color, new Date(json.data[i].time));
            }
        } else if (json.type === 'message') { // it's a single message
            // let the user write another message
            input.prop("disabled", false)
            addMessage(json.data.author, json.data.text, json.data.color, new Date(json.data.time));
            // if (DEBUG) console.log("should be able to type - message received")
            input.focus();
            var div = $('#content');
            div.animate({
                scrollTop: div[0].scrollHeight
            }, 1000);
        } else {
            console.log('Unexpected Json Value: ', json);
        }
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
            connection.send(JSON.stringify(message));
            if (DEBUG) console.log("Message sent: \n" + JSON.stringify(message));
            $(this).val('');
            // disable the input field to make the user wait until server sends back response
            input.attr('disabled', 'disabled');
            // if (DEBUG) console.log("Input turned off until response is received")
        }
    });

    /**
    * This method is optional. If the server wasn't able to
    * respond to the in 3 seconds then show some error message
    * to notify the user that something is wrong.
    */
    setInterval(function() {
        if (connection.readyState !== 1) {
            mystatus.text('Error');
            input.attr('disabled', 'disabled').val('Can\'t communicate with the WebSocket server. Reload with "View" > "Reload"');
        }
    }, 3000);

    /*
    * Add message to the chat window
    */
    function addMessage(author, message, color, dt) {
        content.append('<p><span style="color:' + color + '">'
            + author + '</span> @ ' + (dt.getHours() < 10 ? '0'
            + dt.getHours() : dt.getHours()) + ':'
            + (dt.getMinutes() < 10
            ? '0' + dt.getMinutes() : dt.getMinutes())
            + ': ' + message + '</p>');
    }

    document.getElementById('status').addEventListener('click', () => {
        // newColor = colors.shift();
        var newColor = getRandomColor(); // generate random color
        myColor = newColor
        mystatus.css('color', myColor)
        store.set(myName + "_Color", newColor)
        document.getElementById("content").innerHTML + "";
        let message = {"type":"colorChange", "user": myName, "userColor":myColor, "encryption":"plain_text", "key":"none", "time": (new Date()).getTime()}
        connection.send(JSON.stringify(message));
        
        // let message = {"type":"historyRequest", "user": myName, "userColor":myColor, "encryption":"plain_text", "key":"none", "time": (new Date()).getTime()}
        // connection.send(JSON.stringify(message));
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


