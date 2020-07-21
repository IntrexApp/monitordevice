import * as moment from 'moment'
import * as fs from 'fs'
import { Paths } from './files';

export class BackupManager {
    static all() {
        var files: Backup[] = []
        var fss = fs.readdirSync(Paths.backups)
    
        fss.forEach(function(f){
            files.push(Backup.fromFile(f))
        });
        files = files.sort(function(a,b){
            return moment(b.timestamp).valueOf() - moment(a.timestamp).valueOf()
        })
        return files
    }

}

export class Backup {
    filename: string
    date: moment.Moment
    display: string
    day: string
    time: string
    timestamp: string

    static fromFile(filename: string): Backup {
        var snapshot = filename.replace('.bak', '');
        var mom = moment(snapshot)
        return {filename:filename, date:mom, display:mom.format('MMMM Do YYYY, h:mm:ss a'), day:mom.format('MMMM Do YYYY'), time:mom.format('h:mm:ss a'), timestamp:snapshot}
    }

}