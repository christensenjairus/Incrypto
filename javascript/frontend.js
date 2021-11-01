const Store = require('electron-store');
const { server } = require('websocket');
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

$(function() { // this syntax means it's a function that will be run once once document.ready is true
    "use strict";
    // for better performance - to avoid searching in DOM
    content = $('#content');
    input = $('#input');
    mystatus = $('#status');
    // my color assigned by the server
    myColor = false;
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
        // input.removeAttr('disabled')
        if (DEBUG) console.log("connection made")
        // input.attr("disabled", "disabled")
        let name = store.get("lastUser", "");
        if (name != "") {
            myName = name;
            mystatus.text(name);
            connection.send(name); // first message sent tells the server your name
            input.removeAttr("disabled")
            if (DEBUG) console.log("end of connection initialization, should be able to type")
        }
        else {
            input.hide();
            mystatus.text('Error occurred. Username unknown. Please log out and log back in.');
        }
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
        // try to parse JSON message. Because we know that the server
        // always returns JSON this should work without any problem but
        // we should make sure that the massage is not chunked or
        // otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('Invalid JSON: ', message.data);
            return;
        }
        if (DEBUG) console.log("Message received: \n" + message.data);
        // NOTE: if you're not sure about the JSON structure
        // check the server source code above
        // first response from the server with user's color
        if (json.type === 'color') {
            myColor = json.data;
            mystatus.text(myName + ': ').css('color', myColor);
            input.removeAttr('disabled').focus();
            // from now user can start sending messages
            if (DEBUG) console.log("user should be able to type now")
        } else if (json.type === 'history') { // entire message history
            // insert every single message to the chat window
            for (var i=0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text, json.data[i].color, new Date(json.data[i].time));
            }
        } else if (json.type === 'message') { // it's a single message
            // let the user write another message
            input.removeAttr('disabled');
            addMessage(json.data.author, json.data.text, json.data.color, new Date(json.data.time));
            if (DEBUG) console.log("should be able to type - message received")
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
            // send the message as an ordinary text
            connection.send(msg);
            if (DEBUG) console.log("Message sent: \n" + msg);
            $(this).val('');
            // disable the input field to make the user wait until server sends back response
            input.attr('disabled', 'disabled');
            if (DEBUG) console.log("Input turned off until response is received")
            // we know that the first message sent from a user their name
            // if (myName === false) {
            //     myName = msg;
            // }
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
            input.attr('disabled', 'disabled').val('Unable to communicate with the WebSocket server.');
        }
    }, 3000);

    /*
    * Add message to the chat window
    */
    function addMessage(author, message, color, dt) {
    content.prepend('<p><span style="color:' + color + '">'
        + author + '</span> @ ' + (dt.getHours() < 10 ? '0'
        + dt.getHours() : dt.getHours()) + ':'
        + (dt.getMinutes() < 10
        ? '0' + dt.getMinutes() : dt.getMinutes())
        + ': ' + message + '</p>');
    }
});

