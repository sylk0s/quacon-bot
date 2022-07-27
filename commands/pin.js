const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pin')
		.setDescription('Pins the message with the given message id')
		.addStringOption(option => option.setName('message_id').setDescription('Message id').setRequired(true))
		.setDefaultPermission(false),
	async execute(interaction, bot) {
		id = interaction.options.getString('message_id');
		try {
			await interaction.channel.messages.fetch(id).then(message => {	
				message.pin()
				interaction.reply('Pinned!');
			});
		} catch(error) {
			embed = new MessageEmbed()
					.setColor('#ff3333')
					.setTitle(`Error!`)
					.setDescription(error.toString());
			interaction.reply({ embeds: [embed] });
		}
	}
};