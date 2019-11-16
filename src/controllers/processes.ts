import {AudioProcessConfig} from "../models/AudioProcessConfig";
import { AudioProcess } from "./audio-process"
class ProcessStore {
    public processes: AudioProcess[] = []

    public runNew = (config: AudioProcessConfig) => {
        const process = new AudioProcess(config, this.onDestroy)
        this.processes.push(process)
        process.run()
    }

    public getById = (name: string): AudioProcess | null => {
        const match = this.processes.filter((process) => {
            return process.name === name
        })[0]
        return match || null
    }

    public onDestroy = (processName: string) => {
        this.processes = this.processes.filter((process) => {
            return process.name !== processName
        });
    }
}

export default new ProcessStore()
