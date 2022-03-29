/*____ _                  _       _                    _____                          
/  ___| |                | |     | |                  /  ___|                         
\ `--.| |_ __ _ _ __   __| | __ _| | ___  _ __   ___  \ `--.  ___ _ ____   _____ _ __ 
`--. \ __/ _` | '_ \ / _` |/ _` | |/ _ \| '_ \ / _ \  `--. \/ _ \ '__\ \ / / _ \ '__|
/\__/ / || (_| | | | | (_| | (_| | | (_) | | | |  __/ /\__/ /  __/ |   \ V /  __/ |   
\____/ \__\__,_|_| |_|\__,_|\__,_|_|\___/|_| |_|\___| \____/ \___|_|    \_/ \___|_|   
*/

const logic = require('./logic_server.js');
require('dotenv').config();
const host = 'localhost'
const port = 5050;
const { pid } = require('process');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json({ type: '*/*' }));

"use strict";
process.title = 'Incrypto_Server';

// Take into account where .env would be located if run from inside the Server_Standalone folder instead of the project's root
var directoryToRunFrom = __dirname;
var indexToCut = directoryToRunFrom.indexOf("Server_Standalone")
if (indexToCut != -1) {
	directoryToRunFrom = directoryToRunFrom.substring(0, indexToCut);
}

// Make sure .env file exists
const { exists, writeFile } = require('fs');
exists(directoryToRunFrom + '/.env', (e) => {
	
	if (e && process.env.CONN_STRING != "<enter mongo connection string here>") { // if .env exists and doesn't have the default CONN_STRING
		
		// CREATE SERVER ENDPOINTS
		
		// GET REQUESTS
		
		app.get('/', function (req, res) {
			res.send('Incrypto Server Running');
		})
		
		app.get('/api/ping', function (req, res) {
			res.send("PONG!");
		})
		
		// POST REQUESTS
		
		app.post('/api/login', async function (req, res) {
			res.send(await logic.login(req.body));
		})
		
		app.post('/api/register', async function (req, res) {
			res.send(await logic.register(req.body));
		})
		
		app.post('/api/message', async function(req, res) {
			if (! await logic.verifySessionID(req.body)) {
				res.send('{"error":"incorrectSessionID"}');
				return;
			}
			var result = await logic.receiveChatMessage(req.body)
			if (result != false) {
				res.send("Recieved");
			}
			else {
				res.send("Error")
			}
		})
		
		// app.post('/api/message/all', async function (req, res) {
		// 	// console.log("getting all messages")
		// 	if (! await logic.verifySessionID(req.body)) {
		// 		res.send('{"error":"incorrectSessionID"}');
		// 		return;
		// 	}
		// 	res.send(await logic.sendAllMessages(req.body));
		// })
		
		app.post('/api/message/new', async function(req, res) {
			// console.log("getting new messages")
			if (! await logic.verifySessionID(req.body)) {
				res.send('{"error":"incorrectSessionID"}');
				return;
			}
			res.send(await logic.sendNewMessages(req.body));
		})

		// app.post('/api/users/all', async function (req, res) {
		// 	// console.log("getting all users")
		// 	if (! await logic.verifySessionID(req.body)) {
		// 		res.send('{"error":"incorrectSessionID"}');
		// 		return;
		// 	}
		// 	res.send(await logic.sendAllUsers(req.body));
		// })

		app.post('/api/users/chatroom', async function (req, res) {
			// console.log("getting all users")
			if (! await logic.verifySessionID(req.body)) {
				res.send('{"error":"incorrectSessionID"}');
				return;
			}
			res.send(await logic.sendChatRoomUsers(req.body));
		})

		app.post('/api/users/chatroom/join', async function (req, res) {
			if (! await logic.verifySessionID(req.body)) {
				res.send('{"error":"incorrectSessionID"}');
				return;
			}
			res.send(await logic.joinChatRoom(req.body));
		})

		app.post('/api/users/chatroom/leave', async function (req, res) {
			if (! await logic.verifySessionID(req.body)) {
				res.send('{"error":"incorrectSessionID"}');
				return;
			}
			res.send(await logic.leaveChatRoom(req.body));
		})

		app.post('/api/users/chatroom/create', async function (req, res) {
			if (! await logic.verifySessionID(req.body)) {
				res.send('{"error":"incorrectSessionID"}');
				return;
			}
			res.send(await logic.createChatRoom(req.body));
		})

		// app.post('/api/users/active', async function (req,res) {
		// 	if (! await logic.verifySessionID(req.body)) {
		// 		res.send('{"error":"incorrectSessionID"}');
		// 		return;
		// 	}
		// 	res.send(await logic.sendActiveUsers(req.body))
		// })

		app.post('/api/keys/negociate', async function (req, res) {
			if (! await logic.verifySessionID(req.body)) {
				res.send('{"error":"incorrectSessionID"}');
				return;
			}
			logic.logEvent("Sending negociation information to " + req.body.username)
			res.send(await logic.negociate(req.body));
		})

		app.post('/api/keys/diffieHellman', async function (req, res) {
			if (! await logic.verifySessionID(req.body)) {
				res.send('{"error":"incorrectSessionID"}');
				return;
			}
			logic.logEvent("Performing Diffie-Hellman exchange with " + req.body.username)
			res.send(await logic.diffieHellman(req.body));
		})

		app.post('/api/keys/getKeys', async function (req, res) {
			if (! await logic.verifySessionID(req.body)) {
				res.send('{"error":"incorrectSessionID"}');
				return;
			}
			logic.logEvent("Getting public/private keys for " + req.body.username)
			res.send(await logic.giveKeys(req.body)); 
		})

		app.post('/api/keys/createKeys', async function (req, res) {
			if (! await logic.verifySessionID(req.body)) {
				res.send('{"error":"incorrectSessionID"}');
				return;
			}
			logic.logEvent("Creating public/private keys for " + req.body.username)
			res.send(await logic.giveNewKeys(req.body)); 
		})
		
		app.post('/api/color', async function(req, res) {
			// console.log("changing color")
			if (! await logic.verifySessionID(req.body)) {
				res.send('{"error":"incorrectSessionID"}');
				return;
			}
			var result = await logic.changeChatColor(req.body)
			if (result != false) {
				res.send("Recieved");
			}
			else {
				res.send("Error")
			}
		})
		
		// LISTEN
		
		var server = app.listen(port, function () {
			// var host = server.address().address
			var port = server.address().port
			var ip = require("ip");
			var http = require('http');
			http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp) {
				resp.on('data', function(ip) {
					logic.logEvent("Incrypto_Server public IP address is: " + ip);
				});
			});
			logic.logEvent(`Incrypto_Server was started on http://${ip.address()}:${port} with pid ${pid}`)
		})
		
	} else { // create the .env file
		writeFile(directoryToRunFrom + '/.env', "DATABASE_NAME=Incrypto\nCONN_STRING=<enter mongo connection string here>\n# Depending on the version, the CONN_STRING should look similar to...\n#    CONN_STRING=mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.3.1\n# if using a local instance, or something like...\n#   CONN_STRING=mongodb+srv://<username here>:<password here>@cluster0.4ndu7.mongodb.net/myFirstDatabase?retryWrites=true&w=majority\n# if using Mongo Atlas", (err) => {
			logic.logEvent(".env file created")
		})
		logic.logEvent("IMPORTANT: Please input a CONN_STRING for your Mongo Database in the .env file")
	}
});
