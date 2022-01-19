// CONTAINS HTTP LOGIC FOR SERVER ENDPOINTS

const { default: axios } = require('axios');
const Store = require('electron-store');
const store = new Store(); // initalize Store

const serverLogic = (request, response) => {
	
	// LOGIN ENDPOINT
	if (request.method === 'POST' && request.url === '/api/login') {
		console.log("Login Request")
		const { headers, method, url } = request;
		let body = [];
		request.on('error', (err) => {
			console.error(err);
		}).on('data', (chunk) => {
			let dataIn = JSON.parse(chunk);
			var json = { type:'AuthResponse', result: "failure", key:"" };
			let key = checkLoginCreds(dataIn.username, dataIn.password);
			if (key == "password_wrong") {
				json = { type:'AuthResponse', result: "failure", key:key };
			}
			else if (key == "username_not_exist") {
				json = { type:'AuthResponse', result: "failure", key:key };
			}
			else if (key == "already_loggedin") {
				json = { type:'AuthResponse', result: "failure", key:key };
			}
			else if (key != "") {
				userColor = store.get(dataIn.username + "_Color", "blue");
				json = { type:'AuthResponse', color:userColor, result: "success", key:key }; // make valid response
			}
			// send response
			body.push(Buffer.from(JSON.stringify(json)));
		}).on('end', () => {
			body = Buffer.concat(body).toString();
			response.on('error', (err) => {
				console.error(err);
			});
			response.statusCode = 200;
			response.setHeader('Content-Type', 'application/json');
			const responseBody = { headers, method, url, body };
			response.write(JSON.stringify(responseBody));
			response.end();
		});
		return;
	}
	
	// REGISTRATION ENDPOINT
	if (request.method === 'POST' && request.url === '/api/register') {
		console.log("Registration Request")
		const { headers, method, url } = request;
		let body = [];
		request.on('error', (err) => {
			console.error(err);
		}).on('data', (chunk) => {
			let dataIn = JSON.parse(chunk);
			var json = { type:'AuthResponse', result: "failure", key:"" };
			let key = checkRegistrationCreds(dataIn.username, dataIn.password);
			if (key == "username_exists") {
				json = { type:'AuthResponse', result: "failure", key:key };
			}
			else if (key != "") {
				userColor = store.get(dataIn.username + "_Color", "blue");
				json = { type:'AuthResponse', color:userColor, result: "success", key:key }; // make valid response
			}
			// send response
			body.push(Buffer.from(JSON.stringify(json)));
		}).on('end', () => {
			body = Buffer.concat(body).toString();
			response.on('error', (err) => {
				console.error(err);
			});
			response.statusCode = 200;
			response.setHeader('Content-Type', 'application/json');
			const responseBody = { headers, method, url, body };
			response.write(JSON.stringify(responseBody));
			response.end();
		});
		return;
	}
	
	// PING ENDPOINT
		// You'll need to hit endpoint some data. JSON like {"type":"ping"} should suffice.
	if (request.method === 'GET' && request.url === '/api/ping') {
		console.log("PING")
		const { headers, method, url } = request;
		let body = [];
		request.on('error', (err) => {
			console.error(err);
		}).on('data', () => {
			// send response
			body.push(Buffer.from(JSON.stringify({ type:'Pong', result: "success" })));
		}).on('end', () => {
			body = Buffer.concat(body).toString();
			response.on('error', (err) => {
				console.error(err);
			});
			response.statusCode = 200;
			response.setHeader('Content-Type', 'application/json');
			const responseBody = { headers, method, url, body };
			response.write(JSON.stringify(responseBody));
			response.end();
		});
		return;
	}
	
	else {
		response.statusCode = 404;
		response.end();
	}
}

// Helper Functions

function checkLoginCreds(username, passhash) {
	if (store.get("username_" + username, "") == "") { // username does not exist
		return "username_not_exist";
	}
	// logOutOthers(connection, username);
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

exports.serverLogic = serverLogic;