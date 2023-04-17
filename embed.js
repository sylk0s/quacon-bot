const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

// this is a thing to edit embed looks because im really lazy and think it would be nice!
module.exports = {
	data: new SlashCommandBuilder()
		.setName('embed')
		.setDescription('Only for testing purposes, edits an embed with the info givin, literally just to test styling and shit')
		.setDefaultPermission(false)
		.addStringOption(option => option.setName('color').setDescription('embed side color').setRequired(false))
		.addStringOption(option => option.setName('title').setDescription('Describe the vote').setRequired(false))
		.addStringOption(option => option.setName('titleurl').setDescription('Hours the vote will go for').setRequired(false))
		.addStringOption(option => option.setName('author').setDescription('Minutes the vote will go for').setRequired(false))
		.addStringOption(option => option.setName('description').setDescription('embed side color').setRequired(false))
		.addStringOption(option => option.setName('thumbnail').setDescription('url for the thumbnail').setRequired(false))
		.addStringOption(option => option.setName('image').setDescription('embed side color').setRequired(false))
		.addBooleanOption(option => option.setName('timestamp').setDescription('embed side color').setRequired(false))
		.addStringOption(option => option.setName('footer').setDescription('embed side color').setRequired(false))
		.addSubcommand(subcommand => subcommand
		  .setName('field')
		  .setDescription('add a field')
		  .addStringOption(option => option.setName('name').setDescription('The user').setRequired(true))
		  .addStringOption(option => option.setName('value').setDescription('aaa').setRequired(true))
		  .addBooleanOption(option => option.setName('inline').setDescription('aaa').setRequired(true)))
            .addSubcommand(subcommand => subcommand
                .setName('author')
                .setDescription('add a field')
                .addStringOption(option => option.setName('name').setDescription('The user').setRequired(true))
                .addStringOption(option => option.setName('iconurl').setDescription('aaa').setRequired(true))
                .addStringOption(option => option.setName('linkurl').setDescription('aaa').setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('footer')
      .setDescription('add a field')
                .addStringOption(option => option.setName('text').setDescription('The user').setRequired(true))
                .addStringOption(option => option.setName('iconurl').setDescription('aaa').setRequired(true)))
        .addBooleanOption(option => option.setName('send').setDescription('Send the message?').setRequired(false)),
	async execute(interaction, bot) {
		const embed = bot.cachedembed ? bot.cachedembed : new EmbedBuilder();

        if (interaction.options.getSubcommand().equals('field')) {
            embed.addFields({ 
                name: interaction.options.getString('name'), 
                value: interaction.options.getString('value'), 
                inline: interaction.options.getBoolean('inline'), 
            })
        }

        if (interaction.options.getSubcommand().equals('author')) {
            embed.setAuthor({
                name: interaction.options.getString('name'),
                iconURL: interaction.options.getString('iconurl'),
                url: interaction.options.getString('linkurl'),
            })
        }

        if (interaction.options.getSubcommand().equals('footer')) {
            embed.setAuthor({
                name: interaction.options.getString('text'),
                iconURL: interaction.options.getString('iconurl'),
            })
        }

        if (color = interaction.options.getString('color')) embed.setColor(parseInty(color, 16));
        if (title = interaction.options.getString('title')) embed.setTitle(title);
        if (titleurl = interaction.options.getString('titleurl')) embed.setURL(titleurl);
        if (description = interaction.options.getString('description')) embed.setDescription(description);
        if (thumbnail = interaction.options.getString('thumbnail')) embed.setThumbnail(thumbnail);
        if (image = interaction.options.getString('image')) embed.setImage(image);
        if (interaction.options.getBoolean('timestamp')) embed.setTimestamp();

        bot.cachedembed = embed;
        if (v = interaction.options.getBoolean('send') == undefined || v == true) await interaction.reply({ embeds: [embed] });
	},
};
