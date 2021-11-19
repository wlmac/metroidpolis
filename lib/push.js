const axios = require('axios').default;
const Discord = require('discord.js');
const fs = require('fs');
const arrayLib = require('./array');

module.exports.start = (client) => {
    let rawd2 = fs.readFileSync('./data/cache.json');
    let parsed2 = JSON.parse(rawd2);
    refreshCache().then(() => {
        let rawd = fs.readFileSync('./data/cache.json');
        let parsed = JSON.parse(rawd);
        let prawd = fs.readFileSync('./data/data.json');
        let pparsed = JSON.parse(prawd);
        //compare
        let sendlist = compareAnnouncements(parsed2, parsed);
        propogate(pparsed.push, sendlist, client);
    })
}

function refreshCache() {
    return new Promise((resolve, reject) => {
        axios.get('https://maclyonsden.com/api/announcements').then(res => {
            try {
                let rawd = JSON.stringify(res.data);
                fs.writeFileSync('./data/cache.json', rawd);
                resolve();
            }
            catch (e) {
                reject(e);
            }
        }).catch(err => reject(err));
    })
}

function compareAnnouncements(cached, received) {
    let difflist = [];
    received.forEach(e => {
        let indx = arrayLib.getElementByProperty(cached, "id", e.id);
        if (indx == -1) {
            e.recStatus = "new"; //new announcement to propogate
            difflist.push(e);
        }
        else {
            if (JSON.stringify(e) != JSON.stringify(cached[indx])) { //hacky comparison
                e.recStatus = "edited";
                difflist.push(e);
            }
        }
    });
    return difflist;
}

function propogate(sublist, difflist, client) {
    let embedlist = [];
    difflist.forEach(e => {
        let embed = new Discord.MessageEmbed();
        let tags = 'No tags';
        if (e.tags.length > 0) {
            let tagarr = [];
            e.tags.forEach(e => {
                tagarr.push(`\`${e.name}\``);
            });
            tags = tagarr.join(', ');
        }
        let desc = `\n**${e.title}**\n\n${e.body}`;
        embed.setAuthor(`${e.author.slug}`, '', `https://maclyonsden.com/user/${e.author.slug}`);
        embed.setTitle(`${e.recStatus == "new" ? "New" : "Edited"} announcement from ${e.organization.slug}`.toUpperCase());
        embed.setDescription(`${desc.substring(0, 2000)}${(desc.length > 2000) ? '...' : ''}\n\n\n`);
        embed.setURL(`https://maclyonsden.com/announcement/${e.id}`);
        embed.setColor(`${e.tags[0] ? e.tags[0].color.slice(1) : '36314a'}`);
        embed.addField(`Club`, `[${e.organization.slug}](https://maclyonsden.com/club/${e.organization.slug})`, true);
        embed.addField(`Tags`, `${tags}`, true);
        embed.addField(`Create & Edit Date`, `Creation: ${new Date(`${e.created_date}`).toLocaleString()}\nEdited: ${new Date(`${e.last_modified_date}`).toLocaleString()}`, true);
        embed.setFooter('Metroidpolis Bot by ApocalypseCalculator');
        embedlist.push(embed);
    });
    let ctr = 0;
    let interval = setInterval(function () {
        if(ctr >= sublist.length) {
            clearInterval(interval);
        }
        client.channels.fetch(sublist[ctr].channelid).then(channel => {
            try {
                channel.send({ embeds: embedlist });
            }
            catch { }
        }).catch();
        ctr++;
    }, 1000)
}