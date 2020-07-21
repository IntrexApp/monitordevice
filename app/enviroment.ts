import * as path from 'path'
import * as os from 'os'
import * as moment from 'moment'

export class ConfigObject {
    db?: DatabaseConfig
    appearance?: AppearanceConfig
}
export class EnviromentMode {
    static testMode: boolean = false
    static config: ConfigObject = new ConfigObject()

    static load() {
        Paths.home = (EnviromentMode.testMode == true) ? path.resolve(__dirname, '..', '..') : require('os').homedir();
        Paths.data = Paths.home
        Paths.backups = path.join(Paths.home, 'backups')
        Paths.archives = path.join(Paths.home, 'archives')
        Paths.root = (os.platform() == "win32") ? process.cwd().split(path.sep)[0] : "/"
    }
}
export class Paths {
    static home = ''
    static data = ''
    static backups = ''
    static archives = ''
    static root = ''
}

export class DatabaseConfig {
    host: string
    port: string
    username: string
    password: string
    database: string

    static connectionString(config: DatabaseConfig) {
        return config.host + ':' + config.port + ':' + config.database + ':' + config.username + ':' + config.password
    }
    static pgCommand(config: DatabaseConfig) {
        const timestamp = moment()
        return `pg_dump -h ${config.host} -p ${config.port} -U ${config.username} ${config.database} > "${path.join(Paths.backups, timestamp.format('YYYY-MM-DD-HH-mm-ssZZ') + '.bak')}"`;
    }
}
export class AppearanceConfig {
    color: string
    title: string
}