import { Dir } from "fs"

import * as path from 'path'
import * as fs from 'fs'
import * as ds from 'check-disk-space'
import * as os from 'os'
import * as foldersize from 'get-folder-size'
import { Paths } from "./enviroment"

export class FileManager {

    static async directorySpace(): Promise<DirectorySizes> {

        const kConvert = 0.000000000931

        const sizes = new DirectorySizes()
        const fileSize = await ds(Paths.root)
        var archiveSize = 0
        var pgclone = 0

        sizes.total = (fileSize.size*kConvert).toFixed(2)
        sizes.free = (fileSize.free*kConvert).toFixed(2)
        sizes.used = ((fileSize.size*kConvert) - (fileSize.free*kConvert)).toFixed(2)

        var archiveFiles = fs.readdirSync(Paths.archives)
        archiveFiles.forEach( a => {
            const stat = fs.statSync(path.join(Paths.archives, a))
            if (!stat.isDirectory) {
                archiveSize += stat.size
            }
        })
        var backupFiles = fs.readdirSync(Paths.data)
        backupFiles.forEach( a => {
            const stat = fs.statSync(path.join(Paths.data,a))
            if (!stat.isDirectory) {
                pgclone += stat.size
            }
        })


        sizes.archive = (archiveSize*kConvert).toFixed(2)
        sizes.pgclone = (pgclone*kConvert).toFixed(2)
        
        return sizes
    }

}



export class DirectorySizes {
    archive: string
    pgclone: string

    free: string
    total: string
    used: string
}