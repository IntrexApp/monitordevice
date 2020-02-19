#!/usr/bin/env node
const express = require('express');
const package = require('./package.json');
const cron = require('cron').CronJob;
const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");
const moment = require('moment');

const homedir = require('os').homedir();
const datadir = homedir
const backupsdir = path.join(homedir, 'backups')

const config = require(path.join(datadir, 'config.json'))

const app = express();


const valString = config.db.host + ':' + config.db.port + ':' + config.db.database + ':' + config.db.username + ':' + config.db.password
fs.writeFile(path.join(homedir, '.pgpass'), valString, (err)=>{});
exec('chmod 0600 ' + path.join(homedir, '.pgpass'));

//Job setup
const job = new cron('0 * * * *', function(){
    downloadBackup()
}, null, true)
job.start();

app.get('/about', function(req, res){
    res.send({status:true,version:package.version})
})


async function downloadBackup() {
    const exists = fs.existsSync(backupsdir)
    if (!exists) {
        fs.mkdirSync(backupsdir);
    }
    const timestamp = moment()
    const command = 'pg_dump -h ' + config.db.host + ' -p ' + config.db.port + ' -U ' + config.db.username + ' ' + config.db.database + ' > ' + path.join(backupsdir, timestamp.toISOString() + '.bak');
    exec(command, (err, stdout, stderr) => {
        console.log(stderr)
        console.log('Backup for ' + timestamp.format('MMMM Do YYYY, h:mm:ss a') + ' complete.')
    })
}

console.log('Verifying settings - creating test backup.')
downloadBackup()
app.listen(5101);
console.log('Live at port 5101.')