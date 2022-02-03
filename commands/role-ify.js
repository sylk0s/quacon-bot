const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('give')
		.setDescription('Gives a role to a user')
		.addRoleOption(option => option.setName('role').setRequired(true))
        .addUserOption(option => option.setName('target').setDescription("Person to give the role.")),
	async execute(interaction) {
        let target = interaction.options.getUser('target');
		switch (interaction.options.getRole('role').id) {
            case ('3'): // consultant
                // add role A1
                break;
            default:
                if (interaction.options.getAuthor()) { // has role permissions
                    switch (interaction.options.getRole('role').id) {
                        case ('1'): // intern
                            // add roles A1, A2, P1
                            sendEmbed();
                            break;
                        case ('2'): // employee
                            // add roles A1, A2, A3, P1, P5?
                            break;
                        case ('4'): // contractor
                            // add role A1, A2, P1
                            break;
                    }
                } 
                interaction.reply('Error, role not approved');
        }

	}
};

function sendEmbed() {
    return;
}