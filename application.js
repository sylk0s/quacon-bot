const fs = require('fs');
const fsp = require('fs').promises;
const config = require('./config.json');
const { google } = require("googleapis");
const service = google.sheets("v4");
const credentials = require("./credentials.json");
const voting = require('./commands/vote.js');

const confirmEmote="✅";
const voteEmote="🇻";   
const memberEmote="🇲";
const denyEmote="❌";   

function getConf() {
    let data = fs.readFileSync('appdata.json');
    let apps = JSON.parse(data);
    return apps;
}

// Runs in the background checking for new applications every x mintues
function checkForApps(bot) {
    console.log('Checking for apps now')
    if (!fs.existsSync('./appdata.json')) {

        // stupid issue storing emojis in json bruh
        let appdata = {
            checked: 0,
            appCategory:'',
            newAppChannel:'',
            archiveChannel:"",
            internRole:"",
            applications: [],
        };

        let data = JSON.stringify(appdata);
        fs.writeFileSync('appdata.json', data);
    }

        // Configure auth client
    const authClient = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key.replace(/\\n/g, "\n"),
        ["https://www.googleapis.com/auth/spreadsheets"]
    );

        // 5 minute timer thing
    var minutes = 1;
    setInterval(function() {
        console.log("I am doing my 5 minutes check");
            // do your stuff here

        (async function () {
            try {

                const conf = getConf(); 
                // Authorize the client
                const token = await authClient.authorize();
        
                // Set the client credentials
                authClient.setCredentials(token);
                    
                // Get the rows
                const res = await service.spreadsheets.values.get({
                    auth: authClient,
                    spreadsheetId: config.spreadsheetID,
                    range: "A:D", // determines the colums to grab
                });
                const rows = res.data.values;
            
                // Check if we have any data and if we do add it to our answers array
                if (rows.length > conf.checked+1) {
        
                    // Remove the headers
                    rows.shift();

                    // For each row
                    let executed = 0;
                    for (let i = conf.checked; i < rows.length; i++) {
                        executed++;
														
												const appChannel = await bot.channels.cache.get('933431313405452390'); // using temp channel id

                        const message = await bot.channels.cache.get(getAppChannel()).send('Detected ' + rows[i][1])
												const thread = await appChannel.threads.create({
															name: rows[i][1] + '-discussion',
															autoArchiveDuration:10080, // 1wk archive time
															reason: 'Private conversation about an applicant',
												});

                        await message.react(confirmEmote);
                        await message.react(denyEmote);

                        let app = parseJSONToApp(rows[i]);
                        app.messageID = message.id;
		    			app.thread = thread.id
                        conf.applications.push(app);

                        if (i == rows.length-1) {
                            conf.checked += executed;
                            fs.writeFileSync('./appdata.json', JSON.stringify(conf));
                        }
                    }
                } else {
                    console.log("No new data found.");  
                }
            // add more stuff here


            
            } catch (error) {
                console.log(error);
                    // Exit the process with error
                process.exit(1);
            }    
        })();
    }, minutes * 10 * 1000); // remember to change this back later :)  
}

// Creates JS object
function parseJSONToApp(appInput) {
    return application = {
        applicant: appInput[1], // discord name for applicant (ID?)
        startTime: appInput[0], // time form is submitted
        messageID:"", // Id for the main message
        confirmed: false, // approved for consideration
        confirmedBy:"", // ID of person who confirmed the app
        approved: false, // approved for intern
        approvedBy:"", // ID of person who approved the app
        appChannel: "", // id for application channel
        appDiscussionChannel: "", // id for discussion channel
        endTime: "", // time application is finished
    }
}

// Creates CV like image to post
function parseJSONToImage(appInput) {

}

// Approves application for useage
function approveApplication(id, c, confirmedBy) {
    let index = getApplicationIndexFromID(id);
    let conf = getConf();
    let app = conf.applications[index];
    app.confirmedBy = confirmedBy;
    app.confirmed = true;
    app.appChannel = c;
    fs.writeFileSync('./appdata.json', JSON.stringify(conf));
}

// Uses message id to get the applications index from the application list
function getApplicationIndexFromID(id) {
    let conf = getConf();
    for (let i = 0; i < conf.applications.length; i++) { //(application in apps.applications) {
        if (conf.applications[i].messageID == id) {
            return i;
        }
    }
}

// Confirms membership for an incoming applicant
async function confirmMembership(id, bot) {
    let conf = getConf();
    let application = conf.applications[getApplicationIndexFromID(id)];
    let role = bot.guilds.cache.get('822581610749886505').roles.cache.get(conf.internRole);
    let applicant = bot.users.cache.get('520407069183180802');
    // let applicant = bot.users.cache.find(u => u.tag === application.applicant);
    console.log(applicant);

    console.log('gave applicant the role');
    // cleanup here, just not yet
}

function getAppCategory() {
    return getConf().appCategory;
}

function getAppChannel() {
    return getConf().newAppChannel;
}

function getAppNameFromID(id) {
    return getConf().applications[getApplicationIndexFromID(id)].applicant; // noooo this breaks
}

function appExists(id) {
    if (typeof getApplicationIndexFromID(id) === 'undefined') {
        return false;
    }
    return true;
}

async function handleReaction(reaction, user, bot) {
    switch(reaction.emoji.name) {
        // Approve initial application
        case (confirmEmote):
                    confirmApplicant(reaction, user, bot);
            break;
        
        // Create application vote
        case (voteEmote):
            voting.saveApplicationVote(getAppNameFromID(reaction.message.id), " thing ", reaction.message);
            break;
        
        // Approve for archive and membership
        case (memberEmote):
            console.log('confiming membership');
            confirmMembership(reaction.message.id, bot);
            break;

        // deny and wipe application record
        case (denyEmote):
            cleanup(reaction.message.id, bot);
            break;
    }
}

async function confirmApplicant(reaction, user, bot) {
		const name = getAppNameFromID(reaction.message.id)     
		reaction.message.react(voteEmote);
		const appChannel = await bot.channels.cache.get('933431313405452390'); // using temp channel id
            
        reaction.message.guild.channels.create(getAppNameFromID(reaction.message.id) + "-application" ).then( channel => {
                channel.setParent(getAppCategory());
				approveApplication(reaction.message.id, channel.id, user.id);
        });
}

async function updateFromVote(id, passed, bot) {
    let conf = getConf();
    let vote = getAppNameFromID(id);
    if(passed) {
        let msg = await bot.channels.cache.get(conf.newAppChannel).messages.fetch(id);
        msg.react(memberEmote);
    }
}

// an alternate idea here would be to edit the og message and link to the message archive
// end and save the app at any point
// fix early exit btw
async function cleanup(id, bot) {
    console.log('cleaning up');
    let conf = getConf();
    let index = getApplicationIndexFromID(id);
    let app = conf.applications[index];
    // here we archive stuff later
    await bot.channels.cache.get(conf.newAppChannel).messages.fetch(id).then(msg =>  msg.delete());
    await bot.channels.cache.get(app.appChannel).delete();
    await bot.channels.cache.get(app.appDiscussionChannel).delete();//will need to change this
    conf.applications.splice(index--,1);
    fs.writeFileSync('./appdata.json', JSON.stringify(conf));
}

module.exports = { checkForApps, appExists, handleReaction, updateFromVote };
