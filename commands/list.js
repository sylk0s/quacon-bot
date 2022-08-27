const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { listenForResponseWithType } = require('../taurus.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('list players on servers')
		.setDefaultPermission(false),
	async execute(interaction, bot) {
        bot.wsconnection.send("LIST");
		const reply = await listenForResponseWithType(bot, "LIST");
		if (reply && reply.length > 0) {
			const value = reply.toString();
			const sliced = value.slice(5).replace(":", ": ");
			console.log(sliced)
			let embed = new MessageEmbed()
				.setTitle("list :pencil:")
				.setDescription(sliced);
			interaction.reply(embed);
		} else {
			interaction.reply("failed to recieve reply from taurus");
		}
	}
};
