import * as child_process from "child_process";
import { AudioProcessConfig, Statuses } from "../models"

export class AudioProcess {
    public name: string
    public stems: 2| 4 | 5
    public pathToSpleeterDir: string
    public status: Statuses

    constructor(config: AudioProcessConfig) {
        this.name = config.name
        this.stems = config.stems
        this.pathToSpleeterDir = config.pathToSpleeterDir
        this.status = Statuses.INITIALIZED
    }

    public run = () => {
        this.splitAudio()
    }

    public splitAudio = () => {
        const outputDirectory = this.name.split(".")[0]
        const command = `sh ${this.pathToSpleeterDir}/spleeterwork/run-spleeter.bash` +
            ` -f=${this.name}` +
            ` -s=${this.stems}` +
            ` -o=${outputDirectory}` +
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
}
