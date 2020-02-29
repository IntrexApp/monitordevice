const path = require('path');
const fs = require('fs');
const moment = require('moment');
const homedir = require('os').homedir();
const backupsdir = path.join(homedir, 'backups')


function createDescriptor(filename) {
    var snapshot = filename.replace('.bak', '');
    var mom = moment(snapshot)
    return {filename:filename, date:mom, display:mom.format('MMMM Do YYYY, h:mm:ss a'), day:mom.format('MMMM Do YYYY'), time:mom.format('h:mm:ss a'), timestamp:snapshot}
}

function allData() {
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

function year(year) {
    var q = moment()
    q = q.year(year)
    q = q.utc()
    var fss = fs.readdirSync(backupsdir)
    var files = []

    fss.forEach(function(f){
        if (f.includes(q.format('YYYY'))) {
            files.push(createDescriptor(f))
        }
    })

    return files
}
function month(month, year) {
    var month = month
    if (month.length < 2) { month = "0" + (parseInt(month)-1) } else { month = (parseInt(month)-1)}
    var q = moment()
    q = q.month(month).year(year)
    q = q.utc()

    var files = []

    var fss = fs.readdirSync(backupsdir)
    fss.forEach(function(f){
        if (f.includes(q.format('YYYY-MM'))) {
            files.push(createDescriptor(f))
        }
    })

    return files
}
function day(day, month, year) {
    var q = queryMomentForDay(day, month, year)

    var files = []

    var fss = fs.readdirSync(backupsdir)
    fss.forEach(function(f){
        if (f.includes(q.format('YYYY-MM-DD'))) {
            files.push(createDescriptor(f))
        }
    })

    return files
}
function queryMomentForDay(day, month, year) {
    var month = month
    var day = day
    if (month.length < 2) { month = "0" + (parseInt(month)-1) } else { month = (parseInt(month)-1)}
    if (day.length < 2) { day = "0" + day }
    var q = moment()
    q = q.month(month).date(day).year(year)
    q = q.utc()
    return q
}

module.exports = {
    allData:allData,
    year:year,
    month:month,
    day:day,
    queryMomentForDay:queryMomentForDay
}