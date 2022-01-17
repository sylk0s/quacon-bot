const { SlashCommandBuilder } = require('@discordjs/builders');

// this is all untested... 
module.exports = {
	data: new SlashCommandBuilder()
		.setName('vote')
		.setDescription('Control the votes')
        .addSubcommand(subcommand
			.setName("create")
			.setDescription("Create a new vote")
			.addStringOption(option => option.setName('name').setDescription('The name of the vote').setRequired(true))
            .addStringOption(option => option.setName('description').setDescription('Describe the vote').setRequired(true))
            .addStringOption(option => option.setName('hours').setDescription('Hours the vote will go for').setRequired(false))
            .addStringOption(option => option.setName('minutes').setDescription('Minutes the vote will go for').setRequired(false)))
        .addSubcommand(subcommand
            .setName("list")
            .setDescription("List the current running votes"))
        .addSubcommand(subcommand
            .setName("delete")
            .setDescription("Delete a vote")
            .addStringOption(option => option.setName('vote').setDescription('Name of the vote to delete').setRequired(true))),
	async execute(interaction) {
		switch(interaction.options.getSubcommand()) {

            case ('create'):
                let vote = createVote(
                    interaction.options.getString('name'),
                    interaction.options.getString('description'),
                    interaction.options.getString('hours'),
                    interaction.options.getString('minutes'))
                let data = fs.readFileSync('votes.json');
                let votes = JSON.parse(data);

                votes.votes.push(vote);
                fs.writeFileSync('./votes.json', JSON.stringify(votes));

                // handle making message stuffs
                break;

            case ('list'):
                let data = fs.readFileSync('votes.json');
                let votes = JSON.parse(data);

                const embed = new MessageEmbed().setColor('#55ff55').setTitle('Current Votes:').setTimestamp();

                for (vote in votes.votes) {
                    embed.addFields(
                        { name: vote.name, value: vote.description },
                    )
                }

                interaction.reply({ embeds: [exampleEmbed]});
                break;

            case ('delete'):

                break;
        }
	},
};

function createVote(name, description, hours, minutes) {
    return {
        endTime:"",
        startTime:"",
        name:"",
        description:"",
        hours:"",
        minutes:"",
        messageID:"",
    }
}