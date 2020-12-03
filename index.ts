#!/usr/bin/env node
import { EnviromentMode }   from './app/enviroment'
const path = require('path');
if (process.argv.includes('--test')) {
    EnviromentMode.testMode = true
    console.log('Running in test mode..')
}
EnviromentMode.config = require(path.join((EnviromentMode.testMode == true) ? path.join(__dirname, '..') : require('os').homedir(), 'config.json'))
EnviromentMode.load()

import { DatabaseConfig, Paths } from './app/enviroment';
const express = require('express');
const pkg = require('../package.json');
const cron = require('cron').CronJob;
const { exec } = require("child_process");
const exhbs = require('express-handlebars');
import * as moment from 'moment'
import * as fs from 'fs'
import * as favicon from 'serve-favicon'
import { FileManager } from './app/files';
import { BackupManager, Backup } from './app/backups';
import { random } from './app/utility';

const app = express();
app.engine('hbs', exhbs({defaultLayout:''}))
app.set('view engine', 'hbs')

app.use(favicon(path.join(__dirname, '..', 'assets', 'pgclone.png')))

fs.writeFile(path.join(require('os').homedir(), '.pgpass'), DatabaseConfig.connectionString(EnviromentMode.config.db), (err)=>{});
exec('chmod 0600 ' + path.join(Paths.home, '.pgpass'));

//Job setup
const job = new cron(EnviromentMode.config.db.frequency ?? '0 * * * *', function(){
    downloadBackup()
}, null, true)
job.start();
console.log(`pgclone will automatically capture backups according to cron schedule ${EnviromentMode.config.db.frequency ?? '0 * * * *'}`)


app.get('/', function(req, res){
    var days = {};

    var files = BackupManager.limit(100)

    files.forEach(function(f){
        if (days[f.day] != null) {
            days[f.day].backups.push(f)
        } else {
            const mom = f.date
            days[f.day] = {title:f.day, backups:[f], downloadstring:'/bulk/download/day?month='+(mom.month()+1)+'&day='+mom.date()+'&year='+mom.year(), delstring:'/bulk/delete/day?month='+(mom.month()+1)+'&day='+mom.date()+'&year='+mom.year(), id:mom.format('MMMM-DD-YYYY')}
        }
    })
    res.render('backups.hbs', {files:files, days:days, appearance:EnviromentMode.config.appearance})
})
app.get('/capture', function(req, res){
    BackupManager.create(function() {
        res.send({status:true})
    })
})
app.get('/maintenance', async function(req, res){
    const sizes = await FileManager.directorySpace()
    const stats = BackupManager.stats()
    res.render('maintenance.hbs', {appearance:EnviromentMode.config.appearance, space:sizes, stats: stats})
})
app.get('/delete', function(req, res){
    res.render('bulk.hbs', {appearance:EnviromentMode.config.appearance})
})
app.get('/bulk/delete/day', function(req, res) {
    var fss = BackupManager.day(req.query.day, req.query.month, req.query.year)
    BackupManager.deleteBackups(fss)
    res.redirect('/')
})
app.get('/bulk/delete/month', function(req, res) {
    var fss = BackupManager.month(req.query.month, req.query.year)
    BackupManager.deleteBackups(fss)
    res.redirect('/')
})
app.get('/bulk/delete/year', function(req, res) {
    var fss = BackupManager.year(req.query.year)
    BackupManager.deleteBackups(fss)
    res.redirect('/')
})
app.get('/bulk/download/day', async function(req, res){
    console.log(req.query)
    var q = moment().utc().set('date', req.query.day).set('month', req.query.month-1).set('year', req.query.year)
    var fss = BackupManager.day(req.query.day, req.query.month, req.query.year)
    BackupManager.createArchive(fss, q, function(url, folder){
        res.download(url)
    })
})
app.get('/bulk/download/everything', function(req,res){
   BackupManager.archiveEverything(function(url, folder) {
        res.download(url)
   })
})
app.get('/delete/:file', function(req, res){
    fs.unlinkSync(path.join(Paths.backups, req.params.file + '.bak'))
    res.redirect('/')
})
app.get('/download/:file', function(req, res){
    var date = moment(req.params.file, 'YYYY-MM-DD-HH-mm-ssZZ')
    const fileURL = path.join(Paths.backups, req.params.file + '.bak')
    res.setHeader('Content-disposition', `attachment; filename=${date.format('MMM Do YYYY HH:mm:ss')}.bak`)
    fs.createReadStream(fileURL).pipe(res)
})
app.get('/about', async function(req, res){
    const space = await FileManager.directorySpace()
    res.send({status:true,version:pkg.version, space: space})
})

app.get('/internal/archives/clear', function(req, res){
    BackupManager.clearArchives()
    res.redirect('/maintenance')
})
app.get('/internal/config/download', function(req, res){
    res.download(path.join(Paths.data, 'config.json'))
})


async function downloadBackup() {
    if (!EnviromentMode.testMode) {
        const exists = fs.existsSync(Paths.backups)
        if (!exists) {
            fs.mkdirSync(Paths.backups);
        }
        const archiveExists = fs.existsSync(Paths.archives)
        if (!archiveExists) {
            fs.mkdirSync(Paths.archives);
        }
        BackupManager.create(function() {
            console.log('Backup complete.')
        })
    }
}


console.log('Verifying settings - creating test backup.')
downloadBackup()
app.listen(5101);
console.log('Live at port 5101.')