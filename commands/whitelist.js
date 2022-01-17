const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { MessageEmbed, Formatters, Util, CommandInteractionOptionResolver } = require('discord.js');
const AddDashesToUUID = require("add-dashes-to-uuid");

var MojangAPI = require('mojang-api');
const { config } = require('process');
const whitelist_config = require('../whitelist_config.json');

module.exports = {
	data: new SlashCommandBuilder()
	.setName("whitelist")
	.setDescription("Manage the whitelist")
	.addSubcommand(subcommand =>
		subcommand
		.setName("add")
		.setDescription("add users to the whitelist")
		.setDescription("Add a User to the whitelist temporarily")
		.addStringOption(option => option.setName('mcname').setDescription('The minecraft username').setRequired(true))
		.addUserOption(option => option.setName('target').setDescription('The user').setRequired(true))
		.addStringOption(option => option.setName('server').setDescription('The server. Options are: All, ' + Object.keys(whitelist_config).join(', ')).setRequired(true))
		.addStringOption(option => option.setName('type').setDescription('The user type. Options are: Employee, Contractor, Temporary').setRequired(true))
		.addStringOption(option => option.setName('duration').setDescription('The duration of the whitelist (optional). Format: /\\d+(suffix)/, e.g. "5d", "1 day", "2weeks","30m"').setRequired(false)))
	.addSubcommand(subcommand =>
		subcommand
		.setName('remove')
		.setDescription('Remove a username/uuid(?) from the whitelist')
		.addStringOption(option => option.setName('mcname').setDescription('The minecraft username').setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand
		.setName('list')
		.setDescription('List all whitelisted members')
		.addStringOption(option => option.setName('server').setDescription('The server').setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand
		.setName('viewuser')
		.setDescription('Remove a username/uuid from the whitelist')
		.addUserOption(option => option.setName('target').setDescription('Discord username').setRequired(true))
		.addStringOption(option => option.setName('verbose').setDescription('Verbose? Boolean, default: false').setRequired(false)))
	.addSubcommand(subcommand =>
		subcommand
		.setName('export')
		.setDescription('Export a whitelist JSON object. TEMPORARY SOLUTION')
		.addStringOption(option => option.setName('server').setDescription('The server').setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand
		.setName('clear_expired_users')
		.setDescription('Clear whitelist entries that have expired. TEMPORARY SOLUTION'))	
	.addSubcommand(subcommand =>
		subcommand
		.setName('purge_temporary_whitelists')
		.setDescription('Purge every temporary whitelist entry.')),
		
	async execute(interaction) {
		var type;
		fs.readFile('./whitelist.json', 'utf8', (err, jsonString) => {
			if (err) {
				console.log("File read failed:", err)
				error("An error occured!", interaction);
				return;
			} 
			var whitelist = JSON.parse(jsonString);
			switch(interaction.options.getSubcommand()) {
				case 'add':
					var name = interaction.options.getString('mcname');
					var target_id = interaction.options.getUser('target').id;
					var server = interaction.options.getString('server');
					var type = interaction.options.getString('type');
					
					if(!Object.keys(whitelist_config).includes(server)) {
						error(`Invalid server! Options are: ${Object.keys(whitelist_config).join(', ')}`, interaction);
						return;
					}
					whitelist[server] ??= [];

					temporary = false;
					switch(type.toLowerCase()) {
						case 'temp':
						case 'temporary':
							type ??= 'Temporary';
							temporary = true;
						case 'contractor':
							type ??= 'Contractor';
						case 'employee':
							type ??= 'Employee';
							break;
						default: 
							error("Invalid user type!", interaction);
							return;
					}
					
					MojangAPI.nameToUuid(interaction.options.getString('mcname'), function(err,res) {
						if(err) {
							console.log(err);
							error("An error occured!", interaction);
							return;
						} else if(res === []) {
							error("Invalid username!", interaction);
							return;
						} else {
							fs.readFile('./whitelist.json', 'utf8', (err, jsonString) => {
								if (err) {
									console.log("File read failed:", err)
									error("An error occured!", interaction);
									return;
								} 
								if (Object.values(whitelist).flat().some(acc => acc.name.toLowerCase() == name.toLowerCase())) {
									error("Account already whitelisted!", interaction);
									return;
								}

								var account = res[0];
								
								account.discord_id = target_id;
								account.type = type;
								account.name = name;
								account.added_on = new Date().getTime();
								account.added_by = interaction.member.id;
								account.type = type;
								
								if(temporary) {
									var duration_string = interaction.options.getString('duration');
									if(!duration_string) {
										interaction.reply("A duration must be specified for a temporary account!");
										return;
									}
									[duration, suffix] = duration_string.split(/(?=[A-Za-z])/g);
									milliseconds = parseInt(duration);
									var unit;
									switch (suffix) {
										default:
											console.log(milliseconds, suffix, milliseconds_string);
											error("Invalid duration string! Must be of the format: `/\\d+(M|Months|w|weeks|d|days|h|hours|m|minutes)/`, e.g. \"1d\", \"2weeks\",\"30m\"", interaction);
											return;
										case 'w':
										case 'weeks':
										case 'week':
											unit = "Week(s)";
											milliseconds *= 7;
										case 'd':
										case 'days':
										case 'day':
											unit ??= "Day(s)";
											milliseconds *= 24;
										case 'h':
										case 'hours':
										case 'hour':
											unit ??= "Hour(s)";
											milliseconds *= 60;
										case 'm':
										case 'minutes':
										case 'minute':
											unit ??= "Minute(s)";
											milliseconds *= 60000;
											break;
										case 'M':
										case 'Months':
										case 'months':
										case 'Month':
										case 'month':
											// 31*24*60*60*1000
											unit ??= "Months(s)";
											milliseconds *= 2678400000
											break;
									}
									account.expiration = new Date().getTime() + milliseconds;
								}

								if(server == "all") {
									Object.entries(whitelist_config).forEach(([server, _conf]) => {
										whitelist[server].push(account);
										// op on ${server} somehow
									})
								} else {
									[server, server_config] = Object.entries(whitelist_config).find(([_server, conf]) => conf.names.includes(server));
									if(typeof server_config == 'undefined') {
										error("Invalid server!", interaction);
										return;
									}
									whitelist[server].push(account);
									// op on ${server} somehow
								}
								
								save_wl(whitelist);
								if(temporary) {
									interaction.reply(`Temporary account successfully added to whitelist! Duration: ${duration} ${unit}`);
								} else {
									interaction.reply("Account successfully added to whitelist!");
								}
								return;
							});
						}
					})
					break;

				case 'remove':
					prev_whitelist = JSON.stringify(whitelist);
					mcname = interaction.options.getString('mcname');
					whitelist = whitelist.filter(account => account.name.toLowerCase() != mcname.toLowerCase());

					if(JSON.stringify(whitelist) != prev_whitelist) {
						save_wl(whitelist);
						interaction.reply(`Account ${mcname} removed successfully!`);
					} else {
						interaction.reply("No account was removed.");
					}
					break;
					
				case 'list':
					var server = interaction.options.getString('server')
					if(!Object.keys(whitelist_config).includes(server)) {
						error(`Invalid server! Options are: ${Object.keys(whitelist_config).join(', ')}`, interaction);
						return;
					}
					whitelist[server] ??= [];

					var types = whitelist[server].reduce((acc, d) => {
						if (Object.keys(acc).includes(d.type)) return acc;
					
						acc[d.type] = whitelist[server].filter(g => g.type === d.type); 
						return acc;
					}, {});
					var text_body = []
					
					for(const [type, users] of Object.entries(types)) {
						text = {
							"name": type,
							"value": ""
						};
						users.forEach(u => {
							text.value += `${u.name} - ${Formatters.userMention(u.discord_id)}\n`;
						});
						text_body.push(text);
					}

					var embed = new MessageEmbed()
						.setColor('#ffffff')
						.setTitle(`Whitelist - ${server.toUpperCase()}`)
						.setDescription("A list of all whitelisted accounts and the corresponding users:")
						.addFields(
							text_body
						)
						.setTimestamp()

					interaction.reply({ embeds: [embed]});
					break;
				
				case 'viewuser':
					target_id = interaction.options.getUser('target').id;
					verbose = interaction.options.getString('verbose');
					var accounts = Object.values(whitelist).flat().filter(account => 
						account.discord_id == target_id
					);
					var description = `Whitelist profile for ${Formatters.userMention(target_id)}:`;

					var text_body = [];
					accounts.forEach((account, index) => {
						text_body[index] = {};
						text_body[index].name = account.name;

						text_body[index].value = "";
						if(verbose == 'true') {
							text_body[index].value += account.id + '\n';
							text_body[index].value += AddDashesToUUID(account.id) + '\n';
							text_body[index].value += "Added by: " + Formatters.userMention(account.added_by) + '\n';
							text_body[index].value += "Added on: " + Formatters.time(new Date(account.added_on), "f") + '\n';
						}
						text_body[index].value += `Type: **${account.type}**\n`;
						if(account.type == 'Temporary') {
							text_body[index].value += `Expiration: ${Formatters.time(new Date(account.expiration), "f")}\n`
						}
					});
					
					embed = new MessageEmbed()
						.setColor('#ffffff')
						.setDescription(description)
						.addFields(text_body)
						.setTimestamp();
						
					interaction.reply({ embeds: [embed] });
					break;

				case 'export': // TEMPORARY SOLUTION
					var server = interaction.options.getString('server');
					if(!Object.keys(whitelist_config).includes(server)) {
						error(`Invalid server! Options are: ${Object.keys(whitelist_config).join(', ')}`, interaction);
						return;
					}
					whitelist[server] ??= [];

					var exportable = whitelist[server];
					exportable.forEach(a => {
						delete a.discord_id;
						delete a.added_by;
						delete a.added_on;
						delete a.type;
						delete a.expiration;
						a.id = AddDashesToUUID(a.id);
					})
					interaction.reply(`\`\`\`${JSON.stringify(exportable)}\`\`\``);
					break;

				case 'clear_expired_users':
					var result_count = Object.values(whitelist).flat().filter(u => u.type == 'Temporary' && new Date(u.expiration) < new Date().getTime()).length;
					if(result_count > 0) {
						Object.keys(whitelist).forEach(server =>
							whitelist[server] = whitelist[server].filter(u => !(u.type == 'Temporary' && new Date(u.expiration) < new Date().getTime()))
						);
						save_wl(whitelist);
					}
					interaction.reply(`Successfully cleared all expired whitelists. Cleared ${result_count} ${result_count == 1 ? 'entry' : 'entries'}.`);
					break;
				case 'purge_temporary_whitelists':
					var result_count = Object.values(whitelist).flat().filter(u => u.type == 'Temporary').length;
					if(result_count > 0) {
						Object.keys(whitelist).forEach(server => {
							whitelist[server] = whitelist[server].filter(u => !(u.type == 'Temporary'));
						});
						save_wl(whitelist);
					}
					interaction.reply(`Successfully cleared all temporary whitelists. Cleared ${result_count} ${result_count == 1 ? 'entry' : 'entries'}.`);
					break;
			}
		});
	}
};

function save_wl(wl) {
	fs.writeFileSync('./whitelist.json', JSON.stringify(wl));
}

function error(message, interaction) {
	embed = new MessageEmbed()
			.setColor('#ff3333')
			.setTitle(`Error!`)
			.setDescription(message);
	interaction.reply({ embeds: [embed] });
}