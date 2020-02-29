#!/usr/bin/env node
const express = require('express');
const package = require('./package.json');
const cron = require('cron').CronJob;
const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");
const moment = require('moment');
const exhbs = require('express-handlebars');
const zipFolder = require('zip-folder')
const homedir = require('os').homedir();
const datadir = homedir
const backupsdir = path.join(homedir, 'backups')

const fileProvider = require('./provider.js')

const config = require(path.join(datadir, 'config.json'))

const app = express();
app.engine('hbs', exhbs({defaultLayout:''}))
app.set('view engine', 'hbs')


const valString = config.db.host + ':' + config.db.port + ':' + config.db.database + ':' + config.db.username + ':' + config.db.password
fs.writeFile(path.join(homedir, '.pgpass'), valString, (err)=>{});
exec('chmod 0600 ' + path.join(homedir, '.pgpass'));

//Job setup
const job = new cron('0 * * * *', function(){
    downloadBackup()
}, null, true)
job.start();

app.get('/', function(req, res){
    var days = {};

    files = fileProvider.allData()

    files.forEach(function(f){
        if (days[f.day] != null) {
            days[f.day].backups.push(f)
        } else {
            const mom = f.date
            days[f.day] = {title:f.day, backups:[f], downloadstring:'/bulk/download/day?month='+(mom.month()+1)+'&day='+mom.date()+'&year='+mom.year(), delstring:'/bulk/delete/day?month='+(mom.month()+1)+'&day='+mom.date()+'&year='+mom.year(), id:mom.format('MMMM-DD-YYYY')}
        }
    })
    res.render('backups.hbs', {files:files, days:days})
})
app.get('/capture', function(req, res){
    const timestamp = moment()
    const command = 'pg_dump -h ' + config.db.host + ' -p ' + config.db.port + ' -U ' + config.db.username + ' ' + config.db.database + ' > ' + path.join(backupsdir, timestamp.toISOString() + '.bak');
    exec(command, (err, stdout, stderr) => {
        res.send(true)
    })
})
app.get('/bulk', function(req, res){
    res.render('bulk.hbs')
})
app.get('/bulk/delete/day', function(req, res) {
    var fss = fileProvider.day(req.query.day, req.query.month, req.query.year)
    fss.forEach(function(f){
        fs.unlinkSync(path.join(backupsdir, f.filename))
    });
    res.redirect('/')
})
app.get('/bulk/delete/month', function(req, res) {
    var fss = fileProvider.month(req.query.month, req.query.year)
    fss.forEach(function(f){
        fs.unlinkSync(path.join(backupsdir, f.filename))
    });
    res.redirect('/')
})
app.get('/bulk/delete/year', function(req, res) {
    var fss = fileProvider.year(req.query.year)
    fss.forEach(function(f){
        fs.unlinkSync(path.join(backupsdir, f.filename))
    });
    res.redirect('/')
})
app.get('/bulk/download/day', async function(req, res){
    var q = fileProvider.queryMomentForDay(req.query.day, req.query.month, req.query.year)
    var dumpPath = path.join(datadir, q.format('MMMM Do YYYY - ' + makeRandom(3)))
    fs.mkdirSync(dumpPath)

    var fss = fileProvider.day(req.query.day, req.query.month, req.query.year)
    fss.forEach(function(f){
        var mom = moment(f.filename.replace('.bak', ''))
        fs.copyFileSync(path.join(backupsdir, f.filename), path.join(dumpPath, mom.format('YYYY-MM-DD HH:mm') + '.bak'))
    })
    zipFolder(dumpPath, path.join(dumpPath + '.zip'), function(err){
        res.download(path.join(dumpPath + '.zip'))
    })
})
app.get('/delete/:file', function(req, res){
    fs.unlinkSync(path.join(backupsdir, req.params.file + '.bak'))
    res.redirect('/')
})
app.get('/download/:file', function(req, res){
    var date = moment(req.params.file)
    res.download(path.join(backupsdir, req.params.file + '.bak'), date.format('YYYY-DD-MM hh-mm-ss') + '.bak')
})
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

function makeRandom(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

console.log('Verifying settings - creating test backup.')
downloadBackup()
app.listen(5101);
console.log('Live at port 5101.')