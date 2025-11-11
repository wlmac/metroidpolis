const fs = require('fs');
const arrayHelpers = require('../lib/array');
const Discord = require('discord.js');


exports.name = 'setnotifpings';
exports.helpArgs = '[tag or club] [the tag or club slug] [role or user mentions]';
exports.helpText = 'Sets roles or users to ping for specific tags or clubs.';
exports.permReq = "manage server";
exports.verify = function (msg) {
    return msg.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild);
}

exports.execute = function (msg, args, client) {
    if (args[0] && args[1]) {
        if (msg.mentions.roles.size > 0 || msg.mentions.members.size > 0) {
            if (args[0] != "tag" && args[0] != "club") {
                msg.channel.send('Invalid argument, first argument must be either `tag` or `club`');
            }
            else {
                let rawdata = fs.readFileSync('./data/data.json');
                let parsed = JSON.parse(rawdata);
                let gpos = arrayHelpers.getElementByProperty(parsed.push, "guildid", msg.guildId);
                if (gpos == -1) {
                    msg.channel.send('Announcements forwarding is not set up!');
                }
                else {
                    if (!parsed.push[gpos].mentions) {
                        parsed.push[gpos].mentions = [];
                    }
                    let mpos = arrayHelpers.getElementByProperty(parsed.push[gpos].mentions, "id", `${args[0]}:${args[1]}`);
                    let mention = {
                        name: args[1],
                        type: args[0],
                        id: `${args[0]}:${args[1]}`,
                        pingtargets: []
                    }
                    msg.mentions.roles.forEach(role => {
                        mention.pingtargets.push({ id: role.id, type: "role" });
                    })
                    msg.mentions.members.forEach(member => {
                        mention.pingtargets.push({ id: member.id, type: "user" });
                    })
                    let embed = new Discord.EmbedBuilder()
                    if (mpos == -1) {
                        parsed.push[gpos].mentions.push(mention);
                        embed.addFields(
                            {name: `Added Notif Ping`, value: `Set ${args[0]}:${args[1]} to mention ${listMentions(mention.pingtargets)}`}
                        );
                    }
                    else {
                        embed.addFields({
                            name: `Overwrote Notif Ping`, value: `Set ${args[0]}:${args[1]} to mention ${listMentions(mention.pingtargets)} (old notif ping is ${listMentions(parsed.push[gpos].mentions[mpos].pingtargets)})`}
                        );
                        parsed.push[gpos].mentions[mpos] = mention;
                    }
                    let newraw = JSON.stringify(parsed);
                    fs.writeFileSync('./data/data.json', newraw);
                    msg.channel.send({embeds: [embed]});
                }
            }
        }
        else {
            msg.channel.send('Please specify which text channel you would like to set as the announcement forwarding channel');
        }
    }
    else {
        msg.channel.send('Missing arguments, refer to help command for more info')
    }
}
function listMentions(list) {
    let str = '';
    list.forEach(e => {
        if (e.type == "user") {
            str += `<@!${e.id}> `;
        }
        else {
            str += `<@&${e.id}> `;
        }
    });
    return str;
}