const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const { listenForResponseWithType } = require("../taurus.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("backup")
    .setDescription("manage backups on server")
    .setDefaultPermission(false)
    .addSubcommand((sub) => sub.setName("list").setDescription("list backups"))
    .addSubcommand((sub) =>
      sub
        .setName("rm")
        .setDescription("remove backup based on file name")
        .addStringOption((option) =>
          option
            .setName("file")
            .setDescription(
              "using backup ls please send the corresponding filename of the back you want to remove"
            )
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("new")
        .setDescription("create new backup")
        .addStringOption((option) =>
          option
            .setName("session")
            .setDescription("session name to create new backup of")
            .setRequired(true)
        )
    ),
  async execute(interaction, bot) {
    switch (interaction.options.getSubcommand()) {
      case "list":
        bot.wsconnection.send("LIST_BACKUPS");
        const lsreply = await listenForResponseWithType(bot, "LIST_BACKUPS");
        if (lsreply && lsreply.length > 13) {
          const value = lsreply.toString();
          const sliced = value.slice(13);
          let embed = new EmbedBuilder()
            .setTitle("list backups :pencil:")
            .setDescription(sliced);
          interaction.reply({ embeds: [embed] });
        } else {
          interaction.reply("failed to recieve reply from taurus");
        }
        break;
      case "rm":
        bot.wsconnection.send(
          "RM_BACKUP " + interaction.options.getString("file")
        );
        const rmreply = await listenForResponseWithType(bot, "RM_BACKUP");
        if (rmreply && rmreply.length > 10) {
          const value = rmreply.toString();
          const sliced = value.slice(10);
          let embed = new EmbedBuilder()
            .setTitle("remove backup: ")
            .setDescription(sliced);
          interaction.reply({ embeds: [embed] });
        } else {
          interaction.reply("failed to recieve reply from taurus");
        }
        break;
      case "new":
        bot.wsconnection.send(
          "BACKUP " + interaction.options.getString("session")
        );
        interaction.reply(
          "Backup command sent, please check shortly with backup ls if the backup was successful"
        );
        break;
    }
    //
    //
    // const reply = await listenForResponseWithType(bot, "LIST");
    // if (reply && reply.length > 0) {
    //   const value = reply.toString();
    //   const sliced = value.slice(5).replace(":", ": ");
    //   console.log(sliced);
    //   let embed = new EmbedBuilder()
    //     .setTitle("list :pencil:")
    //     .setDescription(sliced);
    //   interaction.reply({ embeds: [embed] });
    // } else {
    //   interaction.reply("failed to recieve reply from taurus");
    // }
  },
};
