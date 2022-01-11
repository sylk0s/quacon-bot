const fs = require('fs');
const fsp = require('fs').promises;
const config = require('./config.json');

const { google } = require("googleapis");

const service = google.sheets("v4");
const credentials = require("./credentials.json");

// Runs in the background checking for new applications every x mintues
function checkForApps(bot) {
    console.log('Checking for apps now')
    if (fs.existsSync('./appdata.json')) {
        // aaa
    } else {
        // stupid issue storing emojis in json bruh
        let appdata = {
            checked: 0,
            appCategory:'',
            newAppChannel:'',
            confirmEmote:"✅",
            voteEmote:"🇻",
            memberEmote:"🇲",
            denyEmote:"❌",
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

                const string = fs.readFileSync('./appdata.json',{encoding: 'utf8', flag:'r'});
                const appdata = JSON.parse(string);
        
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
            
                // All of the answers
                const answers = [];
        
                // Set rows to equal the rows
                const rows = res.data.values;
            
                // Check if we have any data and if we do add it to our answers array
                if (rows.length > appdata.checked+1) {
        
                    // Remove the headers
                    rows.shift();

                    // For each row
                    let executed = 0;
                    for (let i = appdata.checked; i < rows.length; i++) {
                        executed++;
                        const message = await bot.channels.cache.get(getAppChannel()).send('Detected ' + rows[i][1])
                        
                        console.log(appdata.confirmEmote);

                        await message.react(appdata.confirmEmote);
                        await message.react(appdata.denyEmote);
                        let app = parseJSONToApp(rows[i]);
                        app.messageID = message.id;
                        appdata.applications.push(app);
                        if (i == rows.length-1) {
                            appdata.checked += executed;
                            fs.writeFileSync('./appdata.json', JSON.stringify(appdata));
                        }
                    }
                } else {
                    console.log("No new data found.");  
                }
            
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
        voteID: "", // id for the vote message - will also use as unique id for votes
    }
}

// Creates CV like image to post
function parseJSONToImage(appInput) {

}

// Approves application for useage
function approveApplication(id, c1, c2, confirmedBy) {
    let index = getApplicationIndexFromID(id);
    let data = fs.readFileSync('appdata.json');
    let apps = JSON.parse(data);
    let app = apps.applications[index];
    app.confirmedBy = confirmedBy;
    app.confirmed = true;
    app.appChannel = c1;
    app.appDiscussionChannel = c2;
    fs.writeFileSync('./appdata.json', JSON.stringify(apps));
}

// Uses message id to get the applications index from the application list
function getApplicationIndexFromID(id) {
    let data = fs.readFileSync('appdata.json');
    let apps = JSON.parse(data);
    for (let i = 0; i < apps.applications.length; i++) { //(application in apps.applications) {
        if (apps.applications[i].messageID == id) {
            return i;
        }
    }
}

// Creates the vote using linking and the app object
function createApplicationVote() {

}

// Confirms membership for an incoming applicant
function confirmMembership() {

}

function getAppCategory() {
    let data = fs.readFileSync('appdata.json');
    let appConf = JSON.parse(data);
    return appConf.appCategory;
}

function getAppChannel() {
    let data = fs.readFileSync('appdata.json');
    let appConf = JSON.parse(data);
    return appConf.newAppChannel;
}

function getAppNameFromID(id) {
    let data = fs.readFileSync('appdata.json');
    let appConf = JSON.parse(data);
    return appConf.applications[getApplicationIndexFromID(id)].applicant;
}

function appExists(id) {
    if (typeof getApplicationIndexFromID(id) === 'undefined') {
        return false;
    }
    return true;
}

function handleReaction(reaction, user) {
    let data = fs.readFileSync('appdata.json');
    let appConf = JSON.parse(data);

    switch(reaction.emoji.name) {
        // Approve initial application
        case (appConf.confirmEmote):
            let c1 = '';
            let c2 = ''; 
            reaction.message.guild.channels.create(getAppNameFromID(reaction.message.id) + "-application" ).then( channel => {
                channel.setParent(getAppCategory());
                c1 = channel.id;
            });
            reaction.message.guild.channels.create(getAppNameFromID(reaction.message.id) + "-discussion" ).then( channel => {
                channel.setParent(getAppCategory());
                c2 = channel.id;
            });
            approveApplication(reaction.message.id, c1, c2, user.id);
            break;
        
        // Create application vote
        case (appConf.voteEmote):
            break;
        
        // Approve for archive and membership
        case (appConf.memberEmote):
            break;

        // deny and wipe application record
        case (appConf.denyEmote ):
            break;
    }
}

module.exports = { checkForApps, appExists, handleReaction };