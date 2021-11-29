const fs = require('fs');
const arrayHelpers = require('../lib/array');
const Discord = require('discord.js');

exports.name = 'serverdata';
exports.helpArgs = '';
exports.helpText = 'Show server announcements channel and filter if applicable';
exports.permReq = "none";
exports.verify = function (msg) {
    return true;
}

exports.execute = function (msg, args, client) {
    let rawdata = fs.readFileSync('./data/data.json');
    let parsed = JSON.parse(rawdata);
    let gpos = arrayHelpers.getElementByProperty(parsed.push, "guildid", msg.guildId);
    if (gpos == -1) {
        msg.channel.send('Server does not have announcements forwarding set up');
    }
    else {
        let embed = new Discord.MessageEmbed();
        embed.setTitle(`Server Data for ${msg.guild.name}`);
        embed.setDescription(`Current announcements forwarding channel: <#${parsed.push[gpos].channelid}>\n**Filter Settings**\n${(parsed.push[gpos].filter) ? `Current filter setting is \`${parsed.push[gpos].filter.listing} ${parsed.push[gpos].filter.type}: ${parsed.push[gpos].filter.content.join(',')}\`. (exclusive means a blacklist, inclusive is whitelisting)` : 'No filter settings applied. '}\n**Edited Announcements Settings**\n${(parsed.push[gpos].editsettings) ? parsed.push[gpos].editsettings : "None"}\n**Mention Settings**\n${msgifyMentions(parsed.push[gpos].mentions)}`);
        msg.channel.send({embeds: [embed]}).catch(err => msg.channel.send('Your server settings is too large to be displayed'));
    }
}

function msgifyMentions(list) {
    if(!list) {
        return `No mentions settings applied`
    }
    let str = '';
    list.forEach(e => {
        str+=`${e.id} : ${listMentions(e.pingtargets)}\n`;
    })
    return str;
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