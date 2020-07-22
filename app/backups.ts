import * as moment from 'moment'
import * as fs from 'fs'
import * as zipFolder from 'zip-a-folder'
import * as path from 'path'
import { exec } from "child_process"
import { Paths } from './enviroment';
import { DatabaseConfig, EnviromentMode } from './enviroment';
import { random } from './utility';

export class BackupManager {

    static async create(finished: ()=>void) {
        const command = DatabaseConfig.pgCommand(EnviromentMode.config.db)
        console.log(command)
        exec(command, (err, stdout, stderr) => {
            finished()
        })
    }

    static all() {
        var files: Backup[] = []
        var fss = fs.readdirSync(Paths.backups)
    
        fss.forEach(function(f){
            files.push(Backup.fromFile(f))
        });
        files = files.sort(function(a,b){
            return b.date.valueOf() - a.date.valueOf()
        })
        return files
    }

    static year(year: number) {
        var q = moment()
        q = q.year(year)
        q = q.utc()
        var fss = fs.readdirSync(Paths.backups)
        var files: Backup[] = []

        fss.forEach(function(f){
            var t = moment(f.replace('.bak', ''))
            if (q.year() == t.year()) {
                files.push(Backup.fromFile(f))
            }
        })

        return files
    }
    static month(month: number, year: number) {
        var q = moment()
        q = q.month(month).year(year)
        q = q.utc()
    
        var files: Backup[] = []
    
        var fss = fs.readdirSync(Paths.backups)
        fss.forEach(function(f){
            var t = moment(f.replace('.bak', ''))
            if (q.month() == t.month() && q.year() == t.year()) {
                files.push(Backup.fromFile(f))
            }
        })
    
        return files
    }

    static day(day: number, month: number, year: number) {
        var q = moment()
        q = q.set('month', month-1).set('date', day).set('year', year)
        q = q.local()

        console.log(q.toString())
    
        var files: Backup[] = []
    
        var fss = fs.readdirSync(Paths.backups)
        fss.forEach(function(f){
            var t = moment(f.replace('.bak', ''), 'YYYY-MM-DD-HH-mm-ssZZ')
            if (q.date() == t.date() && q.month() == t.month() && q.year() == t.year()) {
                files.push(Backup.fromFile(f))
            }
        })
    
        return files
    }

    static deleteBackups(backups: Backup[]) {
        backups.forEach(a => {
            fs.unlinkSync(path.join(Paths.backups, a.filename))
        })
    }

    static convertMonthToString(month: number): string {
        var mo = month.toString()
        if (mo.length < 2) { mo = "0" + (month-1) } else { mo = (month-1).toString()}
        return mo
    }
    static convertDayToString(day: number): string {
        var da = day.toString()
        if (da.length < 2) { da = "0" + (day-1) } else { da = (day-1).toString()}
        return da
    }

    static createArchive(backups: Backup[], date: moment.Moment, callback: (zip: string, folder: string)=>void) {
        var dumpPath = path.join(Paths.archives, date.format('MMMM Do YYYY') + ' - ' + random())

        fs.mkdirSync(dumpPath)

        backups.forEach(function(f){
            const info = fs.statSync(path.join(Paths.backups, f.filename))
            if (info.size > 0) {
                fs.copyFileSync(path.join(Paths.backups, f.filename), path.join(dumpPath, f.date.local().format('YYYY-MM-DD HH-mm-ss') + '.bak'))
            }
        })
        zipFolder.zipFolder(dumpPath, dumpPath + '.zip' ,function(err){
            const files = fs.readdirSync(dumpPath)
            for (const f of files) {
                fs.unlinkSync(path.join(dumpPath, f))
            }
            fs.rmdirSync(dumpPath)
            callback(path.join(dumpPath + '.zip'), dumpPath)
        })
    }
    static archiveEverything(callback: (zip: string, folder: string)=>void) {
        var dumpPath = path.join(Paths.archives, moment().format('MMMM Do YYYY') + ' - ' + random())

        fs.mkdirSync(dumpPath)

        const backups = this.all()

        backups.forEach(function(f){
            const info = fs.statSync(path.join(Paths.backups, f.filename))
            if (info.size > 0) {
                fs.copyFileSync(path.join(Paths.backups, f.filename), path.join(dumpPath, f.date.local().format('YYYY-MM-DD HH-mm-ss') + '.bak'))
            }
        })
        zipFolder.zipFolder(dumpPath, path.join(dumpPath + '.zip') ,function(err){
            const files = fs.readdirSync(dumpPath)
            for (const f of files) {
                fs.unlinkSync(path.join(dumpPath, f))
            }
            fs.rmdirSync(dumpPath)
            callback(path.join(dumpPath + '.zip'), dumpPath)
        })
    }
    static clearArchives() {
        const archives = fs.readdirSync(Paths.archives)
        archives.forEach(a => {
            const lvl1 = path.join(Paths.archives, a)
            const obj = fs.statSync(lvl1)
            console.log(obj.isDirectory)
            if (obj.isDirectory()) {
                const subdir = fs.readdirSync(lvl1)
                subdir.forEach(b => {
                    const lvl2 = path.join(lvl1, b)
                    fs.unlinkSync(lvl2)
                })
                fs.rmdirSync(lvl1)
            } else {
                fs.unlinkSync(lvl1)
            }
        })
    }

}

export class Backup {
    filename: string
    date: moment.Moment
    display: string
    day: string
    time: string
    timeAge:string
    size: {number: number, display: string, type: string}
    timestamp: string
    complete: boolean

    static fromFile(filename: string): Backup {
        var snapshot = filename.replace('.bak', '');
        var mom = moment(snapshot, 'YYYY-MM-DD-HH-mm-ssZZ')
        const fileInfo = fs.statSync(path.join(Paths.backups, filename))

        var sizeNum = (fileInfo.size/1000000)
        var sizeName = "MB"
        var sizeStr = sizeNum.toPrecision(2)

        if (sizeNum < 0.1) {
            sizeName = "KB"
            sizeNum = (fileInfo.size/1000)
            sizeStr = sizeNum.toPrecision(2)
        }

        return {filename:filename, complete:sizeNum != 0, timeAge: mom.fromNow(), size: {number: sizeNum, display: sizeStr, type: sizeName}, date:mom, display:mom.format('MMMM Do YYYY, h:mm:ss a'), day:mom.format('MMMM Do YYYY'), time:mom.format('h:mm:ss a'), timestamp:snapshot}
    }

}