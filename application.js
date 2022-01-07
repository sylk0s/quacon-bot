const { exec } = require('child_process');
const fs = require('fs');
const { config } = require('./config.json')

if (fs.existsSync('./application_data.json')) {

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

    const { google } = require("googleapis");

    const service = google.sheets("v4");
    const credentials = require("./credentials.json");

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
                    spreadsheetId: config.spreadsheetId,
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
                        // handle application
                        // this may be off by one or something, ill fix l8r
                        executed++;
                        // check always increases by the full length, prints 1 too many
                        console.log(i);
                        console.log(rows[i]);
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