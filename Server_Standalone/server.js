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
var fs = require('fs');
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
	// sendHistory(connection)
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
			else if (inComingMsg.type == "historyRequest") {
				// send history
				console.log("history route chosen")
				sendHistory(connection);
				return
			}
			else if (inComingMsg.type === 'AuthRequest') {
				console.log("auth request!")
				// check to see if credentials are valid!
				var json = JSON.stringify({ type:'AuthResponse', result: "failure", key:"" });
				let key = checkLoginCreds(inComingMsg.user, inComingMsg.passwordHash) 
				if (key == "password_wrong") {
					json = JSON.stringify({ type:'AuthResponse', result: "failure", key:key });
				}
				else if (key == "username_not_exist") {
					json = JSON.stringify({ type:'AuthResponse', result: "failure", key:key });
				}
				else if (key != "") {
					json = JSON.stringify({ type:'AuthResponse', result: "success", key:key }); // make valid response
				}
				// send response
				connection.sendUTF(json)
				console.log("Sending to client:")
				console.log(json)
				return;
			}
			else if (inComingMsg.type === 'RegistrationRequest') {
				console.log("registration request!")
				var json = JSON.stringify({ type:'RegistrationResponse', result: "failure", key:"" });
				let key = checkRegistrationCreds(inComingMsg.user, inComingMsg.passwordHash)
				if (key == "username_exists") {
					json = JSON.stringify({ type:'RegistrationResponse', result: "failure", key:"username_exists" });
				}
				else if (key == "password_wrong") {
					json = JSON.stringify({ type:'RegistrationResponse', result: "failure", key:"password_wrong" });
				}
				else if (key != "") {
					json = JSON.stringify({ type:'RegistrationResponse', result: "success", key:key }); // make valid response
				}
				connection.sendUTF(json)
				console.log("Sending to client:")
				console.log(json)
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
				// history.push(obj); // save messages
				// history = history.slice(-100);
				saveToFile(obj);
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

function checkLoginCreds(username, passhash) {
	/* use this to bypass registration
	store.set("username_" + username, username);
	store.set("passwordHash_" + username, passhash)
	*/
	if (store.get("username_" + username, "") == "") { // username does not exist
		return "username_not_exist";
	}
	if (passhash == store.get("passwordHash_" + username, "")) {
		var key = createGuid();  
		store.set(username + "_key", key);
		return key;
	}
	else{
		return "password_wrong"; // password did not exist
	}
}

function checkRegistrationCreds(username, passhash) {
	if (store.get("username_" + username, "") != "") { // username already exists
		return "username_exists";
	}
	store.set("username_" + username, username);
	store.set("passwordHash_" + username, passhash);
	var key = createGuid();  
	store.set(username + "_key", key);
	return key;
}

function createGuid() {  
	function _p8(s) {  
		var p = (Math.random().toString(16)+"000000000").substr(2,8);  
		return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;  
	}  
	return _p8() + _p8(true) + _p8(true) + _p8();  
}  

function saveToFile(obj) {
	history.push(obj); // save messages
	history = history.slice(-100);
	fs.writeFile("chat.txt", JSON.stringify(obj), function(err) {
		if (err) {
			console.log(err);
		}
	});
}

// hashCode = function(password){
//     return password.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
// }