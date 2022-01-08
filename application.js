const fs = require('fs');
const config = require('./config.json')

const { google } = require("googleapis");

const service = google.sheets("v4");
const credentials = require("./credentials.json");

function checkForApps(bot) {
    console.log('Checking for apps now')
    if (fs.existsSync('./application_data.json')) {
        // aaa
    } else {
        let application_data = {
            checked: 0
        };

        let data = JSON.stringify(application_data);
        fs.writeFileSync('application_data.json', data);
    }

    fs.readFile('./application_data.json', 'utf8', (err, jsonString) => {
        if (err) {
            console.log("File read failed:", err)
            return
        } 

        const application_data = JSON.parse(jsonString);

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
            
                    // Authorize the client
                    const token = await authClient.authorize();
            
                    // Set the client credentials
                    authClient.setCredentials(token);
            
                    // Get the rows
                    const res = await service.spreadsheets.values.get({
                        auth: authClient,
                        spreadsheetId: "1m05DvWgB5R8lcghH2seIiKTuDpVTQkFDeWkDrvkCBkI",// burh config.spreadsheetId,
                        range: "A:D", // determines the colums to grab
                    });
            
                    // All of the answers
                    const answers = [];
            
                    // Set rows to equal the rows
                    const rows = res.data.values;
            
                    // Check if we have any data and if we do add it to our answers array
                    if (rows.length > application_data.checked+1) {
            
                        // Remove the headers
                        rows.shift();

                        // For each row
                        let executed = 0;
                        for (let i = application_data.checked; i < rows.length; i++) {
                            executed++;
                            console.log(i);
                            console.log(rows[i]);
                            // TODO
                            // this will post the application in the channel with a check reaction to confirm it's validity
                            // will parse into pdf as well
                            const message = await bot.channels.cache.get('927417403997040651').send('Detected ' + rows[i][1])
                            await message.react("🧇");
                            bot.apps1.push(message.id);
                            if (i == rows.length-1) {
                                application_data.checked += executed;
                                fs.writeFile('./application_data.json', JSON.stringify(application_data), function writeJSON(err) {
                                    if (err) return console.log(err);
                                    console.log(JSON.stringify(application_data));
                                    console.log('writing to ./application_data.json');
                                });
                            }
                        }
            
                    } else {
                        console.log("No new data found.");  
                    }
            
                } catch (error) {
            
                    // Log the error
                    console.log(error);
            
                    // Exit the process with error
                    process.exit(1);
            
                }
            
            })();

        }, minutes * 60 * 1000);
    })
}

// called on new post
function parseJSONToApp(appInput) {
    return application = {
        applicant: "", // discord name for applicant (ID?)
        startTime: "", // time form is submitted
        confirmed: "", // approved for consideration
        approved: "", // approved for intern
        appChannel: "", // id for application channel
        appDiscussion: "", // id for discussion channel
        endTime: "", // time application is finished
        voteID: "", // id for the vote message - will also use as unique id for votes
    }
}

function parseJSONToImage(appInput) {

}

function approveApplication() {

}

function getApplicationFromID() {

}

function createApplicationVote() {

}

function confirmMembership() {

}

function getFunctionFromReaction() {

}

module.exports = { checkForApps };