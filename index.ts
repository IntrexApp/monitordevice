#!/usr/bin/env node

var testmode = false
if (process.argv.includes('--test')) {
    testmode = true
    console.log('Running in test mode..')
}

const express = require('express');
const pkg = require('../package.json');
const cron = require('cron').CronJob;
const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");
const moment = require('moment');
const exhbs = require('express-handlebars');
const zipFolder = require('zip-a-folder')
const homedir = require('os').homedir();
const diskspace = require('disk-space')
const foldersize = require('get-folder-size')
const del = require('del')
const datadir = homedir
const backupsdir = path.join(homedir, 'backups')
import * as fileProvider from './app/provider'
import * as favicon from 'serve-favicon'
import { arch } from 'os';
import { ConfigObject } from './app/model';
import { random } from './app/utility';
import { FileManager } from './app/files';
var config:ConfigObject = new ConfigObject()
const archivePath = path.join(datadir, 'archives')

const app = express();
app.engine('hbs', exhbs({defaultLayout:''}))
app.set('view engine', 'hbs')

app.use(favicon(path.join(__dirname, '..', 'assets', 'pgclone.png')))

if (!testmode) {
    require(path.join(datadir, 'config.json'))
    const valString = config.db.host + ':' + config.db.port + ':' + config.db.database + ':' + config.db.username + ':' + config.db.password
    fs.writeFile(path.join(homedir, '.pgpass'), valString, (err)=>{});
    exec('chmod 0600 ' + path.join(homedir, '.pgpass'));
}
if (config.appearance == null) {
    config.appearance = {color:"#4e16ed", title:"Monitor Device"}
}

//Job setup
const job = new cron('0 * * * *', function(){
    downloadBackup()
}, null, true)
job.start();

app.get('/', function(req, res){
    var days = {};

    var files = fileProvider.allData()

    files.forEach(function(f){
        if (days[f.day] != null) {
            days[f.day].backups.push(f)
        } else {
            const mom = f.date
            days[f.day] = {title:f.day, backups:[f], downloadstring:'/bulk/download/day?month='+(mom.month()+1)+'&day='+mom.date()+'&year='+mom.year(), delstring:'/bulk/delete/day?month='+(mom.month()+1)+'&day='+mom.date()+'&year='+mom.year(), id:mom.format('MMMM-DD-YYYY')}
        }
    })
    res.render('backups.hbs', {files:files, days:days, appearance:config.appearance})
})
app.get('/capture', function(req, res){
    const timestamp = moment()
    const command = 'pg_dump -h ' + config.db.host + ' -p ' + config.db.port + ' -U ' + config.db.username + ' ' + config.db.database + ' > ' + path.join(backupsdir, timestamp.toISOString() + '.bak');
    exec(command, (err, stdout, stderr) => {
        res.send(true)
    })
})
app.get('/maintenance', async function(req, res){
    const sizes = await FileManager.directorySpace()
    res.render('maintenance.hbs', {appearance:config.appearance, space:sizes})
})
app.get('/delete', function(req, res){
    res.render('bulk.hbs', {appearance:config.appearance})
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
    var dumpPath = path.join(archivePath, q.format('MMMM Do YYYY') + ' - ' + random())
    fs.mkdirSync(archivePath)
    fs.mkdirSync(dumpPath)

    var fss = fileProvider.day(req.query.day, req.query.month, req.query.year)
    fss.forEach(function(f){
        var mom = moment(f.filename.replace('.bak', ''))
        fs.copyFileSync(path.join(backupsdir, f.filename), path.join(dumpPath, mom.local().format('YYYY-MM-DD HH:mm') + '.bak'))
    })
    zipFolder.zipFolder(dumpPath, path.join(dumpPath + '.zip') ,function(err){
        res.download(path.join(dumpPath + '.zip'))
    })
})
app.get('/bulk/download/everything', function(req,res){
    var dumpPath = path.join(archivePath, 'Snapshot ' + moment().format('MMMM Do YYYY H-mm A') + '.zip')
    zipFolder.zipFolder(backupsdir, dumpPath ,function(err){
        res.download(path.join(dumpPath))
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
app.get('/about', async function(req, res){
    const space = await FileManager.directorySpace()
    res.send({status:true,version:pkg.version, space: space})
})

app.get('/internal/archives/clear', function(req, res){
    del([archivePath], {force:true}).then(function(d){
        console.log(d)
        res.redirect('/maintenance?success=1&message=Cleared!')
    })
})
app.get('/internal/config/download', function(req, res){
    res.download(path.join(datadir, 'config.json'))
})


async function downloadBackup() {
    if (!testmode) {
        const exists = fs.existsSync(backupsdir)
        if (!exists) {
            fs.mkdirSync(backupsdir);
        }
        const timestamp = moment().utc()
        console.log(timestamp.toISOString())
        const command = 'pg_dump -h ' + config.db.host + ' -p ' + config.db.port + ' -U ' + config.db.username + ' ' + config.db.database + ' > ' + path.join(backupsdir, timestamp.toISOString() + '.bak');
        exec(command, (err, stdout, stderr) => {
            console.log(stderr)
            console.log('Backup for ' + timestamp.format('MMMM Do YYYY, h:mm:ss a') + ' complete.')
        })
    }
}


console.log('Verifying settings - creating test backup.')
downloadBackup()
app.listen(5101);
console.log('Live at port 5101.')