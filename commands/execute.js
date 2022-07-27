const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('execute')
		.setDescription('Execute commands on the designated server')
		.addStringOption(option => option.setName('server').setDescription('Name of the tmux session the server is running on').setRequired(true))
        .addStringOption(option => option.setName('cmd').setDescription('The command to send to the minecraft server').setRequired(true))
		.setDefaultPermission(false),
	async execute(interaction, bot) {
		let session = interaction.options.getString('server');
        let cmd = interaction.options.getString('cmd');
        bot.wsconnection.send("CMD " + session + " " + cmd);
        interaction.reply("Sent `" + cmd + "` to server `" + session + "`");
	}
};