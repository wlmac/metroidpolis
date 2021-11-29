const changelog = `You can now add set pings for roles or users on announcements forwarding! In addition, there are new settings for edited announcements forwarding! See m&help for more details!`;


const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
const tokens = require('./data/token');
const package = require('./package.json');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}. Starting changelog push.`);
    start();
});

function start() {
    let prawd = fs.readFileSync('./data/data.json');
    let pparsed = JSON.parse(prawd);
    propogate(pparsed.push);
}

function propogate(sublist) {
    let ctr = 0;
    let interval = setInterval(function () {
        if (!sublist[ctr]) {
            clearInterval(interval);
        }
        else {
            let cid = sublist[ctr].channelid;
            client.channels.fetch(cid).then(channel => {
                try {
                    console.log(`Sent ${cid}`);
                    channel.send(`Metroidpolis has been updated to v${package.version}!\n\n${changelog}`);
                }
                catch {}
            }).catch((err) => console.log(err));

            ctr++;
        }
    }, 2000)
}

client.login(tokens.token);