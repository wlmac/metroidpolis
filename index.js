const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const config = require('./data/config');
const push = require('./lib/push');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

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
            .setDescription('[] denotes mandatory arguments, () denotes optional ones. If you need help, contact us [here](https://forms.gle/3sDQvVtAx1N7e1cb7).')
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

client.on('guildDelete', (guild) => {
    let rawd = fs.readFileSync('./data/data.json');
    let parsedd = JSON.parse(rawd);
    parsedd.push = parsedd.push.filter(e => e.guildid !== guild.id);
    let newraw = JSON.stringify(parsedd);
    fs.writeFileSync('./data/data.json', newraw);
})

client.on('guildCreate', (guild) => {
    if(guild.systemChannel && guild.systemChannel.viewable) {
        guild.systemChannel.send(`Hello!\nThank you for inviting ${client.user.username}. To get started, use \`${config.prefix}help\``);
    }
})

client.login(config.token);

setInterval(function () {
    push.start(client);
}, config.interval)