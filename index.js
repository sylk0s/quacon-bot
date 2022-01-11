const fs = require('fs');
const { Client, Collection, Intents, ReactionCollector } = require('discord.js');
const config = require('./config.json');
const app = require('./application.js');

let Intss = new Intents([Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS])
const bot = new Client({ intents: Intss });

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

// temporary btw, redo better later
// actually i want to move this into application.js later
bot.on('messageReactionAdd', async (reaction, user) => {
	if (!user.bot | reaction.message.id in bot.apps1) {
		// fires after a reaction on any application messages
		switch(reaction.emoji.name) {
			case "🧇":
				reaction.message.guild.channels.create("name" + app.getAppNameFromID(reaction.message.id) ).then( channel => {
					channel.setParent(app.getAppCategory());
					channel.send('this channel has been created');
					app.approveApplication(reaction.message.id, channel.id, '0', user.id);
				});
				break;
		}
	}
});

bot.login(config.token);

app.checkForApps(bot);