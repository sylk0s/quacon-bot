const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mcinfo')
		.setDescription('Gives info about a minecraft account')
        .addStringOption(
            option => option.setName('mcname').setDescription('Input a minecraft username.').setRequired(true)
        ),
	async execute(interaction) {
        var MojangAPI = require('mojang-api')
        MojangAPI.nameToUuid(interaction.options.getString('mcname'), function(err,res) {
            if(err)
                console.log(err)
            else {
                MojangAPI.nameHistory(res[0].id, function(err2,res2) {
                    if(err2)
                        console.log(err2)
                    else {
                        let string = ""
                        for (let i = 0; i < res2.length; i++) {
                            string += res2[i].name + "\n"
                        }
                        const exampleEmbed = new MessageEmbed()
                        .setColor('#55ff55')
                        .setTitle(res[0].name)
                        .setDescription(string)
                        .setThumbnail("https://crafatar.com/avatars/" + res[0].id)
                        .addFields(
                            { name: 'UUID', value: res[0].id },
                        )
                        .setImage("https://crafatar.com/renders/body/" + res[0].id)
                        .setTimestamp()
                        
                        interaction.reply({ embeds: [exampleEmbed]});
                    }
                })
            }
        })
    },
};