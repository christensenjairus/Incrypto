/*____ _                  _       _                    _____                          
/  ___| |                | |     | |                  /  ___|                         
\ `--.| |_ __ _ _ __   __| | __ _| | ___  _ __   ___  \ `--.  ___ _ ____   _____ _ __ 
`--. \ __/ _` | '_ \ / _` |/ _` | |/ _ \| '_ \ / _ \  `--. \/ _ \ '__\ \ / / _ \ '__|
/\__/ / || (_| | | | | (_| | (_| | | (_) | | | |  __/ /\__/ /  __/ |   \ V /  __/ |   
\____/ \__\__,_|_| |_|\__,_|\__,_|_|\___/|_| |_|\___| \____/ \___|_|    \_/ \___|_|   
*/

const logic = require('./server_logic.js');
require('dotenv').config();
const host = 'localhost'
const port = 5050;
const { pid } = require('process');
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
app.use(bodyParser.json({ type: '*/*' }));

"use strict";
process.title = 'Incrypto_Server';

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
	var result = await logic.receiveChatMessage(req.body)
	if (result != false) {
		res.send("Recieved");
	}
	else {
		res.send("Error")
	}
})

app.post('/api/message/all', async function (req, res) {
	res.send(await logic.sendAllMessages(req.body))
})

app.post('/api/message/new', async function(req, res) {
	res.send(await logic.sendNewMessages(req.body));
})

app.post('/api/color', async function(req, res) {
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
	
	logic.logEvent(`Incrypto Server was started on http://${host}:${port} with pid ${pid}`)
})