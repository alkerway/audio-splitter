import * as child_process from "child_process";
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
        this.splitAudio()
    }

    public clean = () => {
        console.log("cleaning up")
    }

    public splitAudio = (): void => {
        const command = `sh ${this.pathToSpleeterDir}/spleeterwork/run-spleeter.bash` +
            ` -f=${this.name}` +
            ` -s=${this.stems}` +
            ` -o=${this.outputDirectory}` +
            ` --spleeterpath=${this.pathToSpleeterDir}/spleeterwork` +
            ` -u=$(id -u)`
        console.log(command)
        this.status = Statuses.SPLITTING_AUDIO
        child_process.exec(command, (error, stdout, stderr) => {
            if (error || stderr || stdout.indexOf(`Status code: 0`) < 0) {
                this.status = Statuses.ERRORRED
                console.log("stderr", stderr)
            } else {
                this.status = Statuses.COMPLETE
                console.log("stdout", stdout)
            }
        })
    }

    public getFileToDownload = (): string | null => {
        if (this.status === Statuses.COMPLETE) {
            const filepath = `${this.pathToSpleeterDir}/spleeterwork/output/${this.outputDirectory}/vocals.wav`
            console.log(filepath)
            return filepath
        } else if (this.status === Statuses.ERRORRED) {
            return `${this.pathToSpleeterDir}/spleeterwork/logs/${this.outputDirectory}/${this.name}.log`
        } else {
            return null
        }
    }
}
