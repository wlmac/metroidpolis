const changelog = 'Metroidpolis has been updated!\n\nYou can now add a filter onto announcements forwarding, this way you can whitelist or blacklist certain tags or clubs. See m&help for more details!';


const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
const tokens = require('./data/token');

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
                    channel.send(changelog);
                }
                catch {}
            }).catch((err) => console.log(err));

            ctr++;
        }
    }, 2000)
}

client.login(tokens.token);