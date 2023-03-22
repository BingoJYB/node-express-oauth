const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const jwt = require("jsonwebtoken")
const { timeout } = require("./utils")

const config = {
	port: 9002,
	publicKey: fs.readFileSync("assets/public_key.pem"),
}

const users = {
	user1: {
		username: "user1",
		name: "User 1",
		date_of_birth: "7th October 1990",
		weight: 57,
	},
	john: {
		username: "john",
		name: "John Appleseed",
		date_of_birth: "12th September 1998",
		weight: 87,
	},
}

const app = express()
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/
app.get("/user-info", (req, res, next) => {
	let authorization = req.headers.authorization

	if (authorization === undefined) {
		return res.status(401).send()
	}

	let token = authorization.split(" ")[1]

	try {
		let { userName, scope } = jwt.verify(token, config.publicKey, { algorithm: 'RS256' })
		let permissions = scope.split(" ").map(permission => permission.split(":")[1])

		return res.status(200).json(
			Object.entries(users[userName]).reduce((p, [k, v]) => (permissions.includes(k) ? { ...p, [k]: v } : p), {})
		)
	} catch (e) {
		return res.status(401).send()
	}
})

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes
module.exports = {
	app,
	server,
}
