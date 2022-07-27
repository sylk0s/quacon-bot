const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('role')
		.setDescription('Gives a role to a user')
        .addUserOption(option => option.setName('target').setDescription("Person to give the role.").setRequired(true))
		.addRoleOption(option => option.setName('role').setDescription('desc').setRequired(true))
        .setDefaultPermission(false),
	async execute(interaction, bot) {
        let target = interaction.options.getUser('target');
        let guild_member = interaction.guild.members.cache.get(target.id);
		switch (interaction.options.getRole('role').id) {

            // TODO put this all in the config later lol

            case ('927073120949526538'): // consultant
                // add role A1
                interaction.reply('Applied consultant roles to ' + guild_member.nickname + "\nClick on the reply for more info");
                guild_member.roles.add(interaction.options.getRole('role'));
                // A1
                guild_member.roles.add(interaction.guild.roles.cache.get('927002947429236746'));
                break;
            default:
                if (interaction.member.roles.cache.has('926404073102659605') || 
                    interaction.member.roles.cache.has('926412876015607840') ||
                    interaction.member.roles.cache.has('927074637937000498')
                    ) { // has role permissions
                    switch (interaction.options.getRole('role').id) {
                        case ('926408416275071016'): // intern
                            interaction.reply('Applied intern roles to ' + guild_member.nickname + "\nClick on the reply for more info");
                            guild_member.roles.add(interaction.options.getRole('role'));
                            // A1
                            guild_member.roles.add(interaction.guild.roles.cache.get('927002947429236746'));
                            // A2
                            guild_member.roles.add(interaction.guild.roles.cache.get('927003157538693180'));
                            // P1
                            guild_member.roles.add(interaction.guild.roles.cache.get('927074564477972501'));
                            sendEmbed();
                            break;
                        case ('926407841609289748'): // employee
                            interaction.reply('Applied employee roles to ' + guild_member.nickname + "\nClick on the reply for more info");
                            guild_member.roles.add(interaction.options.getRole('role'));
                            // A1
                            guild_member.roles.add(interaction.guild.roles.cache.get('927002947429236746'));
                            // A2
                            guild_member.roles.add(interaction.guild.roles.cache.get('927003157538693180'));
                            // A3
                            guild_member.roles.add(interaction.guild.roles.cache.get('927003226493034517'));
                            // P1
                            guild_member.roles.add(interaction.guild.roles.cache.get('927074564477972501'));
                            break;
                        case ('926408493160890428'): // contractor
                            interaction.reply('Applied contractor roles to ' + guild_member.nickname + "\nClick on the reply for more info");
                            guild_member.roles.add(interaction.options.getRole('role'));
                            // A1
                            guild_member.roles.add(interaction.guild.roles.cache.get('927002947429236746'));
                            // A2
                            guild_member.roles.add(interaction.guild.roles.cache.get('927003157538693180'));
                            // P1
                            guild_member.roles.add(interaction.guild.roles.cache.get('927074564477972501'));
                            break;
                    }
                } else {
                    interaction.reply('Error, role not approved');
                }
        }
	}
};

function sendEmbed() {
    return;
}