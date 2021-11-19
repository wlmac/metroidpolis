const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
const tokens = require('./data/token');
const config = require('./data/config');
const push = require('./lib/push');

var commands = {};
fs.readdirSync('./commands/').forEach(function (file) {
    let m = require('./commands/' + file);
    if (m.name == null || m.helpArgs == null || m.helpText == null || m.execute == null || m.verify == null || m.permReq == null) {
        console.error(`\x1b[31mInvalid command: ${file}\x1b[0m`);
    }
    else if (m.name in commands) {
        console.error(`\x1b[31mDuplicate command name: ${file} (${m.name})\x1b[0m`)
    }
    else {
        commands[m.name] = m;
        console.log(`Loaded command: ${file} (${m.name})`);
    }
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setPresence({
        activities: [{
            name: `${config.prefix}help for commands`,
            type: 'WATCHING'
        }],
        status: 'online'
    });
});

client.on('message', msg => {
    if (!msg.content.startsWith(config.prefix) || msg.author.bot || msg.channel.type == 'dm') return;
    if (msg.mentions.members.has(client.user.id) && msg.content.length <= 4 + client.user.id.length) {
        msg.channel.send(`Hey ${msg.member.nickname}, you can use \`${config.prefix}help\` to view my command list!`);
        return;
    }
    const args = msg.content.slice(config.prefix.length).trim().split(' ');
    const command = args.shift().toLowerCase();
    if (command === 'help') {
        var embed = new Discord.MessageEmbed()
            .setTitle('Command List')
            .setDescription('[] denotes mandatory arguments, () denotes optional ones')
            .addField(`${config.prefix}help`, `Shows this help menu`);
        for (var commandName in commands) {
            var cmd = commands[commandName];
            if (!cmd.verify(msg)) continue;
            embed = embed.addField(`${config.prefix}${cmd.name} ${cmd.helpArgs}`.trim(), cmd.helpText);
        }
        msg.channel.send({ embeds: [embed] });
    }
    else if (command in commands) {
        if (commands[command].verify(msg)) {
            try {
                commands[command].execute(msg, args, client);
            }
            catch {
                msg.channel.send('A fatal error occurred');
            }
        }
        else {
            msg.channel.send(`This command requires permission(s): \`${commands[command].permReq}\``);
        }
    }
    else {
        msg.channel.send('Command not found T_T');
    }
});

client.login(tokens.token);

setInterval(function () {
    console.log('Running announcement pushing script');
    push.start(client);
}, 1000 * 60 * 2)