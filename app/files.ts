import { Dir } from "fs"

import * as path from 'path'
import * as ds from 'check-disk-space'
import * as os from 'os'
import * as foldersize from 'get-folder-size'

export class FileManager {

    static async directorySpace(): Promise<DirectorySizes> {

        const kConvert = 0.000000000931

        const sizes = new DirectorySizes()
        const fileSize = await ds(Paths.root)
        const archiveSize = await ds(Paths.archives)
        const pgclone = await ds(Paths.data)

        sizes.total = (fileSize.free*kConvert).toFixed(2)
        sizes.used = (fileSize.size*kConvert).toFixed(2)
        sizes.free = ((fileSize.size*kConvert) - (fileSize.free*kConvert)).toFixed(2)
        sizes.archive = (archiveSize.size * kConvert).toFixed(2)
        sizes.pgclone = (pgclone.size * kConvert).toFixed(2)
        
        return sizes
    }

}

export class Paths {
    static home = require('os').homedir();
    static data = Paths.home
    static backups = path.join(Paths.home, 'backups')
    static archives = path.join(Paths.home, 'archives')
    static root = (os.platform() == "win32") ? process.cwd().split(path.sep)[0] : "/"
}


export class DirectorySizes {
    archive: string
    pgclone: string

    free: string
    total: string
    used: string
}