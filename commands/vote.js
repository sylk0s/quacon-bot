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

                let vote = createVote(
                    interaction.options.getString('name'),
                    interaction.options.getString('description'),
                    hours,
                    minutes,
                    now,
                    future);

                // start the timer

                vote.messageID = await postVote(vote, interaction);

                votes.votes.push(vote);

                fs.writeFileSync('./votes.json', JSON.stringify(votes));
                break;

            case ('list'):

                const embed = new MessageEmbed().setColor('#55ff55').setTitle('Current Votes:').setTimestamp();

                for (let i = 0; i < votes.votes.length; i++) {
                    embed.addFields(
                        { name: votes.votes[i].name, value: votes.votes[i].description },
                    );
                }

                interaction.reply({ embeds: [embed]});
                break;

            // this is also broken lol
            // this should also break if its in the wrong channel upsi
            case ('delete'):
                for (let i = 0; i < votes.votes.length; i++) {
                    if (votes.votes[i].name == interaction.options.getString('vote')) {
                        let vote = votes.votes[i];
                        votes.votes.splice(i--, 1);
                        await interaction.channel.messages.fetch(vote.messageID).then(msg => msg.delete());
                        await interaction.reply({ content: 'Deleted ' + vote.name , ephemeral: true });
                    }
                }
                fs.writeFileSync('./votes.json', JSON.stringify(votes));
                break;
        }
	},
    queryVotes
};

function createVote(name, description, hours, minutes, now, future) {
    return {
        endTime:future,
        startTime:now,
        name:name,
        description:description,
        hours:hours,
        minutes:minutes,
        messageID:"",
    }
}

async function postVote(vote, interaction) {
    const exampleEmbed = new MessageEmbed()
                        .setColor('#ffff00')
                        .setTitle(vote.name)
                        .setDescription(vote.description)
                        // do better here with the endtype printout
                        .addFields(
                            { name: 'Ends at:', value: String(vote.endTime) },
                        )
                        .setTimestamp()
                        
    await interaction.reply({ embeds: [exampleEmbed]});
    let message = await interaction.fetchReply();
    
    await message.react('👍');
    await message.react('👎');
    await message.react('✋');

    return message.id; //message ID
}

// this is bad but it wrote it this way so the vote command is decoupled from the logic
function queryVotes(bot) {
    console.log("starting vote query")
    setInterval(function() {
        console.log('i am checking the votes');
        let data = fs.readFileSync('votes.json');
        let votes = JSON.parse(data);
        let toDelete = [];
        for(let i = 0; i < votes.votes.length; i++) {
            let vote = votes.votes[i];
            const end = Date.parse(vote.endTime)
            const now = new Date();
            if(end-now < 0) {
                toDelete.push(vote.messageID);
            }
        }
        // this second loop removes any looping errors I had
        for(let j = 0; j < toDelete.length; j++) {
            for(let i = 0; i < votes.votes.length; i++) {
                if(votes.votes[i].messageID == toDelete[j]) {
                    endVote(i, bot);
                }
            }
        }
    }, 10 * 1000) // 
}

function endVote(i, bot) {
    let data = fs.readFileSync('votes.json');
    let votes = JSON.parse(data);
    let vote = votes.votes[i];

    bot.channels.cache.get('927417403997040651').messages.fetch(vote.messageID).then((msg) => {

        // count reactions and handle voting

        const reactions = msg.reactions.cache;
        let yesVote = reactions.get('👍').count-1;
        let noVote = reactions.get('👎').count-1;
        let abstain = reactions.get('✋').count-1;

        msg.reactions.removeAll();

        const exampleEmbed = new MessageEmbed()
                        .setTitle(vote.name) // help
                        .setDescription(vote.description)
                        .addFields( { name: 'Yes', value: String(yesVote), inline: true },)
                        .addFields( { name: 'No', value: String(noVote), inline: true },)
                        .addFields( { name: 'Abstain', value: String(abstain), inline: true },)
                        .setTimestamp()
        
        if (yesVote >= noVote) {
            exampleEmbed.setColor('#55ff55')
            .addFields( { name: 'Result:', value: 'Passed!' }, );
        } else {
            exampleEmbed.setColor('#ff0000')
            .addFields( { name: 'Result:', value: 'Failed :(' }, );
        }

        msg.edit({embeds: [exampleEmbed]});
      });

      votes.votes.splice(i--, 1);

    fs.writeFileSync('./votes.json', JSON.stringify(votes));
}