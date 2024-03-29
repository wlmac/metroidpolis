const axios = require('axios').default;
const Discord = require('discord.js');
const fs = require('fs');
const arrayLib = require('./array');
const config = require('../data/config');

module.exports.start = (client) => {
    // read cached values before refresh
    let rawd2 = fs.readFileSync('./data/cache.json');
    let parsed2 = JSON.parse(rawd2);

    staleCache(parseInt(parsed2.lastupdate)).then((stale) => {
        if (stale) {
            refreshCache().then(() => {
                // read cached values after refresh
                let rawd = fs.readFileSync('./data/cache.json');
                let parsed = JSON.parse(rawd);
                let prawd = fs.readFileSync('./data/data.json'); // data such as propagation targets
                let pparsed = JSON.parse(prawd);
                //compare
                let sendlist = compareAnnouncements(parsed2.results, parsed.results);
                propagate(pparsed.push, sendlist, client);
            }).catch();
        }
    });
}

async function staleCache(lastupdate) {
    let res = await axios.head(`https://maclyonsden.com/api/v3/obj/announcement?limit=${config.queryLimit}`);
    return new Date(res.headers['last-modified']).getTime() > lastupdate;
}

module.exports.refreshCache = refreshCache;

function refreshCache() {
    return new Promise((resolve, reject) => {
        axios.get(`https://maclyonsden.com/api/v3/obj/announcement?limit=${config.queryLimit}`).then(res => {
            try {
                let rawd = JSON.stringify({ lastupdate: Date.now(), results: res.data.results });
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
            e.recStatus = "new"; //new announcement to propagate
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

// this function takes the description src
// and returns an array of the image objects (.images) (with alt and src)
// as well as a reformatted description (.result) that is Discord-embed friendly
function processImages(src) {
    const captureRegex = /!\[(?<alt>[^\]\[\r\n]*?)\]\((?<url>[^\s\(\)\r\n]*?)\)/g;
    // very funky regex I built
    // use https://regexr.com/ for a breakdown
    // 2 named capture groups "alt" and "url", self explanatory

    let images = [];
    let result = src.replaceAll(captureRegex, (strmatch, i) => {
        let image = {
            alt: '',
            url: ''
        }
        // this is a real sketchy thing going on tbh
        for(let match of strmatch.matchAll(captureRegex)) {
            image = {
                alt: `${match.groups.alt}`,
                url: match.groups.url.startsWith("http") ? match.groups.url : new URL(match.groups.url, `https://maclyonsden.com`).href
            }
            images.push(image);
        }
        return `[${image.alt.length == 0 ? "captionless image" : image.alt}](${image.url})`;
    });
    return {
        images: images,
        desc: result
    };
}

function propagate(sublist, difflist, client) {
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
                if (sublist[ctr].editsettings && sublist[ctr].editsettings == "none") {
                    nosend = true;
                }
                if (sublist[ctr].mentions && !nosend && !(sublist[ctr].editsettings && sublist[ctr].editsettings == "noping")) {
                    sublist[ctr].mentions.forEach(x => {
                        if (x.type == "tag" && tags.includes(x.name)) {
                            pinglist += listMentions(x.pingtargets);
                        }
                        else if (x.type == "club" && e.organization.slug == x.name) {
                            pinglist += listMentions(x.pingtargets);
                        }
                    });
                }
                embed.setAuthor(`${e.author.first_name} ${e.author.last_name}`, `https://maclyonsden.com${e.organization.icon}`, `https://maclyonsden.com/user/${e.author.username}`);
                embed.setTitle(`${e.recStatus == "new" ? "" : "Edited:"} ${e.title}`.toUpperCase());
                let {images, desc} = processImages(`\n\n${e.body}`);
                if (images.length > 0) {
                    embed.setThumbnail(images[0].url);
                }
                embed.setDescription(`${desc.substring(0, 2000)}${(desc.length > 2000) ? '...' : ''}\n\n\n`);
                embed.setURL(`https://maclyonsden.com/announcement/${e.id}`);
                embed.setColor(`${e.tags[0] ? e.tags[0].color.slice(1) : '36314a'}`);
                embed.addField(`Club`, `[${e.organization.name}](https://maclyonsden.com/club/${e.organization.slug})`, true);
                embed.addField(`Tags`, `${tags}`, true);
                embed.addField(`Create & Edit Date`, `Creation: <t:${new Date(`${e.created_date}`).getTime() / 1000 | 0}>\nEdited: <t:${new Date(`${e.last_modified_date}`).getTime() / 1000 | 0}>`, true);
                //hardcoded icon URL
                embed.setFooter('Metroidpolis Bot by Project Metropolis', 'https://maclyonsden.com/static/core/img/logo/logo-any-96.png');
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