const { loadEnvFile } = require('node:process');

loadEnvFile();

module.exports = {
    prefix: process.env.PREFIX,
    queryLimit: parseInt(process.env.QUERY_LIMIT), // tracks the x most recent announcements
    token: process.env.TOKEN,
    url: process.env.URL,
    interval: 1000 * 60 * 2,
    footerIconURL: `${process.env.URL}/static/core/img/logo/logo-any-96.png`
}