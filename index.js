const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const config = require('./config.json');
const app = require('./application.js');
const voteHandler = require('./commands/vote.js')

const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS] });

bot.commands = new Collection();
bot.apps1 = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	bot.commands.set(command.data.name, command);	
}

bot.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = bot.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

bot.on('messageReactionAdd', async (reaction, user) => {
	if (!user.bot && app.appExists(reaction.message.id)) {
		app.handleReaction(reaction, user, bot);
	}
});

bot.on('ready', async () => {

	bot.commandMap = [];

	// this sketchy bit fixes the issue where the ids change EVERY SINGLE TIME I deploy the commands
	const guild = bot.guilds.cache.get(config.guildId);
	await (await guild.commands.fetch()).forEach(command => {
		bot.commandMap.push(mapIDtoName(command));
	});

	// no perms:
	// mcinfo, ping

	// pin for a2+
	// general roles for a2+, secondary for K0 and M5
	// voting for A2+
	// whitelist for S7, M5, E9, K0

	// this sets up the basic permissions for commands

	const member_permissions = [
		// A2
		{
			id: '927003157538693180',
			type: 'ROLE',
			permission: true,
		},
	];	

	const leadership_permissions = [
		// K0
		{
			id: '926404073102659605',
			type: 'ROLE',
			permission: true,
		},
		// E9
		{
			id: '927074637937000498',
			type: 'ROLE',
			permission: true,
		},
		// S7
		{
			id: '927074325826248724',
			type: 'ROLE',
			permission: true,
		},
		// M5
		{
			id: '926412876015607840',
			type: 'ROLE',
			permission: true,
		},
	];

	await guild?.commands.permissions.add({command: findIdOfElementWithName(bot.commandMap, 'pin'), permissions: member_permissions });
	await guild?.commands.permissions.add({command: findIdOfElementWithName(bot.commandMap, 'vote'), permissions: leadership_permissions });
	await guild?.commands.permissions.add({command: findIdOfElementWithName(bot.commandMap, 'whitelist'), permissions: leadership_permissions });
	await guild?.commands.permissions.add({command: findIdOfElementWithName(bot.commandMap, 'role'), permissions: member_permissions });
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