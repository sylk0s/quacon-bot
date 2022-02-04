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

	const command_pin = await guild?.commands.fetch(findIdOfElementWithName(bot.commandMap, 'pin'));
	const command_vote = await guild?.commands.fetch(findIdOfElementWithName(bot.commandMap, 'vote'));
	const command_whitelist = await guild?.commands.fetch(findIdOfElementWithName(bot.commandMap, 'whitelist'));
	const command_role = await guild?.commands.fetch(findIdOfElementWithName(bot.commandMap, 'role'));

	const member_permissions = [
		{
			id: '933515698779611196',
			type: 'ROLE',
			permission: true,
		},
	];	

	const leadership_permissions = [
		{
			id: '933515698779611196',
			type: 'USER',
			permission: false,
		},
	];

	// await command_pin.permissions.add({ member_permissions });
	// await command_vote.permissions.add({ member_permissions });
	// await command_whitelist.permissions.add({ leadership_permissions });
	// await command_role.permissions.add({ member_permissions });
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
//voteHandler.queryVotes(bot);