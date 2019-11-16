import archiver from "archiver"
import * as child_process from "child_process";
import * as fs from "fs";
import rimraf from "rimraf"
import { CLEANUP_AFTER_COMPLETE } from "../config/cleanup"
import { AudioProcessConfig, Statuses } from "../models"

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
        const runPromise = this.splitAudio()
            .catch((logs) => {
                // write to file
                console.log(logs)
            })
            .then(() => {
                if (this.remove.size) {
                    return this.buildPartialTracks()
                }
            })
            .catch((logs: string) => {
                // write to file
                console.log(logs)
            })
            .then(this.removeExtraFiles)
            .then(() => {
                this.zipFiles(`${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}`,
                    `${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}.zip`)
            })
            .then(() => {
                this.status = Statuses.COMPLETE
                this.scheduleCleanup(CLEANUP_AFTER_COMPLETE)
            })
        return runPromise
    }

    public scheduleCleanup = (seconds: number) => {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer)
        }
        this.cleanupTimer = setTimeout(this.clean, seconds * 1000)
    }

    public clean = () => {
        console.log("cleaning up")
        const fileToUnlink = `${this.pathToSpleeterDir}/spleeterwork/input/${this.name}`
        const dirToUnlink = `${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}`
        const zipToUnlink = `${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}.zip`
        const logToUnlink = `${this.pathToSpleeterDir}/spleeterwork/logs/${this.outputDirectory}/${this.name}.log`
        Promise.all([
            this.removeAtPath(fileToUnlink),
            this.removeAtPath(dirToUnlink),
            this.removeAtPath(zipToUnlink),
            this.removeAtPath(logToUnlink)
        ])
            .then(() => this.onDestroy(this.name))
    }

    public removeAtPath = (path: string): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            rimraf(path, (err) => {
                if (err) {
                    return reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    public getFileToDownload = (): string | null => {
        if (this.status === Statuses.COMPLETE || this.status === Statuses.SENT) {
            const filepath = `${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}.zip`
            console.log(filepath)
            return filepath
        } else if (this.status === Statuses.ERRORRED) {
            return `${this.pathToSpleeterDir}/spleeterwork/logs/${this.outputDirectory}/${this.name}.log`
        } else {
            return null
        }
    }

    private splitAudio = (): Promise<string> => {
        const command = `sh ${this.pathToSpleeterDir}/spleeterwork/run-spleeter.bash` +
            ` -f=${this.name}` +
            ` -s=${this.stems}` +
            ` -o=${this.outputDirectory}` +
            ` --spleeterpath=${this.pathToSpleeterDir}/spleeterwork` +
            ` -u=$(id -u)`
        console.log(command)
        this.status = Statuses.SPLITTING_AUDIO
        return new Promise<string>((resolve, reject) => {
            child_process.exec(command, (error, stdout, stderr) => {
                if (error || stderr || stdout.indexOf(`Status code: 0`) < 0) {
                    this.status = Statuses.ERRORRED
                    reject(error || stderr)
                } else {
                    console.log("stdout", stdout)
                    resolve(stdout)
                }
            })
        })
    }

    private buildPartialTracks = (): Promise<string[]> => {
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

    private buildTrackForRemovedFile = (command: string) => {
        return new Promise<string>((resolve, reject) => {
            child_process.exec(command, (error, stdout, stderr) => {
                if (error) {
                    this.status = Statuses.ERRORRED
                    reject(error + stderr)
                } else {
                    console.log("stdout", stdout)
                    resolve(stdout)
                }
            })
        })
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
                        this.removeAtPath(`${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}/${file}`)
                            .catch((err) => {
                                throw err
                            })
                    }
                });
            })
    }

    private zipFiles = (source: string, outputname: string): Promise<string> => {
        const archive = archiver("zip", { zlib: { level: 9 }});
        const stream = fs.createWriteStream(outputname);
        this.status = Statuses.ZIPPING
        return new Promise((resolve, reject) => {
            archive
                .directory(source, false)
                .on("error", (err: Error) => reject(err))
                .pipe(stream)

            stream.on("close", () => resolve());
            archive.finalize();
        })
    }
}
