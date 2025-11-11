const fs = require('fs');
const arrayHelpers = require('../lib/array');
const { PermissionFlagsBits } = require("discord.js")

exports.name = 'editsettings';
exports.helpArgs = '[normal or noping or none]';
exports.helpText = 'Settings for edited announcements forwarding';
exports.permReq = "manage server";
exports.verify = function (msg) {
    return msg.member.permissions.has(PermissionFlagsBits.ManageGuild);
}

exports.execute = function (msg, args, client) {
    if (args[0] == "normal" || args[0] == "noping" || args[0] == "none") {
        let rawdata = fs.readFileSync('./data/data.json');
        let parsed = JSON.parse(rawdata);
        let gpos = arrayHelpers.getElementByProperty(parsed.push, "guildid", msg.guildId);
        if (gpos == -1) {
            msg.channel.send('Announcements forwarding is not set up');
        }
        else {
            parsed.push[gpos].editsettings = args[0];
            let newraw = JSON.stringify(parsed);
            fs.writeFileSync('./data/data.json', newraw);
            msg.channel.send(`Set edited announcements forwarding settings to ${args[0]}`);
        }
    }
    else {
        msg.channel.send('Incorrect or missing arguments, refer to help arguments');
    }
}