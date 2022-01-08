const fs = require('fs');
const { Client, Collection, Intents, ReactionCollector } = require('discord.js');
const { token } = require('./config.json');
const app = require('./application.js');

let Intss = new Intents(Intents.FLAGS.GUILDS)
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

// temporary btw
bot.on('messageReactionAdd', async (reaction, user) => {
	console.log('reaction added')
	if (user.bot | reaction.message.id in bot.apps1) {
		console.log('passed checks')
		if(reaction.partial) {
			try {
				console.log('checks for')
				if (reaction.emoji == "🧇") {
					reaction.message.channel.send('approved da thing')
				}
			} catch (error) {
				console.error('Something went wrong: ', error);
				return;
			}
		}
	}
});

bot.login(token);

app.checkForApps(bot);