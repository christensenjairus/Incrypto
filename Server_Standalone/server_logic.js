const Store = require('electron-store');
const store = new Store(); // initalize Store
var fs = require('fs');
const DEBUG = true;

var history = [];
var myChat = "./chat.json"
if (fs.existsSync(myChat)) {
	restoreFromFile();
}
var clients = [];

function checkLoginCreds(chunk) {
	let dataIn = JSON.parse(chunk);
	if (store.get("username_" + dataIn.username, "") == "") { // username does not exist
		logEvent("Login attempt made for username:'" + dataIn.username + "' who does not exist")
		return { type:'AuthResponse', result: "failure", key:"incorrect_credentials" };
	}
	// logOutOthers(connection, username);
	if (dataIn.password == store.get("passwordHash_" + dataIn.username, "")) {
		logEvent("Successful login by username:'" + dataIn.username + "'")
		var key = createGuid();
		store.set(dataIn.username + "_key", key);
		userColor = store.get(dataIn.username + "_Color", "blue");
		return { type:'AuthResponse', color:userColor, result: "success", key:key };
	}
	else{
		logEvent("Login attempt made for " + dataIn.username + " with an incorrect password")
		return { type:'AuthResponse', result: "failure", key:"incorrect_credentials" };
	}	
}

function checkRegistrationCreds(chunk) {
	let dataIn = JSON.parse(chunk);
	if (store.get("username_" + dataIn.username, "") != "") { // username already exists
		logEvent("Registration attempt made for username:'" + dataIn.username + "' who already exists")
		return { type:'AuthResponse', result: "failure", key:"username_exists" };
	}
	else {
		logEvent("Successful registration for username:'" + dataIn.username+"'")
		store.set("username_" + dataIn.username, dataIn.username);
		store.set("passwordHash_" + dataIn.username, dataIn.password);
		var key = createGuid();  
		store.set(dataIn.username + "_key", key);
		userColor = store.get(dataIn.username + "_Color", "blue");
		return { type:'AuthResponse', color:userColor, result: "success", key:key };
	}
}

function ping() {
	return { type:'Pong', result: "success" };
}

function receiveChatMessage(chunk) {
	let dataIn = JSON.parse(chunk);
	store.set(dataIn.username + "_Color", dataIn.userColor);
	if (DEBUG) logEvent("Username:'" + dataIn.userEnc + "' sent '" + dataIn.msg + "' with '" + dataIn.encryption + "' encryption")
	else logEvent("Message recieved from username:'" + dataIn.userEnc + "'");
	var obj = {
		time: dataIn.time,
		text: htmlEntities(dataIn.msg),
		author: dataIn.userEnc,
		color: dataIn.userColor,
		encryption: dataIn.encryption,
		guid: createGuid()
	};
	history.push[obj];
	let secondToLastChatGuid = history[history.length - 1].guid;
	saveToFile(obj);
	// sendChatMessage(obj);
	// TODO: need a way of seeing which messages haven't been sent to client yet.
	return getNewMessages(JSON.stringify({ guidOfLastMessage: secondToLastChatGuid })); // after sending a message, we'll send the user back all the messages they don't have yet
}

function sendChatMessage(messageObj) {
	// todo: get all clients and send message to them
	
}

function getNewMessages(chunk) {
	let dataIn = JSON.parse(chunk);
	if (history.length > 0 && dataIn.guidOfLastMessage == history[history.length - 1].guid) {
		return { type:'message', data:[] }; // send back nothing
	}
	let arrayToSend = [];
	let foundLastMessage = false;
	if (dataIn.guidOfLastMessage == "") foundLastMessage = true;
	for (let i = 0; i < history.length; ++i) {
		console.log("checking if " + history[i].guid  + "===" + dataIn.guidOfLastMessage)
		if (history[i].guid == dataIn.guidOfLastMessage) {
			foundLastMessage = true;
			continue;
		}
		if (foundLastMessage === true) {
			arrayToSend.push(history[i])
		}
	}
	return { type:'message', data: arrayToSend }
}

function createGuid() {  
	function _p8(s) {  
		var p = (Math.random().toString(16)+"000000000").substr(2,8);  
		return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;  
	}  
	return _p8() + _p8(true) + _p8(true) + _p8();  
}

function restoreFromFile() {
	fs.readFile('chat.json', function read(err, data) {
		if (err) {
			console.log(err);
			return;
		}
		history = JSON.parse(data);
	})
}

function saveToFile(obj) {
	history.push(obj); // save messages
	history = history.slice(-100);
	fs.writeFile("chat.json", JSON.stringify(history), function(err) {
		if (err) {
			console.log(err);
		}
	});
}

function getFormattedDate() {
	var date = new Date();
	var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	return str;
}

function logEvent(dataToLog) {
	// TODO: should create file to save this in!
	dataToLog = getFormattedDate() + ": " + dataToLog;
	fs.appendFile("server.log", dataToLog + "\n", function(err) {
		if (err) { 
			console.log(err);
		}
	});
	console.log(dataToLog);
}


function htmlEntities(str) {
	return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}
var colors = ['purple', 'plum', 'orange', 'red', 'green', 'blue', 'magenta'];
colors.sort(function(a,b) {
	return Math.random() > 0.5;	
});

exports.checkLoginCreds = checkLoginCreds;
exports.checkRegistrationCreds = checkRegistrationCreds;
exports.logEvent = logEvent;
exports.ping = ping;
exports.receiveChatMessage = receiveChatMessage;
exports.getNewMessages = getNewMessages;