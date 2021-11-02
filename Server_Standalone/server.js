/*____ _                  _       _                    _____                          
/  ___| |                | |     | |                  /  ___|                         
\ `--.| |_ __ _ _ __   __| | __ _| | ___  _ __   ___  \ `--.  ___ _ ____   _____ _ __ 
 `--. \ __/ _` | '_ \ / _` |/ _` | |/ _ \| '_ \ / _ \  `--. \/ _ \ '__\ \ / / _ \ '__|
/\__/ / || (_| | | | | (_| | (_| | | (_) | | | |  __/ /\__/ /  __/ |   \ V /  __/ |   
\____/ \__\__,_|_| |_|\__,_|\__,_|_|\___/|_| |_|\___| \____/ \___|_|    \_/ \___|_|   
*/

var WebSocketServer = require('websocket').server;
var WebSocketClient = require('websocket').client;
var WebSocketFrame  = require('websocket').frame;
var WebSocketRouter = require('websocket').router;
var W3CWebSocket = require('websocket').w3cwebsocket;
const Store = require('electron-store');
const store = new Store();

"use strict";
process.title = 'Chat_Server';
const webSocketsServerPort = 42069;
const webSocketServer = require('websocket').server;
const http = require('http');
var history = [ ];
var clients = [ ];
function htmlEntities(str) {
	return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}
var colors = ['purple', 'plum', 'orange', 'red', 'green', 'blue', 'magenta'];
colors.sort(function(a,b) {
	return Math.random() > 0.5;	
});
var server = http.createServer(function(request, response) {
});
server.listen(webSocketsServerPort, function() {
	console.log(" Server listening port "  + webSocketsServerPort);
});
var wsServer = new webSocketServer({
	httpServer: server
});
wsServer.on('request', function(request) {
	console.log(' Connection origin ' + request.origin + '.');
	var connection = request.accept(null, request.origin);
	var index = clients.push(connection) - 1;
	var userName = false;
	var userColor = false;
	console.log(connection.remoteAddress + 'is connected.');
	sendHistory(connection)
	connection.on('message', function(message) {
		if (message.type === 'utf8') {
			console.log(message.utf8Data)
			let inComingMsg = JSON.parse(message.utf8Data)
			userName = inComingMsg.user
			let msg = inComingMsg.msg
			userColor = inComingMsg.userColor
			console.log('Message type: ' + inComingMsg.type)
			if (inComingMsg.type == "colorChange") {
				// do something
				changeMessagesColor(userName, userColor, inComingMsg)
				sendHistoryToAll();
				return;
			}
			if (inComingMsg.type == "historyRequest") {
				// send history
				console.log("history route chosen")
				sendHistory(connection);
				return
			}
			store.set(userName+"_Color", userColor);
			console.log("UserName: " + userName + " sent " + msg + ". They have color " + userColor + " and encryption " + inComingMsg.encryption)
			// console.log(JSON.stringify(inComingMsg))
			// if (userName === false) {
			// 	userName = htmlEntities(message.utf8Data);
			// 	userColor = colors.shift();
			// 	connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
			// 	console.log(' User is known as: ' + userName + ' with ' + userColor + ' color.');
			// } else {
				// console.log(' Received Message from ' + userName + ': ' + message.utf8Data);
				var obj = {
					time: inComingMsg.time,
					text: htmlEntities(msg),
					author: userName,
					color: userColor,
					encryption: inComingMsg.encryption
				};
				history.push(obj); // save messages
				history = history.slice(-100);
				changeMessagesColor(userName, userColor, inComingMsg);
				var json = JSON.stringify({ type:'message', data: obj });
				for (var i=0; i < clients.length; i++) { // send history to users
					clients[i].sendUTF(json);
				}
			// }
		}
	});
	connection.on('close', function(connection) {
		if (userName !== false && userColor !== false) {
			console.log(connection + " was disconnected.");
			clients.splice(index, 1);
			colors.push(userColor);
		}
	});
});

// // --------------------------------------------- Helper functions ---------------------------------------------
// function isNumeric(value) {
//     return /^-?\d+$/.test(value);
// }

// function getRandomArbitrary(min, max) {
// 	return Math.floor(Math.random() * (max - min) + min);
// }

function changeMessagesColor(userName, userColor, inComingMsg) {
	history.forEach(function (item, index) {
		if (item.author == inComingMsg.user && item.color != userColor) {
			console.log(item.text + " -> changed to color " + userColor)
			item.color = userColor;
		}
	});
}

function sendHistory(connection) {
	if (history.length > 0) {
		connection.sendUTF(JSON.stringify({ type: 'history', data: history} ));
	}
}

function sendToAll(json) {
	for (var i=0; i < clients.length; i++) { // send history to users
		clients[i].sendUTF(json);
	}
}

function sendHistoryToAll() {
	for (var i=0; i < clients.length; i++) { // send history to users
		// clients[i].sendUTF();
		if (history.length > 0) {
			clients[i].sendUTF(JSON.stringify({ type: 'history', data: history} ));
		}
	}
}