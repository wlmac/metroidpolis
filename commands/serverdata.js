const fs = require('fs');
const arrayHelpers = require('../lib/array');

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
        msg.channel.send(`Current announcements forwarding channel: <#${parsed.push[gpos].channelid}>\n${(parsed.push[gpos].filter) ? `Current filter setting is \`${parsed.push[gpos].filter.listing} ${parsed.push[gpos].filter.type}: ${parsed.push[gpos].filter.content.join(',')}\`. (exclusive means a blacklist, inclusive is whitelisting)` : 'No filter settings applied. '}`);
    }
}