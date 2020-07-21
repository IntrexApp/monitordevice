import * as path from 'path'
import * as fs from 'fs'
const moment = require('moment');
const homedir = require('os').homedir();
const backupsdir = path.join(homedir, 'backups')


export function createDescriptor(filename) {
    var snapshot = filename.replace('.bak', '');
    var mom = moment(snapshot)
    return {filename:filename, date:mom, display:mom.format('MMMM Do YYYY, h:mm:ss a'), day:mom.format('MMMM Do YYYY'), time:mom.format('h:mm:ss a'), timestamp:snapshot}
}

export function allData() {
    var files = []
    var fss = fs.readdirSync(backupsdir)

    fss.forEach(function(f){
        files.push(createDescriptor(f))
    });
    files = files.sort(function(a,b){
        return moment(b.timestamp).valueOf() - moment(a.timestamp).valueOf()
    })
    return files
}

export function year(year) {
    var q = moment()
    q = q.year(year)
    q = q.utc()
    var fss = fs.readdirSync(backupsdir)
    var files = []

    fss.forEach(function(f){
        var t = moment(f.replace('.bak', ''))
        if (q.year() == t.year()) {
            files.push(createDescriptor(f))
        }
    })

    return files
}
export function month(month, year) {
    var month = month
    if (month.length < 2) { month = "0" + (parseInt(month)-1) } else { month = (parseInt(month)-1)}
    var q = moment()
    q = q.month(month).year(year)
    q = q.utc()

    var files = []

    var fss = fs.readdirSync(backupsdir)
    fss.forEach(function(f){
        var t = moment(f.replace('.bak', ''))
        if (q.month() == t.month() && q.year() == t.year()) {
            files.push(createDescriptor(f))
        }
    })

    return files
}
export function day(day, month, year) {
    var q = queryMomentForDay(day, month, year)

    var files = []

    var fss = fs.readdirSync(backupsdir)
    fss.forEach(function(f){
        var t = moment(f.replace('.bak', ''))
        if (q.date() == t.date() && q.month() == t.month() && q.year() == t.year()) {
            files.push(createDescriptor(f))
        }
    })

    return files
}
export function queryMomentForDay(day, month, year) {
    var month = month
    var day = day
    if (month.length < 2) { month = "0" + (parseInt(month)-1) } else { month = (parseInt(month)-1)}
    if (day.length < 2) { day = "0" + day }
    var q = moment()
    q = q.month(month).date(day).year(year)
    q = q.utc()
    console.log(q.toISOString())
    return q
}