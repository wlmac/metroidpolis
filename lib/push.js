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
    }).catch();
}

module.exports.refreshCache = refreshCache;

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
            if (e.last_modified_date != cached[indx].last_modified_date) {
                e.recStatus = "edited";
                difflist.push(e);
            }
        }
    });
    return difflist;
}

/**
 * Returns the alt and url of the first CommonMark image alternate text and URL.
 * @param src - is the CommonMark source to extract the data from.
 * @returns {?Object}
*/
function getImageURL(src) {
    return ((match = /\!\[[^\]]*\]\([^\)]*\)/.exec(src)) === null) ? null : {
        alt: (split = match[0].split(']('))[0].slice(2),
        url: split[1].slice(0, -1),
    };
}

function propogate(sublist, difflist, client) {
    let ctr = 0;
    let interval = setInterval(function () {
        if (!sublist[ctr]) {
            clearInterval(interval);
        }
        else {
            //construct embed list
            let embedlist = [];
            let pinglist = "";
            difflist.forEach(e => {
                let nosend = false;
                let embed = new Discord.MessageEmbed();
                let tags = 'No tags';
                if (e.tags.length > 0) {
                    let tagarr = [];
                    e.tags.forEach(e => {
                        tagarr.push(`\`${e.name}\``);
                    });
                    tags = tagarr.join(', ');
                    if (sublist[ctr].filter && sublist[ctr].filter.type == 'tag' && sublist[ctr].filter.listing == 'exclusive' && findInstanceOftag(tags, sublist[ctr].filter.content)) {
                        nosend = true; //if exclusively mentioned tag
                    }
                    else if (sublist[ctr].filter && sublist[ctr].filter.type == 'tag' && sublist[ctr].filter.listing == 'inclusive' && !findInstanceOftag(tags, sublist[ctr].filter.content)) {
                        nosend = true; //if inclusively mentioned tag
                    }
                }
                if (sublist[ctr].filter && sublist[ctr].filter.type == 'club' && sublist[ctr].filter.listing == 'exclusive' && sublist[ctr].filter.content.includes(e.organization.slug)) {
                    nosend = true;
                }
                else if (sublist[ctr].filter && sublist[ctr].filter.type == 'club' && sublist[ctr].filter.listing == 'inclusive' && !sublist[ctr].filter.content.includes(e.organization.slug)) {
                    nosend = true;
                }
                if (sublist[ctr].mentions && !nosend) {
                    sublist[ctr].mentions.forEach(x => {
                        if (x.type == "tag" && tags.includes(x.name)) {
                            pinglist += listMentions(x.pingtargets);
                        }
                        else if (x.type == "club" && e.organization.slug == x.name) {
                            pinglist += listMentions(x.pingtargets);
                        }
                    });
                }
                let desc = `\n**${e.title}**\n\n${e.body}`;
                embed.setAuthor(`${e.author.slug}`, '', `https://maclyonsden.com/user/${e.author.slug}`);
                embed.setTitle(`${e.recStatus == "new" ? "New" : "Edited"} announcement from ${e.organization.slug}`.toUpperCase());
                embed.setDescription(`${desc.substring(0, 2000)}${(desc.length > 2000) ? '...' : ''}\n\n\n`);
                if ((img = getImageURL(desc)) !== null) embed.setThumbnail(`https://maclyonsden.com${img.url}`); // TODO: how to add alt text to image?
                embed.setURL(`https://maclyonsden.com/announcement/${e.id}`);
                embed.setColor(`${e.tags[0] ? e.tags[0].color.slice(1) : '36314a'}`);
                embed.addField(`Club`, `[${e.organization.slug}](https://maclyonsden.com/club/${e.organization.slug})`, true);
                embed.addField(`Tags`, `${tags}`, true);
                embed.addField(`Create & Edit Date`, `Creation: ${new Date(`${e.created_date}`).toLocaleString("en-US", { timeZone: "EST" })}\nEdited: ${new Date(`${e.last_modified_date}`).toLocaleString("en-US", { timeZone: "EST" })}`, true);
                embed.setFooter('Metroidpolis Bot by Project Metropolis');
                if (!nosend) {
                    embedlist.push(embed);
                }
            });
            //send embed
            if (embedlist.length != 0) {
                client.channels.fetch(sublist[ctr].channelid).then(channel => {
                    try {
                        if (pinglist == "") {
                            channel.send({ embeds: embedlist });
                        }
                        else {
                            channel.send({ content: pinglist, embeds: embedlist });
                        }
                    }
                    catch { }
                }).catch();
            }
            ctr++;
        }
    }, 2000)
}

function findInstanceOftag(a1, a2) {
    for (let i = 0; i < a2.length; i++) {
        if (a1.includes(a2[i])) {
            return true;
        }
    }
    return false;
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