const fs = require('fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const config = require('./config.json');
//const app = require('./application.js');
const voteHandler = require('./commands/vote.js');
const taurus = require('./taurus.js');

const bot = new Client({ intents: [GatewayIntentBits.Guilds] });
bot.commands = new Collection();
bot.apps1 = [];
bot.messageCache = [];
bot.wsconnection=taurus.wsconnection

taurus.init(bot);

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

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
/*
bot.on('messageReactionAdd', async (reaction, user) => {
	 if (!user.bot && app.appExists(reaction.message.id)) {
	 	app.handleReaction(reaction, user, bot);
	 }
});
*/

bot.on('messageCreate', msg => {
	if (msg.channel.id !== config.chatbridgeid || msg.author.id == bot.user.id) return;
	let reply = "";
	if (msg.reference) {
		// if there's a reply then we'll include it in the message
		const replymsg = msg.channel.messages.cache.get(msg.reference.messageId.toString());
		let author = `§d${replymsg.author.username}§f `;
		if (replymsg.author.id == bot.user.id) {
			author = "";
		}
		reply = `reply -> ${author}${replymsg.content}\n`;
	}
	if (msg.content.length > 0) {
		bot.wsconnection.send(`MSG ${reply}[§5${msg.author.username}§f] ${msg.content}`);
	}
	// taurus has a specific keyword for URLs that has clickable in game attachments
	if (msg.attachments.size > 0) {
		bot.wsconnection.send(`MSG [§5${msg.author.username}§f] ${msg.attachments.size} attachments`)
		for (const [_, val] of msg.attachments) {
			// the first value is the link, second the name that shows in chat (and is clickable)
			const name = val.name.length > 0 ? val.name : "attachment";
			bot.wsconnection.send(`URL ${val.url} ${name}`);
		}
	}
})

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

//app.checkForApps(bot);
voteHandler.queryVotes(bot);
