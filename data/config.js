require("dotenv").config();

module.exports = {
    prefix: process.env.PREFIX,
    period: process.env.PERIOD, // tracks the previous announcements between (now - period) and now (in ms)
    token: process.env.TOKEN,
    url: process.env.URL,
    interval: 1000 * 60 * 2,
    footerIconURL: `${process.env.URL}/static/core/img/logo/logo-any-96.png`
}