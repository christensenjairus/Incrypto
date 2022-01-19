const Store = require('electron-store');
const store = new Store(); // initalize Store

function checkLoginCreds(chunk) {
	let dataIn = JSON.parse(chunk);
	if (store.get("username_" + dataIn.username, "") == "") { // username does not exist
		return { type:'AuthResponse', result: "failure", key:"username_not_exist" };
	}
	// logOutOthers(connection, username);
	if (dataIn.password == store.get("passwordHash_" + dataIn.username, "")) {
		var key = createGuid();
		store.set(dataIn.username + "_key", key);
		userColor = store.get(dataIn.username + "_Color", "blue");
		return { type:'AuthResponse', color:userColor, result: "success", key:key };
	}
	else{
		return "password_wrong";
	}	
}

function checkRegistrationCreds(chunk) {
	let dataIn = JSON.parse(chunk);
	if (store.get("username_" + dataIn.username, "") != "") { // username already exists
		return { type:'AuthResponse', result: "failure", key:"username_exists" };
	}
	else {
		store.set("username_" + dataIn.username, dataIn.username);
		store.set("passwordHash_" + dataIn.username, dataIn.password);
		var key = createGuid();  
		store.set(dataIn.username + "_key", key);
		userColor = store.get(dataIn.username + "_Color", "blue");
		return { type:'AuthResponse', color:userColor, result: "success", key:key };
	}
}

function createGuid() {  
	function _p8(s) {  
		var p = (Math.random().toString(16)+"000000000").substr(2,8);  
		return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;  
	}  
	return _p8() + _p8(true) + _p8(true) + _p8();  
}

exports.checkLoginCreds = checkLoginCreds;
exports.checkRegistrationCreds = checkRegistrationCreds;