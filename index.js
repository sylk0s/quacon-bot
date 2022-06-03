const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const WebSocket = require('ws')

const config = require('./config.json');
const app = require('./application.js');
const voteHandler = require('./commands/vote.js')

// example ws config value: "ws://192.168.1.0:7500/taurus"
// const wsconnection = new WebSocket(config.ws)

const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS] });
//bot.wsconnection = wsconnection; // don't know if this is actually needed
bot.commands = new Collection();
bot.apps1 = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
/*
// listen on websocket server for taurus
wsconnection.onmessage = (e) => {
	if (e.data.length < 5) { return; }
	let message = e.data.slice(4);
	bot.channels.cache.get(config.chatbridgeid).send(message);
}
*/
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	bot.commands.set(command.data.name, command);	
}

bot.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = bot.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction, bot);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

// temporarily disabled apps
bot.on('messageReactionAdd', async (reaction, user) => {
	 if (!user.bot && app.appExists(reaction.message.id)) {
	 	app.handleReaction(reaction, user, bot);
	 }
});

/*
bot.on('messageCreate', msg => {
	if (msg.channel.id === config.chatbridgeid && msg.author.id != bot.user.id) {
		wsconnection.send(`MSG [§5${msg.author.username}§f] ${msg.content}`);
	}
})
*/

bot.on('ready', async () => {

  console.log("Bot Online");

	bot.commandMap = [];

	// this sketchy bit fixes the issue where the ids change EVERY SINGLE TIME I deploy the commands
	const guild = bot.guilds.cache.get(config.guildId);
	await (await guild.commands.fetch()).forEach(command => {
		bot.commandMap.push(mapIDtoName(command));
	});
})

function mapIDtoName(command) {
	return {
		id: command.id,
		name:command.name,
	}
}

function findIdOfElementWithName(list, name) {
	// returns the first element with element.name being the same as name
	for (let i = 0; i < list.length; i++) {
		if (list[i].name == name) {
			return list[i].id;
		}
	}
}

bot.login(config.token);

app.checkForApps(bot);
voteHandler.queryVotes(bot);
