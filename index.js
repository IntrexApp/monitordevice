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
    var files = []
    var fss = fs.readdirSync(backupsdir)

    var days = {};

    fss.forEach(function(f){
        var snapshot = f.replace('.bak', '');
        var mom = moment(snapshot)
        var date = moment(snapshot).format('MMMM Do YYYY, h:mm:ss a')
        files.push({date:mom, display:date, day:moment(snapshot).format('MMMM Do YYYY'), time:moment(snapshot).format('h:mm:ss a'), timestamp:snapshot});
    });
    files = files.sort(function(a,b){
        return moment(b.timestamp).valueOf() - moment(a.timestamp).valueOf()
    })

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
    var month = req.query.month
    var day = req.query.day
    if (month.length < 2) { month = "0" + (parseInt(month)-1) } else { month = (parseInt(month)-1)}
    if (day.length < 2) { day = "0" + day }
    var q = moment()
    q = q.month(month).date(day).year(req.query.year)
    q = q.utc()
    var fss = fs.readdirSync(backupsdir)
    fss.forEach(function(f){
        if (f.includes(q.format('YYYY-MM-DD'))) {
            fs.unlinkSync(path.join(backupsdir, f))
        }
    });
    res.redirect('/')
})
app.get('/bulk/delete/month', function(req, res) {
    var month = req.query.month
    if (month.length < 2) { month = "0" + (parseInt(month)-1) } else { month = (parseInt(month)-1)}
    var q = moment()
    q = q.month(month).year(req.query.year)
    q = q.utc()
    var fss = fs.readdirSync(backupsdir)
    fss.forEach(function(f){
        if (f.includes(q.format('YYYY-MM'))) {
            fs.unlinkSync(path.join(backupsdir, f))
        }
    });
    res.redirect('/')
})
app.get('/bulk/delete/year', function(req, res) {
    var q = moment()
    q = q.year(req.query.year)
    q = q.utc()
    var fss = fs.readdirSync(backupsdir)
    fss.forEach(function(f){
        if (f.includes(q.format('YYYY'))) {
            fs.unlinkSync(path.join(backupsdir, f))
        }
    });
    res.redirect('/')
})
app.get('/bulk/download/day', async function(req, res){
    var month = req.query.month
    var day = req.query.day
    if (month.length < 2) { month = "0" + (parseInt(month)-1) } else { month = (parseInt(month)-1)}
    if (day.length < 2) { day = "0" + day }
    var q = moment()
    q = q.month(month).date(day).year(req.query.year)
    q = q.utc()

    var dumpPath = path.join(datadir, 'dump-' + makeRandom(10))
    fs.mkdirSync(dumpPath)

    var fss = fs.readdirSync(backupsdir)
    for (var i=0; i < fss.length; i++) {
        var f = fss[i]
        if (f.includes(q.format('YYYY-MM-DD'))) {
            console.log(f)
            await fs.createReadStream(path.join(backupsdir, f)).pipe(fs.createWriteStream(path.join(dumpPath, f)));
        }
    }
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