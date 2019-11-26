import * as child_process from "child_process";
import * as fs from "fs";
import { CLEANUP_AFTER_COMPLETE } from "../config/cleanup"
import { AudioProcessConfig, Statuses } from "../models"
import FSUtil from "../utils/file-system-util"

export class AudioProcess {
    public name: string
    public stems: 2| 4 | 5
    public pathToSpleeterDir: string
    public status: Statuses
    public outputDirectory: string
    public isolate: Set<string>
    public remove: Set<string>
    private cleanupTimer: NodeJS.Timer | null;
    private onDestroy: (name: string) => void

    constructor(config: AudioProcessConfig, onDestroy: (name: string) => void) {
        this.name = config.name
        this.stems = config.stems
        this.remove = config.remove
        this.isolate = config.isolate
        this.pathToSpleeterDir = config.pathToSpleeterDir
        this.status = Statuses.INITIALIZED
        this.outputDirectory = this.name.split(".")[0]
        this.onDestroy = onDestroy;
    }

    public run = () => {
        this.splitAudio()
            .then(this.buildPartialTracks)
            .then(this.removeExtraFiles)
            .then(this.zipFiles)
            .then(() => this.status = Statuses.COMPLETE)
            .catch(this.onError)
            .finally(() => this.scheduleCleanup(CLEANUP_AFTER_COMPLETE))
    }

    public scheduleCleanup = (seconds: number) => {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer)
        }
        this.cleanupTimer = setTimeout(this.clean, seconds * 1000)
    }

    public clean = () => {
        const fileToUnlink = `${this.pathToSpleeterDir}/spleeterwork/input/${this.name}`
        const dirToUnlink = `${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}`
        const zipToUnlink = `${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}.zip`
        const logToUnlink = `${this.pathToSpleeterDir}/spleeterwork/logs/${this.outputDirectory}`
        Promise.all([
            FSUtil.removeAtPath(fileToUnlink),
            FSUtil.removeAtPath(dirToUnlink),
            FSUtil.removeAtPath(zipToUnlink),
            FSUtil.removeAtPath(logToUnlink)
        ]).then(() => this.onDestroy(this.name))
    }

    public getFileToDownload = (): string | null => {
        if (this.status === Statuses.COMPLETE || this.status === Statuses.SENT) {
            return `${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}.zip`
        } else if (this.status === Statuses.ERRORED) {
            return `${this.pathToSpleeterDir}/spleeterwork/logs/${this.outputDirectory}/${this.name}.log`
        }
        return null
    }

    private splitAudio = (): Promise<string> => {
        const command = `sh ${this.pathToSpleeterDir}/spleeterwork/run-spleeter.bash` +
            ` -f=${this.name}` +
            ` -s=${this.stems}` +
            ` -o=${this.outputDirectory}` +
            ` --spleeterpath=${this.pathToSpleeterDir}/spleeterwork` +
            ` -u=$(id -u)`
        this.status = Statuses.SPLITTING_AUDIO
        return new Promise<string>((resolve, reject) => {
            child_process.exec(command, (error, stdout, stderr) => {
                if (error || stderr || stdout.indexOf(`Status code: 0`) < 0) {
                    this.status = Statuses.ERRORED
                    reject(error + stderr + stdout)
                } else {
                    resolve(stdout)
                }
            })
        })
    }

    private buildPartialTracks = (): Promise<string[]> | null => {
        if (this.remove.size) {
            this.status = Statuses.BUILDING_PARTIAL_FILES
            const promises: Array<Promise<string>> = []
            for (const track of this.remove) {
                const command = `sh ${this.pathToSpleeterDir}/spleeterwork/build-partial-track.bash` +
                    ` --spleeterpath=${this.pathToSpleeterDir}/spleeterwork` +
                    ` -r=${track}` +
                    ` -f=output/${this.outputDirectory}`
                promises.push(this.buildTrackForRemovedFile(command))
            }
            return Promise.all(promises)
        }
        return null
    }

    private buildTrackForRemovedFile = (command: string) => {
        return new Promise<string>((resolve, reject) => {
            child_process.exec(command, (error, stdout, stderr) => {
                if (error) {
                    this.status = Statuses.ERRORED
                    reject(error + stderr)
                } else {
                    resolve(stdout)
                }
            })
        })
    }

    private zipFiles = (): Promise<void> => {
        this.status = Statuses.ZIPPING
        return FSUtil.zipFiles(`${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}`,
            `${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}.zip`)
    }

    private removeExtraFiles = (): Promise<void> => {
        const keepFiles = Array.from(this.isolate).concat(Array.from(this.remove).map((track) => "no" + track))
        return new Promise<string[]>((resolve, reject) => {
                fs.readdir(`${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}`,
                    (directoryReadError, files: string[]) => {
                    if (directoryReadError) {
                        reject(directoryReadError)
                    }
                    resolve(files)
                });
            })
            .then((files: string[]) => {
                files.forEach((file) => {
                    const noExtension = file.split(".")[0]
                    if (keepFiles.indexOf(noExtension) < 0) {
                        FSUtil.removeAtPath(`${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}/${file}`)
                            .catch(Promise.reject)
                    }
                });
            })
    }
    private onError = (err: string) => {
        this.status = Statuses.ERRORED
        const errorDir = `${this.pathToSpleeterDir}/spleeterwork/logs/${this.outputDirectory}`
        FSUtil.writeErrorToLogFile(err, errorDir, this.name)
    }
}
