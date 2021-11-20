const push = require('./lib/push');

console.log('Starting...');
push.refreshCache().then(() => {
    console.log('Synced announcements');
}).catch(err => console.log('Error occurred'));