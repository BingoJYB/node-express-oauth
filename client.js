const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios").default
const { randomString, timeout } = require("./utils")

const config = {
	port: 9000,

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
	tokenEndpoint: "http://localhost:9001/token",
	userInfoEndpoint: "http://localhost:9002/user-info",
}
let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/client")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/
app.get("/authorize", (req, res, next) => {
	state = randomString()
	let responseType = "code"
	let scope = "permission:name permission:date_of_birth"
	let authorizationEndpoint = new URL(config.authorizationEndpoint)

	authorizationEndpoint.searchParams.set("response_type", responseType)
	authorizationEndpoint.searchParams.set("client_id", config.clientId)
	authorizationEndpoint.searchParams.set("redirect_uri", config.redirectUri)
	authorizationEndpoint.searchParams.set("scope", scope)
	authorizationEndpoint.searchParams.set("state", state)

	return res.redirect(authorizationEndpoint)
})

app.get("/callback", (req, res, next) => {
	let receivedState = req.query.state

	if (receivedState === state) {
		return axios.request({
			method: "POST",
			url: config.tokenEndpoint,
			auth: {
				username: config.clientId,
				password: config.clientSecret
			},
			data: {
				code: req.query.code
			}
		}).then(response => {
			return axios.request({
				method: "Get",
				url: config.userInfoEndpoint,
				headers: {
					authorization: "bearer " + response.data.access_token
				}
			})
		}).then(response => {
			res.render("welcome", {
				user: response.data
			})
		})
	} else {
		return res.status(403).send()
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
	getState() {
		return state
	},
	setState(s) {
		state = s
	},
}
