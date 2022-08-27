const config = require('./config.json');
const WebSocket = require('ws');

//example ws config value: "ws://192.168.1.0:7500/taurus"
const wsconnection = new WebSocket(config.ws);
let taurus_connected = true;

// definition of jank
async function listenForResponseWithType(bot, type) {
	return new Promise((resolve, reject) => {
		if (!bot.messageCache) {
			return reject("no place to cache messages");
		}
		const cacheLength = bot.messageCache.length;
		let tries = 0;
		const attempt = () => {
			if (bot.messageCache.length > 0 && cacheLength < bot.messageCache.length) {
				const latest = bot.messageCache[bot.messageCache.length - 1];
				if (latest.length >= 1 && latest.split(" ")[0] == type) {
					if (!taurus_connected) {
						console.log("connected to taurus successfully")
						taurus_connected = true;
					}
					return resolve(bot.messageCache.pop());
				}
			}
			tries++;
			if (tries > 5) {
				return reject("Timeout");
			}
			setTimeout(attempt, 500)
		}
		setTimeout(() => {
			attempt();
		}, 20);
	})
}

function init(bot) {
  // listen on websocket server for taurus
  wsconnection.onmessage = (e) => {
	const msg = e.data.toString();
	if (msg.startsWith("MSG ") && msg.length > 5) {
		const message = e.data.slice(4);
		bot.channels.cache.get(config.chatbridgeid).send(message);
	} else {
		console.log(msg);
		bot.messageCache.push(msg);
		console.log(bot.messageCache)
	}
  }

  wsconnection.onopen = async () => {
	console.log("connecting to Taurus")
	wsconnection.send(config.wsPassword);
	console.log("authenticating...")
	wsconnection.send("PING");
	await listenForResponseWithType(bot, "PONG");
  }
}

module.exports = { init, listenForResponseWithType };
