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

    constructor(config: AudioProcessConfig) {
        this.name = config.name
        this.stems = config.stems
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
                this.zipFiles(`${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}`,
                    `${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}.zip`)
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
                    this.status = Statuses.COMPLETE
                    console.log("stdout", stdout)
                    resolve(stdout)
                }
            })
        })
    }

    private zipFiles = (source: string, outputname: string): Promise<string> => {
        const archive = archiver("zip", { zlib: { level: 9 }});
        const stream = fs.createWriteStream(outputname);
        console.log("ziupping", source, outputname)
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
