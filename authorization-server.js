const fs = require("fs")
const express = require("express")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const {
	randomString,
	containsAll,
	decodeAuthCredentials,
	timeout,
} = require("./utils")

const config = {
	port: 9001,
	privateKey: fs.readFileSync("assets/private_key.pem"),

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
}

const clients = {
	"my-client": {
		name: "Sample Client",
		clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
		scopes: ["permission:name", "permission:date_of_birth"],
	},
	"test-client": {
		name: "Test Client",
		clientSecret: "TestSecret",
		scopes: ["permission:name"],
	},
}

const users = {
	user1: "password1",
	john: "appleseed",
}

const requests = {}
const authorizationCodes = {}

let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/authorization-server")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/
app.get("/authorize", (req, res, next) => {
	let clientId = req.query.client_id
	let scope = req.query.scope
	let reqId = randomString()
	requests[reqId] = req.query

	if (clientId in clients && containsAll(clients[clientId].scopes, scope.split(" "))) {
		res.status(200)
		return res.render("login", {
			client: clients[clientId],
			scope: scope,
			requestId: reqId
		})
	} else {
		return res.status(401).send()
	}
})

app.post("/approve", (req, res, next) => {
	let userName = req.body.userName
	let password = req.body.password
	let reqId = req.body.requestId

	if (userName in users && users[userName] === password && reqId in requests) {
		let request = requests[reqId]
		let code = randomString()
		let redirect_uri = new URL(request.redirect_uri)
		state = request.state

		delete requests[reqId]
		authorizationCodes[code] = {
			clientReq: request,
			userName: userName
		}
		redirect_uri.searchParams.set("code", code)
		redirect_uri.searchParams.set("state", state)

		return res.redirect(redirect_uri)
	} else {
		return res.status(401).send()
	}
})

app.post("/token", (req, res, next) => {
	let authorization = req.headers.authorization
	let code = req.body.code

	if (authorization === undefined) {
		return res.status(401).send()
	}

	let { clientId, clientSecret } = decodeAuthCredentials(authorization)

	if (clientId in clients && clients[clientId].clientSecret === clientSecret && code in authorizationCodes) {
		let { clientReq, userName } = authorizationCodes[code]
		delete authorizationCodes[code]

		let token = jwt.sign({
			userName: userName,
			scope: clientReq.scope
		}, config.privateKey, { algorithm: 'RS256' })

		return res.status(200).json({
			access_token: token,
			token_type: "Bearer"
		})
	} else {
		return res.status(401).send()
	}
})

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes

module.exports = { app, requests, authorizationCodes, server }
