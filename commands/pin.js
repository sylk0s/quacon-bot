const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pin')
		.setDescription('Pins the message with the given message id')
		.addStringOption(option => option.setName('message_id').setDescription('Message id').setRequired(true)),
	async execute(interaction) {
		id = interaction.options.getString('message_id');
		interaction.channel.messages.fetch(id).then(message => {	
			message.pin()
			interaction.reply('Pinned!');
		});
	},
};