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
		.setDescription("Add a user to the whitelist")
		.addStringOption(option => option.setName('mcname').setDescription('The minecraft username').setRequired(true))
		.addUserOption(option => option.setName('discord').setDescription('The discord username of the target user').setRequired(true))
		.addStringOption(option => option.setName('server').setDescription('The server. Options are: All, ' + Object.keys(whitelist_config).join(', ')).setRequired(true))
		.addStringOption(option => option.setName('type').setDescription('The user type. Options are: Employee, Contractor, Temporary').setRequired(true))
		.addStringOption(option => option.setName('duration').setDescription('The duration of the whitelist (optional). Format: /\\d+(suffix)/, e.g. "5d", "1 day", "2weeks","30m"').setRequired(false)))
	.addSubcommand(subcommand =>
		subcommand
		.setName('remove')
		.setDescription('Remove a username/uuid(?) from the whitelist')
		.addStringOption(option => option.setName('mcname').setDescription('The minecraft username').setRequired(true))
		.addStringOption(option => option.setName('server').setDescription('The server. Options are: All, ' + Object.keys(whitelist_config).join(', ')).setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand
		.setName('list')
		.setDescription('List all whitelisted members')
		.addStringOption(option => option.setName('server').setDescription('The server. Options are: All, ' + Object.keys(whitelist_config).join(', ')).setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand
		.setName('viewuser')
		.setDescription('Remove a username/uuid from the whitelist')
		.addUserOption(option => option.setName('discord').setDescription('The discord username of the target user').setRequired(true))
		.addStringOption(option => option.setName('verbose').setDescription('Verbose? Boolean, default: false').setRequired(false)))
	.addSubcommand(subcommand =>
		subcommand
		.setName('export')
		.setDescription('Export a whitelist JSON object. TEMPORARY SOLUTION')
		.addStringOption(option => option.setName('server').setDescription('The server. Options are: All, ' + Object.keys(whitelist_config).join(', ')).setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand
		.setName('clear_expired_users')
		.setDescription('Clear whitelist entries that have expired. TEMPORARY SOLUTION'))	
	.addSubcommand(subcommand =>
		subcommand
		.setName('purge_temporary_whitelists')
		.setDescription('Purge EVERY temporary whitelist entry.')),
		
	async execute(interaction, bot) {
		fs.readFile('./whitelist.json', 'utf8', (err, jsonString) => {
			if (err) {
				console.log("File read failed:", err)
				sendError("An error occured!", interaction);
				return;
			} 
			var whitelist = JSON.parse(jsonString);
			switch(interaction.options.getSubcommand()) {
				case 'add':
					var name = interaction.options.getString('mcname');
					var discord_id = interaction.options.getUser('discord').id;
					var type = interaction.options.getString('type');

					var server = interaction.options.getString('server');
					servers = getServersFromAlias(server, interaction);
					
					whitelist[server] ??= [];

					temporary = false;
					switch(type.toLowerCase()) {
						case 'temp':
						case 'temporary':
							type = 'Temporary';
							temporary = true;
							break;
						case 'contractor':
							type = 'Contractor';
							break;
						case 'employee':
							type = 'Employee';
							break;
						default: 
							sendError("Invalid user type!", interaction);
							return;
					}
					
					MojangAPI.nameToUuid(name, function(err,res) {
						if(err) {
							console.log(err);
							sendError("An error occured!", interaction);
							return;
						} else if(res.length == 0) {
							sendError("Invalid username!", interaction);
							return;
						} else {
							var account = res[0];
							
							account.discord_id = discord_id;
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
										sendError("Invalid duration string! Must be of the format: `/\\d+(M|Months|w|weeks|d|days|h|hours|m|minutes)/`, e.g. \"1d\", \"2weeks\",\"30m\"", interaction);
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
										unit ??= "Months(s)";
										milliseconds *= 2678400000 // 31*24*60*60*1000
										break;
								}
								account.expiration = new Date().getTime() + milliseconds;
							}

							var embeds = [];
							servers.forEach(server => {
								var error = whitelist_add(server, account.name, whitelist);
								if(error) {
									embeds.push(error);
								} else {
									if(temporary) {
										description = `Temporary account successfully added to whitelist! Duration: ${duration} ${unit}`;
									} else {
										description  = "Account successfully added to whitelist!";
									}
									embeds.push(new MessageEmbed()
										.setColor('#ffffff')
										.setTitle(`Success! - ${server.toUpperCase()}`)
										.setDescription(description)
										// .addFields(text_body)
										.setTimestamp()
									);
								}
								whitelist[server] ??= [];
								whitelist[server].push(account);
							});
							
							save_wl(whitelist);
							interaction.reply({ embeds });
							return;
						}
					})
					break;

				case 'remove':
					var mcname = interaction.options.getString('mcname');
					var server = interaction.options.getString('server');
					prev_whitelist = JSON.stringify(whitelist);

					var embeds = [];
					servers = getServersFromAlias(server, interaction);
					servers.forEach(server => remove(server));
					
					function remove(server){
						toBeRemoved = whitelist[server].filter(account => account.name.toLowerCase() == mcname.toLowerCase());
						toBeRemoved.forEach(user => whitelist_remove(server, user.name))
						
						whitelist[server] = whitelist[server].filter(account => account.name.toLowerCase() != mcname.toLowerCase());
						
						var fields = getAccountsInfoEmbedField(toBeRemoved, true);
						
						embeds.push(new MessageEmbed()
							.setColor('#FFA500')
							// .setTitle(`Whitelist - ${server.toUpperCase()}`)
							.setDescription(`The following account(s) were removed from **${server.toUpperCase()}**:`)
							.addFields(
								fields
							)
							.setTimestamp()
						)
	
					}
					save_wl(whitelist);
					
					if(JSON.stringify(whitelist) != prev_whitelist) {
						interaction.reply({ embeds });
						// interaction.reply(`Account ${mcname} removed successfully!`);
					} else {
						interaction.reply("No account(s) were removed.");
					}
					break;
					
				case 'list':
					var server = interaction.options.getString('server');
					
					servers = getServersFromAlias(server, interaction);
					
					var embeds = [];
					servers.forEach(server => {

						whitelist[server] ??= [];

						var types = whitelist[server].reduce((arr, entry) => {
							arr[entry.type] ??= [];
							arr[entry.type].push(entry);
							return arr;
						}, {});

						var text_body = [];
						
						for(const [type, users] of Object.entries(types)) {
							var value = users.reduce((value, user) => {
								return value += `${user.name} - ${Formatters.userMention(user.discord_id)}\n`;
							},"")

							text_body.push({
								"name": type,
								value
							});
						}

						embeds.push(new MessageEmbed()
							.setColor('#ffffff')
							.setTitle(`Whitelist - ${server.toUpperCase()}`)
							.setDescription("A list of all whitelisted accounts and the corresponding users:")
							.addFields(
								text_body
							)
							.setTimestamp()
						);
					});

					interaction.reply({ embeds });
					break;
				
				case 'viewuser':
					var discord_id = interaction.options.getUser('discord').id;
					var verbose = interaction.options.getString('verbose');
					var accounts = Object.values(whitelist).flat().filter(account => 
						account.discord_id == discord_id
					);
					var description = `Whitelist profile for ${Formatters.userMention(discord_id)}:`;

					var text_body = getAccountsInfoEmbedField(accounts, verbose);
					
					embeds = [new MessageEmbed()
						.setColor('#ffffff')
						.setDescription(description)
						.addFields(text_body)
						.setTimestamp()
					];
						
					interaction.reply({ embeds });
					break;

				case 'export': // TEMPORARY SOLUTION
					var servers = getServersFromAlias(interaction.options.getString('server'), interaction);
					var exportable = {};
					output = servers.map(server => {
						exportable[server] = whitelist[server];
						exportable[server].forEach(a => {
							delete a.discord_id;
							delete a.added_by;
							delete a.added_on;
							delete a.type;
							delete a.expiration;
							a.id = AddDashesToUUID(a.id);
						})
						return `**${server}**: \`\`\`${JSON.stringify(exportable[server])}\`\`\``;
					});
					interaction.reply(output.join(''));
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

function sendError(message, interaction) {
	interaction.reply({ embeds: [errorEmbed(message)] });
}
function errorEmbed(message) {
	return new MessageEmbed()
			.setColor('#ff3333')
			.setTitle(`Error!`)
			.setDescription(message);
}

function whitelist_add(server, username, whitelist) {
	if (whitelist[server]?.some(acc => acc.name.toLowerCase() == username.toLowerCase())) {
		return errorEmbed(`Account already whitelisted on ${server.toUpperCase()}!`);
	}
	bot.wsconnection.send(`CMD ${server} whitelist add ${username}`);
	console.log(`CMD ${server} whitelist add ${username}`);

	if(whitelist_config[server].op) {
		bot.wsconnection.send(`CMD ${server} op ${username}`);
		console.log(`CMD ${server} op ${username}`);
	}
}

function whitelist_remove(server, username) {
	bot.wsconnection.send(`CMD ${server} whitelist remove ${username}`);
	console.log(`CMD ${server} whitelist remove ${username}`);

}

function getServersFromAlias(alias, interaction) {
	if(alias.toLowerCase() == 'all') {
		servers = Object.keys(whitelist_config);
	} else {
		servers = [Object.entries(whitelist_config).find(([_, conf]) => conf.names.includes(alias.toLowerCase()))[0]];
	}

	if(servers == undefined) {
		sendError(`Invalid server! Options are: ${Object.keys(whitelist_config).join(', ')}`, interaction);
		return;
	}
	return servers;
}

function getAccountsInfoEmbedField(accounts, verbose) {
	return accounts.map(account => {
		var field = {};
		field.name = account.name;

		field.value = "";
		if(verbose) {
			field.value += account.id + '\n';
			field.value += AddDashesToUUID(account.id) + '\n';
			field.value += "Added by: " + Formatters.userMention(account.added_by) + '\n';
			field.value += "Added on: " + Formatters.time(new Date(account.added_on), "f") + '\n';
		}
		field.value += `Type: **${account.type}**\n`;
		if(account.type == 'Temporary') {
			field.value += `Expiration: ${Formatters.time(new Date(account.expiration), "f")}\n`
		}
		return field;
	});
}