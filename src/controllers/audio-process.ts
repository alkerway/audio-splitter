import archiver from "archiver"
import * as child_process from "child_process";
import * as fs from "fs";
import { AudioProcessConfig, Statuses } from "../models"

export class AudioProcess {
    public name: string
    public stems: 2| 4 | 5
    public pathToSpleeterDir: string
    public status: Statuses
    public outputDirectory: string
    public isolate: Set<string>
    public remove: Set<string>

    constructor(config: AudioProcessConfig) {
        this.name = config.name
        this.stems = config.stems
        this.remove = config.remove
        this.isolate = config.isolate
        this.pathToSpleeterDir = config.pathToSpleeterDir
        this.status = Statuses.INITIALIZED
        this.outputDirectory = this.name.split(".")[0]
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
            })
        return runPromise
    }

    public clean = () => {
        console.log("cleaning up")
    }

    public getFileToDownload = (): string | null => {
        if (this.status === Statuses.COMPLETE) {
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
                        fs.unlink(`${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}/${file}`,
                            (unlinkError) => {
                            if (unlinkError) {
                                throw (unlinkError)
                            }
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
