var fs = require('fs');
const DEBUG = true;

function ping() {
	return { type:'Pong', result: "success" };
}

async function login(chunk) {
	var user = await getUser(chunk)
	if (user != null) {
		if (user.password == chunk.password) {
			var key = createGuid();
			user.key = key;
			if (updateUser(user)) {
				logEvent("Successful login by username: '" + chunk.username + "'")
				return { type:'AuthResponse', color:user.color, result: "success", key:key };
			}
			else {
				logEvent("Server error logging in username: '" + chunk.username + "'")
				return { type:'AuthResponse', result: "failure", key:"server_error" };
			}
		}
	}
	logEvent("Login attempt made for username: '" + chunk.username + "' with an incorrect password")
	return  { type:'AuthResponse', result: "failure", key:"incorrect_credentials" };
}

async function register(chunk) {
	var key = createGuid();
	chunk.key = key;
	chunk.color = "#0000FF"
	if (await createUser(chunk)) {
		logEvent("Successful registration for username: '" + chunk.username + "'")
		return { type:'AuthResponse', color:"#0000FF", result: "success", key:key };
	}
	else {
		logEvent("Registration attempt made for username: '" + chunk.username + "' who already exists")
		return { type:'AuthResponse', result: "failure", key:"username_exists" };
	}
}

async function receiveChatMessage(chunk) {
	// store.set(chunk.username + "_Color", chunk.color);
	if (DEBUG) logEvent("Username:'" + chunk.username + "' sent '" + chunk.msg + "' with '" + chunk.encryption + "' encryption")
	else logEvent("Message recieved from username: '" + chunk.username + "'");
	var obj = {
		time: chunk.time,
		text: replaceEscapeCharacters(chunk.msg),
		author: chunk.encryptedUsername,
		username: chunk.username,
		color: chunk.color,
		encryption: chunk.encryption,
		guid: createGuid()
	};
	return await saveMsgToMongo(chunk.chatRoomName, obj);
}

async function sendAllMessages(chunk) {
	return getAllMessagesFromMongo(chunk.chatRoomName);
}

async function sendNewMessages(chunk) {
	return getNewMessagesFromMongo(chunk.timeOfLastFetch, chunk.chatRoomName);
}

async function changeChatColor(chunk) {
	// change User 
	var user = await getUser(chunk);
	if (user != null) {
		user.color = chunk.color;
		if (await updateUser(user)) {
			logEvent("User color change for username: '" + chunk.username + "' to color: '" + chunk.color + "'");
			return true;
		}
	}
	logEvent("ERROR: Color change failed for username: '" + chunk.username + "' and color: '" + chunk.color + "'")
	return false;
}

function createGuid() {  
	function _p8(s) {  
		var p = (Math.random().toString(16)+"000000000").substr(2,8);  
		return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;  
	}  
	return _p8() + _p8(true) + _p8(true) + _p8();  
}

function getFormattedDate() {
	var date = new Date();
	var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	return str;
}

function logEvent(dataToLog) {
	dataToLog = getFormattedDate() + ": " + dataToLog;
	fs.appendFile("server.log", dataToLog + "\n", function(err) {
		if (err) { 
			console.log(err);
		}
	});
	console.log(dataToLog);
}

function replaceEscapeCharacters(str) {
	return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

// MONGO DATABASE FUNCTIONS --------------------------------------------------------- 

const MongoClient = require('mongodb').MongoClient;
var _connection;
var _db;

const closeConnection = () => {
	_connection.close();
}

/**
* @returns Promise<Db> mongo Db instance
*/
const getDbConnection = async () => {
	if (_db) {
		return _db;
	}
	logEvent('Connecting to MongoDB...');
	const mongoClient = new MongoClient(process.env.CONN_STRING, { useNewUrlParser: true });
	_connection = await mongoClient.connect();
	_db = _connection.db(process.env.DATABASE_NAME);
	logEvent("Connected to MongoDB");
	return _db;
}

async function saveMsgToMongo(chatRoomName, obj) {
	_db = await getDbConnection();
	return await _db.collection(chatRoomName).insertOne(obj);
}

async function getAllMessagesFromMongo(chatRoomName) {
	_db = await getDbConnection();
	var data = await _db.collection(chatRoomName).find({}, {projection:{username: 0}}).toArray(); // usernames of messages are omitted so they're hidden from clients
	// closeConnection();
	return data;
}

async function getNewMessagesFromMongo(timeOfLastFetch, chatRoomName) {
	_db = await getDbConnection();
	var data = "";
	if (timeOfLastFetch == "") {
		data = await _db.collection(chatRoomName).find({}).toArray();
	}
	else {
		data = await _db.collection(chatRoomName).find({ time: { $gt: timeOfLastFetch }}, {projection:{username: 0}}).toArray(); // usernames of messages are omitted so they're hidden from clients
	}
	// console.log(data)
	return data;
}

async function createUser(chunk) {
	_db = await getDbConnection();
	var user = await getUser(chunk);
	if (user == null) {
		return await _db.collection("Users").insertOne(chunk);
	}
	else {
		return false;
	}
}

async function getUser(chunk) {
	_db = await getDbConnection();
	return await _db.collection("Users").findOne({username: chunk.username},{});
}

async function updateUser(chunk) {
	_db = await getDbConnection();
	return await _db.collection("Users").findOneAndReplace({username: chunk.username}, chunk)
}

exports.getDbConnection = getDbConnection;
exports.closeConnection = closeConnection;
exports.login = login;
exports.register = register;
exports.logEvent = logEvent;
exports.ping = ping;
exports.receiveChatMessage = receiveChatMessage;
exports.sendAllMessages = sendAllMessages;
exports.changeChatColor = changeChatColor;
exports.sendNewMessages = sendNewMessages;