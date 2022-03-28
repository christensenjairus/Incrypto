var fs = require('fs');
const debug = false;

function ping() {
	return { type:'Pong', result: "success" };
}

async function login(chunk) {
	var user = await getUser(chunk)
	if (user != null) {
		if (user.password == chunk.password) {
			var sessionID = createGuid();
			user.sessionID = sessionID;
			if (await updateUser(user)) {
				logEvent("Successful login by username: '" + chunk.username + "'")
				await saveLoginDataToMongo(chunk.username, sessionID);
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
	if (chunk.username == "") return { type:'AuthResponse', result: "failure", sessionID:"no username" };
	if (chunk.password == "") return { type:'AuthResponse', result: "failure", sessionID:"no password" };
	if (await createUser(chunk)) {
		logEvent("Successful registration for username: '" + chunk.username + "'")
		await saveLoginDataToMongo(chunk.username, sessionID);
		return { type:'AuthResponse', color:"#0000FF", result: "success", sessionID:sessionID };
	}
	else {
		logEvent("Registration attempt made for username: '" + chunk.username + "' who already exists")
		return { type:'AuthResponse', result: "failure", sessionID:"username_exists" };
	}
}

async function receiveChatMessage(chunk) {
	// store.set(chunk.username + "_Color", chunk.color);
	// if (debug) logEvent("Username:'" + chunk.username + "' sent '" + chunk.message + "' with '" + chunk.encryption + "' encryption")
	// else logEvent("Message recieved from username: '" + chunk.username + "'");
	logEvent("Message recieved from username: '" + chunk.username + "'");
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

// async function sendAllMessages(chunk) {
// 	return getAllMessagesFromMongo(chunk.chatRoomName);
// }

// async function sendAllUsers(chunk) {
// 	return getAllUsersFromMongo(chunk.chatRoomName);
// }

async function sendChatRoomUsers(chunk) {
	checkIn(chunk.username, chunk.chatRoomName);
	return getChatRoomUsersFromMongo(chunk.chatRoomName);
}

async function sendNewMessages(chunk) {
	return getNewMessagesFromMongo(chunk.timeOfLastMessage, chunk.chatRoomName, chunk.numberOfChats);
}

async function changeChatColor(chunk) {
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

async function verifySessionID(chunk) {
	try {
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

async function negociate(chunk) {
	try {
	// generate base and mod prime numbers to use in diffie hellman exchange
	const getlargePrime = require('get-large-prime');
	let mod = await getlargePrime(1024);
	mod = mod.toString();
	if (debug) logEvent("Mod for " + chunk.username + ": " + mod)
	let base = await getlargePrime(1024);
	base = base.toString();
	if (debug) logEvent("Base for " + chunk.username + ": " + base)

	// save to database for retrieval at diffieHellman()
	await saveNegociateDataToMongo(chunk.username, base, mod)
	return { base:base, mod:mod }
	} catch (e) {
		// return { error: e }
	}
}

async function diffieHellman(chunk) {
	try {
	// retrieve prime numbers needed for diffie-hellman prime math
	let user = await getUser(chunk);
	let mod = user.mod;
	let base = user.base;
	let clientPartial = chunk.clientPartial;
	if (debug) logEvent("clientPartial for " + user.username + ": " + clientPartial)

	// create server's prime number to be it's secret
	const getlargePrime = require('get-large-prime');
	let serverExponent = await getlargePrime(1024);
	serverExponent = serverExponent.toString();
	if (debug) logEvent("serverExponent for " + user.username + ": " + serverExponent)

	// compute shared secret using the diffie hellman data sent by client
	let sharedSecret = compute(clientPartial, serverExponent, mod)
	await saveSharedSecretToMongo(chunk.username, sharedSecret)
	if (debug) logEvent("sharedSecret for " + user.username + ": " + sharedSecret)

	// compute server's diffie hellman data to send to client
	let serverPartial = compute(base, serverExponent, mod)
	if (debug) logEvent("serverPartial for " + user.username + ": " + serverPartial)
	return { serverPartial: serverPartial }
	} catch (e) {
		// return { error: e }
	}
}

const CryptoJS = require('crypto-js')
const crypto = require('crypto')
const encrypt = (content, password) => CryptoJS.AES.encrypt(JSON.stringify({ content }), password).toString()
const decrypt = (crypted, password) => JSON.parse(CryptoJS.AES.decrypt(crypted, password).toString(CryptoJS.enc.Utf8)).content

async function giveKeys(chunk) {
	try {
		var user = await getUser(chunk);
		if (user.privKey == null || user.pubKey == null) await createKeys(chunk.username); // create keys if none are in the database
		const hashOfSharedKey = crypto.createHash('sha256', user.sharedSecret).digest('hex'); // is there any way I can get around hashing this?
		if (debug) logEvent("Hash of Shared Secret used to encrypt key for " + chunk.username + ": " + hashOfSharedKey)
		var encrypted = encrypt(user.privKey, hashOfSharedKey)
		return encrypted;
	} catch (e) {
		console.log(e)
		return "Error"
	}
}

async function giveNewKeys(chunk) {
	try {
		await createKeys(chunk.username)
		var user = await getUser(chunk);
		const hashOfSharedKey = crypto.createHash('sha256', user.sharedSecret).digest('hex'); // is there any way I can get around hashing this?
		if (debug) logEvent("Hash of Shared Secret used to encrypt key for " + chunk.username + ": " + hashOfSharedKey)
		var encrypted = encrypt(user.privKey, hashOfSharedKey)
		return encrypted;
	} catch (e) {
		console.log(e)
		return "Error"
	}
}

async function createKeys(username) {
	const NodeRSA = require('encrypt-rsa').default;
	const nodeRSA = new NodeRSA();
	const { privateKey, publicKey } = nodeRSA.createPrivateAndPublicKeys()
	await saveKeysToMongo(username, publicKey, privateKey)
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

async function checkIn (username, chatRoomName) {
	_db = await getDbConnection();
	var myquery = { username: username, "chatRooms.name": chatRoomName };
	var newvalues = { $set: {"chatRooms.$.lastActivity": (new Date).getTime() }};
	_db.collection("Users").updateOne(myquery, newvalues);
	return;
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
		logEvent("User document updated with sessionID for " + username);
		// db.close();
	});
	// return data;
	// console.log("Returning now")
}

async function saveNegociateDataToMongo(username, base, mod) {
	_db = await getDbConnection();
	var myquery = { username: username };
	var newvalues = { $set: {base:base, mod:mod} };
	var result = await _db.collection("Users").updateOne(myquery, newvalues) //, function(err, res) {
	// 	if (err) throw err;
	// 	logEvent("User document updated with g and server prime key for " + username);
	// 	// db.close();
	// });
	logEvent("User document updated with base and mod for " + username);
	return result;
	// console.log("Returning now")
}

async function saveSharedSecretToMongo(username, sharedSecret) {
	_db = await getDbConnection();
	var myquery = { username: username };
	var newvalues = { $set: {sharedSecret:sharedSecret} };
	var result = await _db.collection("Users").updateOne(myquery, newvalues) //, function(err, res) {
	// 	if (err) throw err;
	// 	logEvent("User document updated with g and server prime key for " + username);
	// 	// db.close();
	// });
	logEvent("User document updated with shared secret for " + username);
	return result;
	// console.log("Returning now")
}

async function joinChatRoom(chunk) {
	_db = await getDbConnection();
	var user = await getUser(chunk);
	let isInChatRoom = 0;
	user.chatRooms.forEach(chatRoom => {
		if (chatRoom.name == chunk.chatRoomName) ++isInChatRoom;
	})
	if (isInChatRoom != 0) return false;
	var myquery = { username: chunk.username };
	var newvalues = { $push: {chatRooms: {name: chunk.chatRoomName, lastActivity:(new Date).getTime()}}};
	var result = await _db.collection("Users").updateOne(myquery, newvalues) 
	if (result.modifiedCount == 0) {
		logEvent("Could not join " + chunk.username + " to chatroom " + chunk.chatRoomName)
		return false;
	}
	else {
		logEvent("User document updated for " + chunk.username + " joining chatroom " + chunk.chatRoomName);
		return true;
	}
}

async function leaveChatRoom(chunk) {
	_db = await getDbConnection();
	if (chunk.chatRoomName == "Chatroom_Global") return false;
	var user = await getUser(chunk);
	let isInChatRoom = 0;
	user.chatRooms.forEach(chatRoom => {
		if (chatRoom.name == chunk.chatRoomName) ++isInChatRoom;
	})
	if (isInChatRoom == 0) return false;
	var myquery = { username: chunk.username };
	var newvalues = { $pull: {chatRooms: {name: chunk.chatRoomName}}};
	var result = await _db.collection("Users").updateOne(myquery, newvalues) 
	if (result.modifiedCount == 0) {
		logEvent("Could not remove " + chunk.username + " from chatroom " + chunk.chatRoomName)
		return false;
	}
	else {
		logEvent("User document updated for " + chunk.username + " leaving chatroom " + chunk.chatRoomName);
		return true;
	}
}


async function createChatRoom(chunk) {
	_db = await getDbConnection();
	try {
		await _db.createCollection(chunk.chatRoomName)
		return true;
	} catch (e) {
		return false;
	}
}

// async function saveSharedSecretToMongo(username, sharedKey) {
// 	_db = await getDbConnection();
// 	var myquery = { username: username };
// 	var newvalues = { $set: { sharedKey: sharedKey } };
// 	var data = await _db.collection("Users").updateOne(myquery, newvalues);//, function(err, res) {
// 	// 	if (err) throw err;
// 	// 	logEvent("User document updated with shared key for " + username);
// 	// 	// db.close();
// 	// });
// 	logEvent("User document updated with shared key for " + username);
// 	return data;
// }

async function saveKeysToMongo(username, pubKey, privKey) {
	_db = await getDbConnection();
	var myquery = { username: username };
	var newvalues = { $set: { pubKey:pubKey, privKey: privKey } };
	var data = await _db.collection("Users").updateOne(myquery, newvalues);//, function(err, res) {
	// 	if (err) throw err;
	// 	logEvent("User document updated with private and public keys for " + username);
	// 	// db.close();
	// });
	logEvent("User document updated with private and public keys for " + username);
	return data;
	// console.log("Returning now")
}

// async function getAllMessagesFromMongo(chatRoomName) {
// 	_db = await getDbConnection();
// 	var data = await _db.collection(chatRoomName).find({}, {projection:{}}).toArray(); // usernames of messages are omitted so they're hidden from clients
// 	// closeConnection();
// 	return data;
// }

// async function getAllUsersFromMongo() {
// 	_db = await getDbConnection();
// 	var data = await _db.collection("Users").find({}, {projection:{color: 0, time: 0, encryption: 0, password: 0, _id: 0, privKey: 0, sessionID: 0, serverPrime: 0, serverPrimeKey: 0, g: 0, sharedKey: 0, chatRooms: 0}}).toArray(); // usernames of messages are omitted so they're hidden from clients
// 	// closeConnection();
// 	// console.log(data);
// 	return data;
// }

async function getChatRoomUsersFromMongo(chatRoomName) {
	_db = await getDbConnection();
	// logEvent("Querying users in chatroom: " + chatRoomName)
	var data = await _db.collection("Users").find({
		chatRooms: {"$elemMatch": {"name":chatRoomName}}
	  }, {projection:{color: 0, time: 0, encryption: 0, password: 0, _id: 0, privKey: 0, sessionID: 0, serverPrime: 0, serverPrimeKey: 0, g: 0, sharedKey: 0}}).toArray(); // usernames of messages are omitted so they're hidden from clients
	// closeConnection();
	// console.log(data);
	return data;
}

async function getNewMessagesFromMongo(timeOfLastMessage, chatRoomName, numberOfChats) {
	_db = await getDbConnection();
	var data = "";
	if (timeOfLastMessage == "") {
		// console.log("Time not provided")
		data = await _db.collection(chatRoomName).find({}).sort({time:-1}).limit(numberOfChats).toArray();
	}
	else {
		// console.log("Time provided")
		data = await _db.collection(chatRoomName).find({ time: { $gt: timeOfLastMessage }}, {projection:{}}).sort({time:-1}).limit(numberOfChats).toArray(); // usernames of messages are omitted so they're hidden from clients
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

// --------------- HELPER FUNCTIONS --------------------------
// computes the diffie-hellman results
function compute(base, exponent, modulo){
    // const bigInt = require('big-integer')
    const bigintModArith = require('bigint-mod-arith')
    const JSONbig = require('json-bigint')
	var base = BigInt(base.toString());
	var exponent = BigInt(exponent.toString());
	var modulo = BigInt(modulo.toString());

	// var res = bigInt.BitInteger.modPow(exponent, modulo);
    var res = bigintModArith.modPow(base, exponent, modulo)
    res = JSONbig.stringify(res)
	// console.log("Result: " + res)
	return res;
}

// exports

exports.getDbConnection = getDbConnection;
exports.closeConnection = closeConnection;
exports.login = login;
exports.register = register;
exports.logEvent = logEvent;
exports.ping = ping;
exports.receiveChatMessage = receiveChatMessage;
// exports.sendAllMessages = sendAllMessages;
exports.changeChatColor = changeChatColor;
exports.sendNewMessages = sendNewMessages;
// exports.sendAllUsers = sendAllUsers;
exports.sendChatRoomUsers = sendChatRoomUsers;
exports.diffieHellman = diffieHellman;
exports.verifySessionID = verifySessionID;
exports.giveKeys = giveKeys;
exports.giveNewKeys = giveNewKeys;
exports.negociate = negociate;
// exports.sendActiveUsers = sendActiveUsers;
exports.joinChatRoom = joinChatRoom;
exports.createChatRoom = createChatRoom;
exports.leaveChatRoom = leaveChatRoom;