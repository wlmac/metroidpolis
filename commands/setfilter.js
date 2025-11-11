const fs = require('fs');
const arrayHelpers = require('../lib/array');
const { PermissionFlagsBits } = require("discord.js")

exports.name = 'setfilter';
exports.helpArgs = '[inclusive or exclusive] [tag or club] [comma separated list, no spaces]';
exports.helpText = 'Apply a filter on announcements forwarding. Must use exact slug.';
exports.permReq = "manage server";
exports.verify = function (msg) {
    return msg.member.permissions.has(PermissionFlagsBits.ManageGuild);
}

exports.execute = function (msg, args, client) {
    if (args[0] && args[1] && args[2]) {
        if (args[0] == 'inclusive' || args[0] == 'exclusive') {
            if (args[1] == 'tag' || args[1] == 'club') {
                let rawdata = fs.readFileSync('./data/data.json');
                let parsed = JSON.parse(rawdata);
                let gpos = arrayHelpers.getElementByProperty(parsed.push, "guildid", msg.guildId);
                if (gpos == -1) {
                    msg.channel.send('Announcements forwarding is not set up!');
                }
                else {
                    if (parsed.push[gpos].filter) {
                        msg.channel.send(`Current filter setting \`${parsed.push[gpos].filter.listing} ${parsed.push[gpos].filter.type}: ${parsed.push[gpos].filter.content.join(',')}\` will be overwritten.`);
                    }
                    let filter = {
                        type: args[1],
                        listing: args[0],
                        content: args[2].split(',')
                    }
                    parsed.push[gpos].filter = filter;
                    let newraw = JSON.stringify(parsed);
                    fs.writeFileSync('./data/data.json', newraw);
                    msg.channel.send(`Filter setting \`${parsed.push[gpos].filter.listing} ${parsed.push[gpos].filter.type}: ${parsed.push[gpos].filter.content.join(',')}\` applied.`);
                }
            }
            else {
                msg.channel.send('Invalid arguments, refer to help arguments');
            }
        }
        else {
            msg.channel.send('Invalid arguments, refer to help arguments');
        }
    }
    else {
        msg.channel.send('Missing arguments, refer to help arguments');
    }
}