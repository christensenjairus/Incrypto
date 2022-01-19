/*____ _                  _       _                    _____                          
/  ___| |                | |     | |                  /  ___|                         
\ `--.| |_ __ _ _ __   __| | __ _| | ___  _ __   ___  \ `--.  ___ _ ____   _____ _ __ 
 `--. \ __/ _` | '_ \ / _` |/ _` | |/ _ \| '_ \ / _ \  `--. \/ _ \ '__\ \ / / _ \ '__|
/\__/ / || (_| | | | | (_| | (_| | | (_) | | | |  __/ /\__/ /  __/ |   \ V /  __/ |   
\____/ \__\__,_|_| |_|\__,_|\__,_|_|\___/|_| |_|\___| \____/ \___|_|    \_/ \___|_|   
*/

// import * as httpLogic from './http_logic.mjs'
const httpLogic = require("./http_logic.mjs");
var fs = require('fs');
const Store = require('electron-store');
const store = new Store();
const host = 'localhost'
const port = 5050;
const http = require('http'); // todo: will need to be encrypted 
const DEBUG = true;

"use strict";
process.title = 'Chat_Server';

var history = [];
var myChat = "./chat.json"
if (fs.existsSync(myChat)) {
	restoreFromFile();
}
var clients = [];
function htmlEntities(str) {
	return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}
var colors = ['purple', 'plum', 'orange', 'red', 'green', 'blue', 'magenta'];
colors.sort(function(a,b) {
	return Math.random() > 0.5;	
});

http.createServer((request, response) => {
	httpLogic.serverLogic(request, response);
}).listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});


// 
// var server = http.createServer(function(request, response) {
// });
// server.listen(webSocketsServerPort, function() {
// 	console.log("Server listening port "  + webSocketsServerPort);
// });
// var wsServer = new webSocketServer({
// 	httpServer: server
// });
// wsServer.on('request', function(request) {
// 	// console.log(' Connection origin ' + request.origin + '.');
// 	var connection = request.accept(null, request.origin);
// 	var index = -1;
// 	// var index = clients.push(connection) - 1;
// 	var userName = false;
// 	var connectionSaved = false;
// 	var userColor = false;
// 	connection.on('message', function(message) {
// 		if (message.type === 'utf8') {
// 			// if (DEBUG) console.log(message.utf8Data)
// 			let inComingMsg = JSON.parse(message.utf8Data)
			
// 			userName = inComingMsg.user;
// 			// console.log("user logged in: " + inComingMsg.user)
// 			if (index == -1) {
// 				index=clients.push({"connection":connection, "userName":userName})
// 			}
// 			// store.set(userName + "_loggedin", true);
// 			// console.log(userName + " logged in")
// 			let msg = inComingMsg.msg
// 			userColor = inComingMsg.userColor
// 			// if (DEBUG) console.log('Message type: ' + inComingMsg.type)
// 			if (inComingMsg.type == "ping") {
// 				let message = {type:"pong"};
// 				connection.send(JSON.stringify(message));
// 				return;
// 			}
// 			else if (inComingMsg.type == "colorChange") {
// 				// do something
// 				store.set(userName + "_Color", userColor);
// 				let allNames = JSON.parse(inComingMsg.allNames);
// 				for (var i = 0; i < allNames.length; ++i) {
// 					changeMessagesColor(allNames[i], userColor, inComingMsg);
// 					// console.log("changing message color for " + allNames[i])
// 				}
// 				sendHistoryToAll();
// 				return;
// 			}
// 			else if (inComingMsg.type == "historyRequest") {
// 				// send history
// 				// if (DEBUG) console.log("history route chosen")
// 				sendHistory(connection);
// 				return
// 			}
// 			else if (inComingMsg.type === 'AuthRequest') {
// 				if (DEBUG) console.log("auth request!")
// 				// check to see if credentials are valid!
// 				var json = JSON.stringify({ type:'AuthResponse', result: "failure", key:"" });
// 				let key = checkLoginCreds(connection, inComingMsg.user, inComingMsg.passwordHash) 
// 				if (key == "password_wrong") {
// 					json = JSON.stringify({ type:'AuthResponse', result: "failure", key:key });
// 				}
// 				else if (key == "username_not_exist") {
// 					json = JSON.stringify({ type:'AuthResponse', result: "failure", key:key });
// 				}
// 				else if (key == "already_loggedin") {
// 					json = JSON.stringify({ type:'AuthResponse', result: "failure", key:key });
// 				}
// 				else if (key != "") {
// 					userColor = store.get(inComingMsg.user + "_Color", "blue");
// 					json = JSON.stringify({ type:'AuthResponse', color:userColor, result: "success", key:key }); // make valid response
// 				}
// 				// send response
// 				connection.sendUTF(json)
// 				if (DEBUG) console.log("Sending to client:")
// 				if (DEBUG) console.log(json)
// 				return;
// 			}
// 			else if (inComingMsg.type === 'RegistrationRequest') {
// 				if (DEBUG) console.log("registration request!")
// 				var json = JSON.stringify({ type:'RegistrationResponse', result: "failure", key:"" });
// 				let key = checkRegistrationCreds(inComingMsg.user, inComingMsg.passwordHash)
// 				if (key == "username_exists") {
// 					json = JSON.stringify({ type:'RegistrationResponse', result: "failure", key:"username_exists" });
// 				}
// 				else if (key == "password_wrong") {
// 					json = JSON.stringify({ type:'RegistrationResponse', result: "failure", key:"password_wrong" });
// 				}
// 				else if (key != "") {
// 					userColor = store.get(inComingMsg.user + "_Color", "blue");
// 					json = JSON.stringify({ type:'RegistrationResponse', color:userColor, result: "success", key:key }); // make valid response
// 				}
// 				connection.sendUTF(json)
// 				if (DEBUG) console.log("Sending to client:")
// 				if (DEBUG) console.log(json)
// 				return
// 			}
// 			else if (inComingMsg.type === 'message') {
// 				store.set(userName+"_Color", userColor);
// 				userName = inComingMsg.user
// 				console.log("	" + inComingMsg.userEnc + " sent '" + msg + "'. They have color " + userColor + " and encryption " + inComingMsg.encryption)
// 					var obj = {
// 						time: inComingMsg.time,
// 						text: htmlEntities(msg),
// 						author: inComingMsg.userEnc,
// 						color: userColor,
// 						encryption: inComingMsg.encryption
// 					};
// 					// history.push(obj); // save messages
// 					// history = history.slice(-100);
// 					saveToFile(obj);
// 					// changeMessagesColor(userName, userColor, inComingMsg);
// 					var json = JSON.stringify({ type:'message', data: obj });
// 					for (var i=0; i < clients.length; i++) { // send history to users
// 						clients[i].connection.sendUTF(json);
// 					}
// 			}
// 			else {
// 				console.log("received a message of type unknown");
// 			}
// 		}
// 	});
// 	connection.on('close', function(connection) {
// 		if (userName !== false) {
// 			// console.log(connection + " was disconnected.");
// 			clients.splice(index, 1);
// 			// console.log("	client index " + index + " was spliced");
// 			// colors.push(userColor);
// 			// store.set(userName + "_loggedin", false);
// 			// console.log(userName + " logged out")
// 		}
// 	});
// });

// // // --------------------------------------------- Helper functions ---------------------------------------------
// // function isNumeric(value) {
// //     return /^-?\d+$/.test(value);
// // }

// // function getRandomArbitrary(min, max) {
// // 	return Math.floor(Math.random() * (max - min) + min);
// // }

// function changeMessagesColor(userName, userColor) { // used to have something here about incomingmsg and it's user
// 	history.forEach(function (item, index) {
// 		if (item.author == userName && item.color != userColor) {
// 			if (DEBUG) console.log(item.text + " -> changed to color " + userColor)
// 			item.color = userColor;
// 		}
// 	});
// }

// function sendHistory(connection) {
// 	if (history.length > 0) {
// 		connection.sendUTF(JSON.stringify({ type: 'history', data: history} ));
// 	}
// }

// function sendToAll(json) {
// 	for (var i=0; i < clients.length; i++) { // send history to users
// 		clients[i].connection.sendUTF(json);
// 	}
// }

// function sendHistoryToAll() {
// 	for (var i=0; i < clients.length; i++) { // send history to users
// 		// clients[i].sendUTF();
// 		if (history.length > 0) {
// 			clients[i].connection.sendUTF(JSON.stringify({ type: 'history', data: history} ));
// 		}
// 	}
// }

  

// function saveToFile(obj) {
// 	history.push(obj); // save messages
// 	history = history.slice(-100);
// 	fs.writeFile("chat.json", JSON.stringify(history), function(err) {
// 		if (err) {
// 			console.log(err);
// 		}
// 	});
// }

function restoreFromFile() {
	fs.readFile('chat.json', function read(err, data) {
		if (err) {
			console.log(err);
			return;
		}
		history = JSON.parse(data);
	})
}

// function displayClients() {
// 	for (var i=0; i < clients.length; ++i) {
// 		console.log("	" +	clients[i].userName + " has a connection")
// 	}
// }

// function logOutOthers(thisConnection, username) {
// 	for (var i=0; i < clients.length; i++) { // send history to users
// 		if (clients[i].userName == username && clients[i].connection != thisConnection) {
// 			clients[i].connection.sendUTF(JSON.stringify({ type:'logout', result: "other_login", key:"" }))
// 			clients[i].connection.close();
// 			clients.splice[i, 1];
// 		}
		
// 		// clients[i].connection.sendUTF(json);
// 	}
// }

// var ONE_DAY = 12 * 60 * 60 * 1000; /* ms */
// setInterval(function() {
// 	console.log("Daily Removal Of Old Messages: ")
// 	for (let i = 0; i < history.length; ++i) {
// 		if (new Date() - history[i].time > (ONE_DAY * 3)) { // 3 days
// 			console.log("		removing message: " + history[i].text)
// 			history.splice(i, 1);
// 		}
// 	}
// 	fs.writeFile("chat.json", JSON.stringify(history), function(err) {
// 		if (err) {
// 			console.log(err);
// 		}
// 	});
// 	sendHistoryToAll();
// }, ONE_DAY); // every day delete messages older than 3 days