const { SlashCommandBuilder } = require('@discordjs/builders');

// /cinch
//  each player can only play in one game at a time
//  args: join, leave, hand, look
//  determine interface (editied message or just constant refreash
//  not crash safe
//  deck object
//  keep track of the "big" points and small points in a roundL

function play() {

}

// first round betting
function bet(bot, reaction, user) {
	if (false) return; // check for if betting is over 
	if (false) return; // check for if player is in the game
	if (false) return; // check for if it's the players turn
	
	
}

// handles adding a new player to the game and autostarting when the game has reached it's capacity
function join() {
	// adds a player to the game, auto starts @ 4 players
				// autostart:
				//		- initializes the deck by "dealing"
				//		- queues up the betting
				// gives a tldr
				// may end up being reactions as well

}

// opdates a players hand, keeps it at the bottom of the channel
function hand() {

}

// maps a discord user to a specific player in the game
// returns important info about the player
function mapUserToPlayer() {

}

// input a reactions and returns the game it applies to
function mapToGame() {

}

function start(bot, reaction, user) {
	u1id = user.id
	bot.cinchgames.push(
		{
			"creator":user.name,				// tag of the player for display purposes
			"creatorid":user.id,				// id of the creator for game uuid purposes

			// meta game info
			"players":[],						// uuid snowflake of the players in the game (ordered)
			"cards": {							// object containing all deck info
				"hands": {						// player's hands
					"p1":[],		
					"p2":[],
					"p3":[],
					"p4":[],
				},
				"burnPile":[],					// cards set aside at the start of the game
				"drawPile":[],					// cards in the draw pile (ordered)
				"t1cards":[],					// team 1 win pile
				"t2cards":[],					// team 2 win pile
			},
			"trick":0,							// trick number
			"bets":[],							// list of bets (ordered)

			// discordy updaty infoy
			"msg":null,							// lists the display message to be updated					
		}
	) 
}

function isCinch() {

}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cinch')
		.setDescription('Used to interact with the game cinch')  
		.addSubcommand(subcommand => subcommand
			.setName("start")
			.setDescription("start a new game"))      
		.addSubcommand(subcommand => subcommand
			.setName("stop")
			.setDescription("stops the game")),
	async execute(interaction, bot) {
		switch(interaction.options.getSubcommand()) {
			case ('start'):
				// creates a new game:
				// sets up a json object in bot
				// adds the first player
				break;
			case ('stop'):
				// YEETS everything and stops the game
				break;
		}
	},
};