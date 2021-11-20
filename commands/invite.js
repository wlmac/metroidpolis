const fs = require('fs');
const arrayHelpers = require('../lib/array');

exports.name = 'invite';
exports.helpArgs = '';
exports.helpText = 'Generate invite link for bot';
exports.permReq = "";
exports.verify = function (msg) {
    return true;
}

exports.execute = function (msg, args, client) {
    msg.channel.send(`Here is my invite link!\n<https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot>`);
}