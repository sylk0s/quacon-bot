const fs = require('fs');

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
    var minutes = 5;
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
                    spreadsheetId: "1m05DvWgB5R8lcghH2seIiKTuDpVTQkFDeWkDrvkCBkI",
                    range: "A:D",
                });
        
                // All of the answers
                const answers = [];
        
                // Set rows to equal the rows
                const rows = res.data.values;
        
                // Check if we have any data and if we do add it to our answers array
                if (rows.length > application_data.checked) {
        
                    // Remove the headers
                    rows.shift();
        
                    // For each row
                    for (let i = application_data.checked; i <= rows.length; i++) {
                        // handle application
                        // this may be off by one or something, ill fix l8r
                        console.log(rows[i]);
                        i++
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