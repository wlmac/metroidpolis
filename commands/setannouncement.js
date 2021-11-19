const fs = require('fs');
const arrayHelpers = require('../lib/array');

exports.name = 'setannouncement';
exports.helpArgs = '[channel mention]';
exports.helpText = 'Sets the announcement forwarding channel for this server';
exports.permReq = "manage server";
exports.verify = function (msg) {
    return msg.member.permissions.has('MANAGE_GUILD');
}

exports.execute = function (msg, args, client) {
    if (msg.mentions.channels.size > 0 && msg.mentions.channels.first().isText()) {
        let rawdata = fs.readFileSync('./data/data.json');
        let parsed = JSON.parse(rawdata);
        let gpos = arrayHelpers.getElementByProperty(parsed.push, "guildid", msg.guildId);
        if (msg.mentions.channels.first().permissionsFor(client.user).has("SEND_MESSAGES")) {
            if (gpos == -1) {
                let newobj = {
                    channelid: msg.mentions.channels.first().id,
                    guildid: msg.guildId
                }
                parsed.push.push(newobj);
            }
            else {
                parsed.push[gpos].channelid = msg.mentions.channels.first().id;
            }
            let newraw = JSON.stringify(parsed);
            fs.writeFileSync('./data/data.json', newraw);
            msg.channel.send(`Successfully set new announcement channel to <#${msg.mentions.channels.first().id}>`);
        }
        else {
            msg.channel.send('Bot does not have permissions for this channel');
        }
    }
    else {
        msg.channel.send('Please specify which text channel you would like to set as the announcement forwarding channel');
    }
}