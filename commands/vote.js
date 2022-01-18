const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vote')
		.setDescription('Control the votes')
        .addSubcommand(subcommand => subcommand
			.setName("create")
			.setDescription("Create a new vote")
			.addStringOption(option => option.setName('name').setDescription('The name of the vote').setRequired(true))
            .addStringOption(option => option.setName('description').setDescription('Describe the vote').setRequired(true))
            .addIntegerOption(option => option.setName('hours').setDescription('Hours the vote will go for').setRequired(false))
            .addIntegerOption(option => option.setName('minutes').setDescription('Minutes the vote will go for').setRequired(false)))
        .addSubcommand(subcommand => subcommand
            .setName("list")
            .setDescription("List the current running votes"))
        .addSubcommand(subcommand => subcommand
            .setName("delete")
            .setDescription("Delete a vote")
            .addStringOption(option => option.setName('vote').setDescription('Name of the vote to delete').setRequired(true))),
	async execute(interaction) {

        let data = fs.readFileSync('votes.json');
        let votes = JSON.parse(data);

		switch(interaction.options.getSubcommand()) {

            case ('create'):
                let hours = interaction.options.getInteger('hours');
                let minutes = interaction.options.getInteger('minutes');

                // set defaults
                if (hours === null) { hours = 72; }
                if (minutes === null) { minutes = 0; }

                let now = new Date();
                let future = new Date(); // 3 days in ms
                future.setMilliseconds(future.getMilliseconds() + hours*60*60*1000 + minutes*60*1000);
                let milliseconds = future-now;

                let vote = createVote(
                    interaction.options.getString('name'),
                    interaction.options.getString('description'),
                    hours,
                    minutes,
                    milliseconds,
                    now,
                    future);

                // start the timer

                setTimeout(function () { 

                    interaction.reply('vote finished')

                } , vote.runtime)

                vote.messageID = await postVote(vote, interaction);

                votes.votes.push(vote);

                fs.writeFileSync('./votes.json', JSON.stringify(votes));
                break;

            case ('list'):
                const embed = new MessageEmbed().setColor('#55ff55').setTitle('Current Votes:').setTimestamp();

                for (i in votes.votes.length) {
                    embed.addFields(
                        { name: votes.votes[i].name, value: votes.votes[i].description },
                    )
                }

                interaction.reply({ embeds: [embed]});
                break;

            case ('delete'):
                for (let i = 0; i < votes.votes.length; i++) {
                    if (votes.votes[i].name == interaction.options.getString('vote')) {
                        votes.votes.splice(i--, 1);
                    }
                }

                // delete message and reply

                fs.writeFileSync('./votes.json', JSON.stringify(votes));
                break;
        }
	},
};

function createVote(name, description, hours, minutes,ms, now, future) {
    return {
        endTime:future,
        startTime:now,
        runtime:ms,
        name:name,
        description:description,
        hours:hours,
        minutes:minutes,
        messageID:"",
    }
}

async function postVote(vote, interaction) {
    const exampleEmbed = new MessageEmbed()
                        .setColor('#55ff55')
                        .setTitle(vote.name)
                        .setDescription(vote.description)
                        // do better here with the endtype printout
                        .addFields(
                            { name: 'Ends at:', value: String(vote.endTime) },
                        )
                        .setTimestamp()
                        
    await interaction.reply({ embeds: [exampleEmbed]});
    let message = await interaction.fetchReply();
    
    return message.id; //message ID
}

function initializeVotes() {

}