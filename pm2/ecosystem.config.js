module.exports = {
	"apps": [{
		"name": "dht22",
		"cwd": "../src",
		"script": "./server.js",
		"watch": true,
		"env": {
			"NODE_ENV": "production",
			"DEBUG": "prod-log"
		}
	}]
}
