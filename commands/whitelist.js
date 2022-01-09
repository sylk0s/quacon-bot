const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { MessageEmbed, Formatters, Util } = require('discord.js');
const AddDashesToUUID = require("add-dashes-to-uuid");

module.exports = {
	data: new SlashCommandBuilder()
	.setName("whitelist")
	.setDescription("Manage the whitelist")
    .addSubcommandGroup(subcommandgroup =>
		subcommandgroup
		.setName("add")
		.setDescription("add users to the whitelist")
		.addSubcommand(subcommand =>
			subcommand
			.setName("employee")
			.setDescription("Add an Employee to the whitelist")
			.addStringOption(option => option.setName('mcname').setDescription('The minecraft username').setRequired(true))
			.addUserOption(option => option.setName('target').setDescription('The user').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
			.setName("contractor")
			.setDescription("Add a Contractor to the whitelist")
			.addStringOption(option => option.setName('mcname').setDescription('The minecraft username').setRequired(true))
			.addUserOption(option => option.setName('target').setDescription('The user').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
			.setName("temporary")
			.setDescription("Add a User to the whitelist temporarily")
			.addStringOption(option => option.setName('duration').setDescription('The duration of the whitelist').setRequired(true))
			.addStringOption(option => option.setName('mcname').setDescription('The minecraft username').setRequired(true))
			.addUserOption(option => option.setName('target').setDescription('The user (optional)').setRequired(false))))
	.addSubcommand(subcommand =>
		subcommand
		.setName('remove')
		.setDescription('Remove a username/uuid(?) from the whitelist')
		.addStringOption(option => option.setName('mcname').setDescription('The minecraft username').setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand
		.setName('list')
		.setDescription('List all whitelisted members'))
	.addSubcommand(subcommand =>
		subcommand
		.setName('viewuser')
		.setDescription('Remove a username/uuid from the whitelist')
		.addUserOption(option => option.setName('target').setDescription('Discord username').setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand
		.setName('export')
		.setDescription('Export a whitelist JSON object. TEMPORARY SOLUTION'))
	.addSubcommand(subcommand =>
		subcommand
		.setName('clear_expired_users')
		.setDescription('Clear whitelist entries that have expired. TEMPORARY SOLUTION')),
		
	async execute(interaction) {
		var whitelist_type;
		fs.readFile('./whitelist.json', 'utf8', (err, jsonString) => {
			if (err) {
				console.log("File read failed:", err)
				interaction.reply("An error occured!");
				return;
			} 
			var whitelist = JSON.parse(jsonString);
			switch(interaction.options.getSubcommand()) {
				case 'temporary':
					whitelist_type ??= 'temporary';
					temporary = true;
					// passthrough
				case 'contractor':
					whitelist_type ??= 'contractor';
					// passthrough
				case 'employee':
					whitelist_type ??= 'employee';
					
					var MojangAPI = require('mojang-api')
					MojangAPI.nameToUuid(interaction.options.getString('mcname'), function(err,res) {
						if(err) {
							console.log(err);
							interaction.reply("An error occured!");
							return;
						} else if(res === []) {
							interaction.reply("Invalid username!");
							return;
						} else {
							fs.readFile('./whitelist.json', 'utf8', (err, jsonString) => {
								if (err) {
									console.log("File read failed:", err)
									interaction.reply("An error occured!");
									return;
								} 
								var whitelist = JSON.parse(jsonString);
							
								var index = whitelist.findIndex((user) => user.discord_id == interaction.options.getUser('target').id || "");
								if(index == -1) {
									whitelist.push({
										"discord_id": interaction.options.getUser('target').id,
										"accounts": []
									});
									index = whitelist.length - 1;
								}
								var user_entry = whitelist[index];
								user_entry.type = whitelist_type;
								if(temporary) {
									var duration_string = interaction.options.getString('duration');
									var [duration, suffix] = duration_string.split(/(?=[A-Za-z])/g);
									switch (suffix) {
										case 'w':
											unit = "Week(s)";
											duration *= 7;
										case 'd':
											unit ??= "Day(s)";
											duration *= 24;
										case 'h':
											unit ??= "Hour(s)";
											duration *= 60;
										case 'm':
											unit ??= "Minute(s)";
											duration *= 60000;
											break;
										case 'M':
											// 31*24*60*60*1000
											unit ??= "Months(s)";
											duration *= 2678400000
											break;
										default:
											console.log(duration, suffix, duration_string);
											interaction.reply("Invalid duration string! Must be of the format: `\d+(M|w|d|h|m)`");
											return;
									}
									user_entry.expiration = new Date().getTime() + duration;
								}

								var account = res[0];
								account.added_on = new Date().toISOString();
								account.added_by = interaction.member.id;
								
								user_entry.accounts.push(account);
								save_wl(whitelist);
		
								interaction.reply("Account successfully added to whitelist!");
							});
						}
					})
					break;

				case 'remove':
					prev_whitelist = JSON.stringify(whitelist);
					whitelist.forEach((user_entry, index) => {
						user_entry.accounts = user_entry.accounts.filter(account => 
							account.name.toLowerCase() != interaction.options.getString('mcname').toLowerCase()
						)
						whitelist[index] = user_entry;
					});

					console.log(whitelist);
					whitelist = whitelist.filter(user_entry => user_entry.accounts.length > 0);
					console.log(whitelist);
					save_wl(whitelist);
					if(JSON.stringify(whitelist) != prev_whitelist) {
						interaction.reply(`Account ${interaction.options.getString('mcname')} removed successfully!`);
					} else {
						interaction.reply("Nah m8");
					}
					break;
					
				case 'list':
					var list = {
						employee: "",
						contractor: "",
						temporary: ""
					};
					whitelist.forEach((user_entry, index) => {
						var type = user_entry.type
						list[type] += `${Formatters.userMention(user_entry.discord_id)}\n`;
						list[type] += user_entry.accounts.map(u => u.name).join('\n')+'\n\n';
					});

					var embed = new MessageEmbed()
						.setColor('#ffffff')
						.setTitle("Whitelist")
						.setDescription("A list of all whitelisted members and their account names:")
						.addFields(
							{ name: 'Employees', value: (list.employee ? Util.escapeMarkdown(list.employee) : "None") },
							{ name: 'Contractors', value: (list.contractor ? Util.escapeMarkdown(list.contractor) : "None") },
							{ name: 'Temporary', value: (list.temporary ? Util.escapeMarkdown(list.temporary) : "None") },
						)
						.setTimestamp()

					interaction.reply({ embeds: [embed]});
					break;
				
				case 'viewuser':
					var user = whitelist.find(account => 
						account.discord_id == interaction.options.getUser('target').id
					);
					console.log(user);
					
					var description = `Whitelist profile for ${Formatters.userMention(user.discord_id)}`;
					description += `\nUser type: ${user.type}`;
					if(user.type == 'temporary') {
						description += `\nExpiration: ${new Date(user.expiration).toISOString().replace('T', ' ').substr(0, 19) + '\n'}`
					}
					var text_body = [];
					user.accounts.forEach((account, index) => {
						text_body[index] = {};
						text_body[index].name = account.name;
						text_body[index].value = account.id + '\n';
						text_body[index].value = AddDashesToUUID(account.id) + '\n';
						text_body[index].value += "Added on: " + account.added_on.replace('T', ' ').substr(0, 19) + '\n';
						text_body[index].value += "Added by: " + Formatters.userMention(account.added_by);
					});
					console.log(text_body);
					
					embed = new MessageEmbed()
						.setColor('#ffffff')
						.setDescription(description)
						.addFields(text_body)
						.setTimestamp();
						
					interaction.reply({ embeds: [embed]});
					break;

				case 'export': // TEMPORARY SOLUTION
					var exportable = [].concat.apply([], whitelist.map(u => u.accounts));
					console.log(exportable);
					exportable.forEach(a => {
						delete a.added_by;
						delete a.added_on;
						a.id = AddDashesToUUID(a.id);
					})
					console.log(exportable);
					interaction.reply(`\`${JSON.stringify(exportable)}\``);
					break;

				case 'clear_expired_users':
					var result_count = whitelist.filter(u => u.type == 'temporary' && parseInt(u.expiration) < new Date().getTime()).length;
					if(result_count > 0) {
						whitelist = whitelist.filter(u => !(u.type == 'temporary' && parseInt(u.expiration) < new Date().getTime()));
						save_wl(whitelist);
					}
					interaction.reply(`Successfully cleared all expired whitelists. Cleared ${result_count} ${result_count == 1 ? 'entry' : 'entries'}.`);
					
			}
		});
	}
};

function save_wl(wl) {
	fs.writeFileSync('./whitelist.json', JSON.stringify(wl));
}
