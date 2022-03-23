var fs = require('fs');
var crypto = require('crypto').generateKey
const DEBUG = true;

var activeUsers = [];

function checkIn (username) {
	if (activeUsers.find(activeUser => activeUser.username == username) != null) {
		if (activeUsers.find(activeUser => activeUser.username == username).active == false) logEvent(username + " is active")
		activeUsers.find(activeUser => activeUser.username == username).active = true;
		activeUsers.find(activeUser => activeUser.username == username).timeLastSeen = (new Date).getTime();
	}
}

setInterval(() => {
	let timeNow = (new Date).getTime();
	activeUsers.forEach(activeUser => {
		if (activeUser.active == true && activeUser.timeLastSeen + 7000 < timeNow) {
			activeUser.active = false;
			logEvent(activeUser.username + " is no longer active")
		}
	})
}, 3000)

function ping() {
	return { type:'Pong', result: "success" };
}

async function negociate(chunk) {
	let mod = generatePrime();
	// console.log("Mod will be: " + mod)
	let base = generatePrime();				
	// console.log("Base will be: " + base)
	let serverPrime = generatePrime();
	await createKeys(chunk.username)
	await saveNegociateDataToMongo(chunk.username, mod, base, serverPrime);
	checkIn(chunk.username);
	await new Promise(r => setTimeout(r, 1000)); // will sleep for 1 second - shouldn't use this, but I can't get saveLoginDataToMongo() to return before this function returns
	// console.log("Saved Data to Mongo")
	return { mod: mod, base:base }
}

async function login(chunk) {
	var user = await getUser(chunk)
	if (user != null) {
		if (user.password == chunk.password) {
			var sessionID = createGuid();
			user.sessionID = sessionID;
			if (updateUser(user)) {
				logEvent("Successful login by username: '" + chunk.username + "'")
				await saveLoginDataToMongo(chunk.username, sessionID);
				checkIn(chunk.username);
				return { type:'AuthResponse', color:user.color, result: "success", sessionID:sessionID };
			}
			else {
				logEvent("Server error logging in username: '" + chunk.username + "'")
				return { type:'AuthResponse', result: "failure", sessionID:"server_error" };
			}
		}
	}
	logEvent("Login attempt made for username: '" + chunk.username + "' with an incorrect password")
	return  { type:'AuthResponse', result: "failure", sessionID:"incorrect_credentials" };
}

async function register(chunk) {
	var sessionID = createGuid();
	chunk.sessionID = sessionID;
	chunk.color = "#0000FF"
	if (await createUser(chunk)) {
		logEvent("Successful registration for username: '" + chunk.username + "'")
		await saveLoginDataToMongo(chunk.username, sessionID);
		checkIn(chunk.username);
		return { type:'AuthResponse', color:"#0000FF", result: "success", sessionID:sessionID };
	}
	else {
		logEvent("Registration attempt made for username: '" + chunk.username + "' who already exists")
		return { type:'AuthResponse', result: "failure", sessionID:"username_exists" };
	}
}

async function receiveChatMessage(chunk) {
	// store.set(chunk.username + "_Color", chunk.color);
	// if (DEBUG) logEvent("Username:'" + chunk.username + "' sent '" + chunk.message + "' with '" + chunk.encryption + "' encryption")
	// else logEvent("Message recieved from username: '" + chunk.username + "'");
	logEvent("Message recieved from username: '" + chunk.username + "'");
	checkIn(chunk.username);
	var obj = {
		time: chunk.time,
		// text: replaceEscapeCharacters(chunk.msg),
		text: chunk.message,
		username: chunk.username,
		color: chunk.color,
		guid: chunk.guid
	};
	return await saveMsgToMongo(chunk.chatRoomName, obj);
}

async function sendAllMessages(chunk) {
	checkIn(chunk.username);
	return getAllMessagesFromMongo(chunk.chatRoomName);
}

async function sendAllUsers(chunk) {
	checkIn(chunk.username);
	return getAllUsersFromMongo(chunk.chatRoomName);
}

async function sendNewMessages(chunk) {
	checkIn(chunk.username);
	return getNewMessagesFromMongo(chunk.timeOfLastMessage, chunk.chatRoomName);
}

async function diffieHellman(chunk) {
	checkIn(chunk.username);
	var user = await getUser(chunk);
	// console.log(JSON.stringify(user));
	// console.log("Chunk username is: " + chunk.username)
	var mod = user.mod;
	// console.log("Mod is: " + mod)
	var base = chunk.diffieHellman;
	// console.log("Base is: " + base)
	var serverPrime = user.serverPrime;
	// console.log("ServerPrime is: " + serverPrime)
	var result = powerMod(base, serverPrime, mod);
	saveSharedKeyToMongo(user.username, result)
	await new Promise(r => setTimeout(r, 300)); // will sleep for .3 seconds - shouldn't use this
	logEvent("SharedKey for " + user.username + ": " + result);
	// now send client your generated number
	base = user.base;
	// console.log("Base is: " + base)
	result = powerMod(base, serverPrime, mod);
	// console.log("Sending to client: " + result)
	return { diffieHellman: result }
}

async function changeChatColor(chunk) {
	checkIn(chunk.username);
	// change User 
	var user = await getUser(chunk);
	if (user != null) {
		user.color = chunk.color;
		if (await updateUser(user)) {
			logEvent("User color change for username: '" + chunk.username + "' to color: '" + chunk.color + "'");
			// var result = await changeColorOnAllChats(chunk)
			// if (result != false) {
			// 	logEvent("Chat colors changed for username: '" + chunk.username + "' to color: '" + chunk.color + "'");
			// 	return true;
			// }
			// else {
			// 	logEvent("ERROR: Failed chat colors change for username: '" + chunk.username + "' to color: '" + chunk.color + "'");
			// 	return false;
			// }
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

function generatePrime() {
    const range = [0, 1000000]; // make this larger when a loading screen is created
    const getPrimes = (min, max) => {
    const result = Array(max + 1)
    .fill(0)
    .map((_, i) => i);
    for (let i = 2; i <= Math.sqrt(max + 1); i++) {
        for (let j = i ** 2; j < max + 1; j += i) delete result[j];
    }
    return Object.values(result.slice(min));
    };
    const getRandomNum = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
    };
    const getRandomPrime = ([min, max]) => {
    const primes = getPrimes(min, max);
    return primes[getRandomNum(0, primes.length - 1)];
    };
    return(getRandomPrime(range))
}

// calculates   base^exponent % modulus
function powerMod(base, exponent, modulus) {
    if (modulus === 1) return 0;
    var result = 1;
    base = base % modulus;
    while (exponent > 0) {
        if (exponent % 2 === 1)  //odd number
            result = (result * base) % modulus;
        exponent = exponent >> 1; //divide by 2
        base = (base * base) % modulus;
    }
    return result;
}

async function verifySessionID(chunk) {
	try {
		// console.log(JSON.stringify(chunk))
		var user = await getUser(chunk);
		if (chunk.sessionID != user.sessionID) {
			logEvent("SessionID verification failed for " + user.username)
			return false;
		}
		return true;
	} catch (e) {
		logEvent("ERROR in verifying session ID: " + e)
	}
}

async function giveKeys(chunk) {
	checkIn(chunk.username);
	try {
		// Including generateKeyPair from crypto module
		// const { generateKeyPair } = require('crypto');
		
		// Calling generateKeyPair() method
		// with its parameters
		// var pubKey = "";
		// var privKey = "";

		// generateKeyPair('rsa', {
		// 	modulusLength: 4096,
		// 	publicKeyEncoding: {
		// 		type: 'spki',
		// 		format: 'pem'
		// 	},
		// 	privateKeyEncoding: {
		// 		type: 'pkcs8',
		// 		format: 'pem',
		// 		cipher: 'aes-256-cbc',
		// 		passphrase: 'top secret'
		// 	}
		// }, async (err, publicKey, privateKey) => {
		// 	if(!err)
		// 	{
		// 		await saveKeysToMongo(chunk.username, publicKey, privateKey) // should I save these in hex?
		// 	}
		// 	else
		// 	{
		// 		// Prints error
		// 		console.log("Errr is: ", err);
		// 	}
		// });
		
		// await new Promise(r => setTimeout(r, 1000)); // will sleep for 1 second - shouldn't use this
		var user = await getUser(chunk);
		const crypto = require('crypto')
		const cryptojs = require('crypto-js')
		const hashOfSharedKey = crypto.createHash('sha256', user.sharedKey).digest('hex');
		// console.log("Private Key: " + user.privKey)
		// console.log("Hash of Shared Key: " + hashOfSharedKey);
		var encrypted = cryptojs.AES.encrypt(user.privKey, hashOfSharedKey).toString();
		// console.log(encrypted);
		return encrypted;
	} catch (e) {
		console.log(e)
	}
}

async function createKeys(username) {
	const NodeRSA = require('encrypt-rsa').default;
	const nodeRSA = new NodeRSA();
	const { privateKey, publicKey } = nodeRSA.createPrivateAndPublicKeys()
	await saveKeysToMongo(username, publicKey, privateKey)
}

async function sendActiveUsers(chunk) {
	checkIn(chunk.username);
	if (activeUsers.length == 0) {
		var data = await getAllUsersFromMongo("");
			// console.log(data)
			data.forEach(user => {
				var activeUser = {username:"", active:false, timeLastSeen:(new Date).getTime()};
				activeUser.username = user.username;
				activeUser.active = false;
				activeUser.timeLastSeen = (new Date).getTime();
				activeUsers.push(activeUser);
				delete(activeUser);
			})
	}
	return activeUsers;
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

async function saveLoginDataToMongo(username, sessionID) {
	_db = await getDbConnection();
	var myquery = { username: username };
	var newvalues = { $set: { sessionID:sessionID } };
	return await _db.collection("Users").updateOne(myquery, newvalues, function(err, res) {
		if (err) throw err;
		logEvent("User document updated with mod, base, server key, and sessionID for " + username);
		// db.close();
	});
	// return data;
	// console.log("Returning now")
}

async function saveNegociateDataToMongo(username, mod, base, serverPrime) {
	_db = await getDbConnection();
	var myquery = { username: username };
	var newvalues = { $set: {mod: mod, base: base, serverPrime: serverPrime } };
	return await _db.collection("Users").updateOne(myquery, newvalues, function(err, res) {
		if (err) throw err;
		logEvent("User document updated with mod, base, and server prime for " + username);
		// db.close();
	});
	// return data;
	// console.log("Returning now")
}

async function saveSharedKeyToMongo(username, sharedKey) {
	_db = await getDbConnection();
	var myquery = { username: username };
	var newvalues = { $set: { sharedKey: sharedKey } };
	return await _db.collection("Users").updateOne(myquery, newvalues, function(err, res) {
		if (err) throw err;
		logEvent("User document updated with shared key for " + username);
		// db.close();
	});
}

async function saveKeysToMongo(username, pubKey, privKey) {
	_db = await getDbConnection();
	var myquery = { username: username };
	var newvalues = { $set: { pubKey:pubKey, privKey: privKey } };
	return await _db.collection("Users").updateOne(myquery, newvalues, function(err, res) {
		if (err) throw err;
		logEvent("User document updated with private and public keys for " + username);
		// db.close();
	});
	// return data;
	// console.log("Returning now")
}

async function getAllMessagesFromMongo(chatRoomName) {
	_db = await getDbConnection();
	var data = await _db.collection(chatRoomName).find({}, {projection:{}}).toArray(); // usernames of messages are omitted so they're hidden from clients
	// closeConnection();
	return data;
}

async function getAllUsersFromMongo(chatRoomName) {
	_db = await getDbConnection();
	var data = await _db.collection("Users").find({}, {projection:{color: 0, time: 0, encryption: 0, password: 0, _id: 0, privKey: 0, sessionID: 0, serverPrime: 0, mod: 0, base: 0, sharedKey: 0}}).toArray(); // usernames of messages are omitted so they're hidden from clients
	// closeConnection();
	// console.log(data);
	return data;
}

async function getNewMessagesFromMongo(timeOfLastMessage, chatRoomName) {
	_db = await getDbConnection();
	var data = "";
	if (timeOfLastMessage == "") {
		// console.log("Time not provided")
		data = await _db.collection(chatRoomName).find({}).toArray();
	}
	else {
		// console.log("Time provided")
		data = await _db.collection(chatRoomName).find({ time: { $gt: timeOfLastMessage }}, {projection:{}}).toArray(); // usernames of messages are omitted so they're hidden from clients
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

// other functions

// exports

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
exports.sendAllUsers = sendAllUsers;
exports.diffieHellman = diffieHellman;
exports.verifySessionID = verifySessionID;
exports.giveKeys = giveKeys;
exports.negociate = negociate;
exports.sendActiveUsers = sendActiveUsers;