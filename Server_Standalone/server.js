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

"use strict";
process.title = 'node-chat';
const webSocketsServerPort = 42069;
const webSocketServer = require('websocket').server;
const http = require('http');
var history = [ ];
var clients = [ ];
function htmlEntities(str) {
	return String(str)
	.replace(/&/g, '&').replace(/</g, '<')
	.replace(/>/g, '>').replace(/"/g, '"');
}
var colors = ['purple', 'plum', 'orange', 'red', 'green', 'blue', 'magenta' ];
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
	console.log(' Connection is accepted.');
	if (history.length > 0) {
		connection.sendUTF(JSON.stringify({ type: 'history', data: history} ));
	}
	connection.on('message', function(message) {
	if (message.type === 'utf8') {
		if (userName === false) {
			userName = htmlEntities(message.utf8Data);
			userColor = colors.shift();
			connection.sendUTF(
				JSON.stringify({ type:'color', data: userColor }));
			console.log(' User is known as: ' + userName + ' with ' + userColor + ' color.');
			} else {
			console.log(' Received Message from ' + userName + ': ' + message.utf8Data);
			var obj = {
				time: (new Date()).getTime(),
				text: htmlEntities(message.utf8Data),
				author: userName,
				color: userColor
			};
			history.push(obj);
			history = history.slice(-100);
			var json = JSON.stringify({ type:'message', data: obj });
			for (var i=0; i < clients.length; i++) {
				clients[i].sendUTF(json);
			}
		}
	}
	});
	connection.on('close', function(connection) {
	if (userName !== false && userColor !== false) {
		console.log(connection.remoteAddress + " was disconnected.");
		clients.splice(index, 1);
		colors.push(userColor);
	}
	});
});

// what I had before -------------------------------------

// const { Console } = require('console');
// const net = require('net');
// const { exit } = require('process');
// // const sqlite3 = require('sqlite3').verbose();
// // let db = new sqlite3.Database(':memory:', (err) => {
// //     if (err) {
// //     return console.error(err.message);
// //     }
// //     console.log('Connected to the in-memory SQlite database.');
// // });

// let chats = null;

// // ________________________________ OBJECTS _________________________________________
// class Chat {
//     constructor() {
//         this.chatText = null;
// 		this.people = new Array();
// 		this.numPeople = this.people.length;
//     }
//     addTextToChat(stringToAdd) {
// 		if (this.chatText === null) {
// 			this.chatText = stringToAdd + '\n';
// 		}
// 		else {
// 			this.chatText += stringToAdd + '\n';
// 		}
//         // console.log(stringToAdd + " added to chat");
//     }
// 	addPersonToChat(person) {
// 		this.people.push(person);
// 		this.numPeople++;
// 	}
// 	removePersonFromChat(person) {
// 		const index = this.people.indexOf(person);
// 		if (index > -1) {
// 			this.people.splice(index, 1);
// 			// console.log("person removed from chat");
// 		}
// 		else {
// 			// console.log("person NOT removed from chat");
// 		}
// 	}
// }

// class Person {
// 	constructor(socket, chatroom) {
// 		Object.assign(this, { socket, chatroom });
// 		this.name = "User" + getRandomArbitrary(0, 100000);
// 		chats[this.chatroom].addPersonToChat(this);
// 		this.sendOldChat();
// 		this.sendOthers(this.name + ' entered the chat at ' + new Date().toLocaleTimeString());

// 		socket.on('data', (buffer) => {
// 			const command = buffer.toString('utf-8').trim();

// 			// console.log(command.substr(0,4).toUpperCase());
// 			// console.log('name changed to ' + command.substr(5));

// 			if (command.toUpperCase() === '() quit'.toUpperCase()) {
// 				socket.destroy();
// 			} else if (command.toUpperCase() === "() fill".toUpperCase()) {
// 				this.sendOldChat();
// 			} else if (command.toUpperCase() === "() clear".toUpperCase()) {
// 				console.log("clear chat here");
// 			} else if (command.substr(0,5).toUpperCase() === "NAME=") {
// 				this.sendOthers(this.name + " changed name to " + command.substr(5));
// 				this.name = command.substr(5);
// 			} else if (isNumeric(command)) {
// 				if (command > 1000 || command < 0) {
// 					this.send('Chatroom number not in range\n');
// 				}
// 				else {
// 					this.send('Switching to chatroom ' + command + '\n');
// 					this.switchChatroom(command);
// 				}
// 			} else if (command != "") {
// 				try {
// 					chats[this.chatroom].addTextToChat(this.name + ": " + command);
// 					this.sendOthers(this.name + ": " + command);

// 				}
// 				catch (e) {
// 					this.send("Can't send message\nError: " + e + ".\n");
// 				}
// 			}
// 		});

// 		socket.on('close', () => {
// 			try { 
// 				this.sendOthers(this.name + ' left the chat'); 
// 			} 
// 			catch (e) {
// 				console.log("ERROR: " + e);
// 			}
// 		});
// 	}

// 	send(message) {
// 		try {
// 			this.socket.write(message);
// 		}
// 		catch (e) {
// 			console.log("ERROR: " + e);
// 		}
// 	}

// 	sendOthers(message) {
// 		chats[this.chatroom].people.forEach(element => {
// 			if (this != element) {
// 				element.send(message + '\n');
// 				// console.log(message + ' sent to someone.');
// 			}
// 		});
// 	}

// 	switchChatroom(number) {
// 		this.sendOthers(this.name + ' has switched to chatroom ' + number);
// 		chats[this.chatroom].removePersonFromChat(this);
// 		this.chatroom = number;
// 		chats[this.chatroom].addPersonToChat(this);
// 		this.sendOldChat();
// 	}

// 	sendOldChat() {
// 		this.displayChatHeader();
// 		this.getThoseInChat();
// 		if (chats[this.chatroom].chatText != null && chats[this.chatroom].chatText != "") this.send(chats[this.chatroom].chatText); // send chats sent while offline
// 	}

// 	getThoseInChat() {
// 		let stringThoseInChat = "";
// 		chats[this.chatroom].people.forEach(element => {
// 			if (this != element) {
// 				stringThoseInChat += element.name + " | ";
// 				// console.log(message + ' sent to someone.');
// 			}
// 			else {
// 				stringThoseInChat += 'You | '; 
// 			}
// 		});
// 		stringThoseInChat = stringThoseInChat.substr(0, stringThoseInChat.length - 3); // cut off last |
// 		// if (stringThoseInChat != "You") {
// 			this.send('In chatroom: ' + stringThoseInChat + '\n');
// 		// }
// 	}

// 	displayChatHeader() {
// 		this.send(`-------------------WELCOME to Incrypto: chatroom ` + this.chatroom + ' of 1000-------------------\n');
// 	}
// }

// // _________________________________________ MAIN _________________________________________

// (() => {
//   // When null, we are waiting for the first person to connect, after which we will
//   // create a new chat. After the second person connects, the chat can be fully set
//   // up and played, and this variable immediately set back to null so the future
//   // connections make new chats.
// chats = new Array(); // array of chats
// for (var i = 0; i <= 1001; i++) { // chatrooms are numbered 0-100
// 	chats.push(new Chat());
// }

// net.createServer((socket) => {
//     console.log('Connection from', socket.remoteAddress, 'port', socket.remotePort);

// 	new Person(socket, "1"); // will create a person and assign them to chat 1

// }).listen(5002, () => {
//     console.log('Incrypto Server is Running');
// });
// })();

// // --------------------------------------------- Helper functions ---------------------------------------------
// function isNumeric(value) {
//     return /^-?\d+$/.test(value);
// }

// function getRandomArbitrary(min, max) {
// 	return Math.floor(Math.random() * (max - min) + min);
// }