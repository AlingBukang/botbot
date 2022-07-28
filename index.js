// Load environment variables from `.env` file (optional)
require('dotenv').config();

const http = require('http');
const express = require('express');
const request = require('request');
const LocalStorage = require('node-localstorage').LocalStorage;

const signingSecret =  process.env.signingSecret;

const { createEventAdapter } = require('@slack/events-api');
const { webClient } = require('@slack/web-api');

const postMsgURL = "https://slack.com/api/chat.postMessage";
const slackChannelID = "CRXTNFK5M"; //"GFFQ40ZUJ";
const authHeader = "Bearer "+process.env.authHeader;
const respTeam = {};

// Initialize event adapter using signing secret 
const slackEvents = createEventAdapter(signingSecret, {
  includeBody: true
});

// Initialize an Express application
const app = express();
const router = express.Router();

//Plug the event adapter into the express app as middleware
app.use('/slack/events', slackEvents.expressMiddleware());

slackEvents.on('message', (message, body) => {
  if (message.text == 'Services Failing Healthcheck') { 
    //var ts = message.ts; for later

    const json = message.attachments[0].fields[0].value;
    const obj = JSON.parse(json.slice(1, -1));

    console.log("Team.." +obj.Team);

    // Initialize a client
    //const slack = getTeamChannel(obj.Team);
    // Handle initialization failure
    // if (!slack) {
    //   return console.error("Team doesn't exist.. Add team to db for future user. For now, ping " + obj.Team + " manually.");
    // }

    (async () => {
      try {
        postMsg(obj.Healthcheckname, obj.Team);
        // Respond to the message back in the same channel
        //const response = await slack.chat.postMessage({ channel: message.channel, text: `Hello <@${message.user}>! :tada:` });
      
      } catch (error) {
        console.log("Error here..." +error);
      }
    })();
  }
});

//store team channels here
// function getTeamChannel(teamName) {
//     if (!respTeam[teateamNamemId] && botAuthorizationStorage.getItem(teamName)) {
//         respTeam[teamName] = new WebClient(botAuthorizationStorage.getItem(teamName));
//     }
//     if (respTeam[teamName]) {
//         return respTeam[teamName];
//     }
//     return null;
// }

function postMsg(name, team) {
    let headers = {
        "Content-Type": "application/json",
        "accept": "application/json",
        "Authorization": authHeader
    };
      
    let options = {
        url: postMsgURL,
        headers: headers
    }

    options['body'] = JSON.stringify(
        {
            "channel": slackChannelID,
            "text": "Hello, @" + team + "! " + name + " is failing healthcheck...",
            "as_user": true
        }
    );

    request.post(options,
        function(err, response, body) {
            //console.log("response: " + response);
            if (response.statusCode == 200) {
                var data = JSON.parse(body);
                //console.log("message id: " + data);
            } else {
                console.log("Error response: " + response.statusCode + ": " + response.statusMessage);
            }
        }
    );
}

// Start the express application
const port = process.env.PORT || 8080;
http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});