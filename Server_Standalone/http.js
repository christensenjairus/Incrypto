// CONTAINS HTTP LOGIC FOR SERVER ENDPOINTS

const { default: axios } = require('axios');
const helper = require('./helper_functions.js')

const serverLogic = (request, response) => {
	
	// LOGIN ENDPOINT
	if (request.method === 'POST' && request.url === '/api/login') {
		console.log("Login Request")
		const { headers, method, url } = request;
		let body = [];
		request.on('error', (err) => {
			console.error(err);
		}).on('data', (chunk) => {
			// send response
			body.push(Buffer.from(JSON.stringify(helper.checkLoginCreds(chunk))));
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
			// send response
			body.push(Buffer.from(JSON.stringify(helper.checkRegistrationCreds(chunk))));
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

exports.serverLogic = serverLogic;