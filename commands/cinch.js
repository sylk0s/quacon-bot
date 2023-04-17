const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

// /cinch
//  each player can only play in one game at a time
//  args: join, leave, hand, look
//  determine interface (editied message or just constant refreash
//  not crash safe
//  deck object
//  keep track of the "big" points and small points in a roundL

function play(bot, game) {
  // delete current game message
  // setup the new betting menu
  console.log('on_play');
  getGameMsg(bot, game).then(msg => {msg.delete()});
  const embed = new EmbedBuilder()
		    .setTitle("Betting Screen")
		    .setDescription("aaa")
		    .addFields({
		      name:"temp",
		      value:"temporary",
		      inline:true,
		    });

  game.msg = getGameChannel(bot, game).then(msg => {return msg.send({embeds: [embed]});}).id;
  getGameMsg(bot, game).then(msg => {
    console.log(msg);
    msg.react('1️⃣');}
  );
}

// called on reaction
function bet(bot, amount, user) {
	if (false) return; // check for if betting is over 
	if (false) return; // check for if player is in the game
	if (false) return; // check for if it's the players turn
	
	
}

function useCard(bot, game, index, user) {

}

// on_reaction and from start()
// handles adding a new player to the game and autostarting when the game has reached it's capacity
async function join(bot, id, game) {
  game.players.push(id);
  if (game.players.length === 2) {
    play(bot, game);
  } else {
    playernames = await namesToStrings(bot, game);
    const embed = new EmbedBuilder()
		      .setTitle("Title")
		      .setDescription("Desc.")
		      .addFields({
			name:"Players",
			value:playernames,
			inline:false,
		      });
    if (!game.msg) {
      game.msg = getGameChannel(bot, game).then(msg => {return msg.send({embeds: [embed]});}).id;
    } else {
      getGameMsg(bot, game).then(msg => {msg.edit({embeds: [embed]});});
    }
    return game;
  }
}

async function getGameChannel(bot, game) {
  return await bot.channels.fetch(game.channel);
}

async function getGameMsg(bot, game) {
  return getGameChannel(bot, game).then(ch => {
    return ch.messages.fetch(game.msg).then(msg => {
      return msg;
    });
  });
}

async function namesToStrings(bot, game) {
  str = "";
  for (i in game.players) {
    str += await bot.users.fetch(game.players[i]).then(msg => {return msg.username}) + "\n";
  }
  return str
}

// opdates a players hand, keeps it at the bottom of the channel
function hand() {

}

// maps a discord user to a specific player in the game
// returns important info about the player
function mapUserToPlayer() {

}

async function start(bot, interaction) {
  console.log('starting');
  let game = await join(bot, interaction.user.id, newgame(interaction));
  bot.cinchgames.push(game);
}

function newgame(interaction) {
  return {
      "creator":interaction.user.name,
      "creatorid":interaction.user.id,
      "players":[],
      "cards": {
	"hands": [],
	"burnPile":[],
	"drawPile":[],
	"t1cards":[],
	"t2cards":[],
      },
      "trick":0,
      "bets":[],
      "msg":null,
      "channel":interaction.channel.id,
    }
}

function newHand() {
  return {
    "snfid":null,
    "cards":[],
    "msgid":null,
  }
}

function getCinch(bot, id) {
  for (i in bot.cinchgames) {
    if (bot.cinchgames[i].msg === id) {
      return bot.cinchgames[i];
    }
  }
  return null;
}

function cleanup(bot, interaction) {

}

function getReactionEmotes() {
  return {
    "bet1":0,
    "bet2":0,
    "bet3":0,
    "bet4":0,
    "bet5":0,
    "bet6":0,
    "betpass":0,
    "join":0,
    "cancel":0,
    "card1":0,
    "card2":0,
    "card3":0,
    "card4":0,
    "card5":0,
    "card6":0,
    "card7":0,
    "card8":0,
    "card9":0,
    "card10":0,
    
  }
}

function handleReaction(bot, reaction, user) {
  game = getCinch(reaction.message.id);
  switch (reaction.emoji) {
    case ('1️⃣'):
      bet(bot, 1, user);
      break;
    case ('2️⃣'):
      bet(bot, 2, user);
      break;
    case ('3️⃣'):
      bet(bot, 3, user);
      break;
    case ('4️⃣'):
      bet(bot, 4, user);
      break;
    case ('5️⃣'):
      bet(bot, 5, user);
      break;
    case ('6️⃣'):
      bet(bot, 6, user);
      break;
    case ('🇵'):
      bet(bot, 0, user);
      break;
    case ('✅'):
      join(bot, user.id, game);
      break;
    case ('❌'):
      // handle the thing that happens here at some point lol
      break;
    case ('🇦'):
      playCard(bot, game, 0, user.id);
      break;
    case ('🇧'):
      playCard(bot, game, 1, user.id);
      break;
    case ('🇨'):
      playCard(bot, game, 2, user.id);
      break;
    case ('🇩'):
      playCard(bot, game, 3, user.id);
      break;
    case ('🇪'):
      playCard(bot, game, 4, user.id);
      break;
    case ('🇫'):
      playCard(bot, game, 5, user.id);
      break;
    case ('🇬'):
      playCard(bot, game, 6, user.id);
      break;
    case ('🇭'):
      playCard(bot, game, 7, user.id);
      break;
    case ('🇮'):
      playCard(bot, game, 8, user.id);
      break;
    case ('🇯'):
      playCard(bot, game, 9, user.id);
      break;
  }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cinch')
		.setDescription('Used to interact with the game cinch')  
		.addSubcommand(subcommand => subcommand
			.setName("start")
			.setDescription("start a new game"))
		.addSubcommand(subcommand => subcommand
		  .setName("join")
		  .setDescription("yes"))
		.addSubcommand(subcommand => subcommand
			.setName("stop")
			.setDescription("stops the game"))
		.addSubcommand(subcommand => subcommand
			.setName("query")
			.setDescription("get the json for the cinchgames")),
	async execute(interaction, bot) {
		switch(interaction.options.getSubcommand()) {
			case ('start'):
			  console.log('triggered start');
			  await start(bot, interaction);
			  interaction.reply({content:"Game started!", ephemeral:true});
			  break;
			case ('stop'):
			  cleanup(bot, interaction);
			  break;
			case ('join'):
			  await join(bot, interaction.user.id, bot.cinchgames[0]);
			  break;
			case ('query'):
			  console.log(bot.cinchgames[0]);
			  break;
		}
	},
  getReactionEmotes,
};
