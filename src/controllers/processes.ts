import {AudioProcessConfig} from "../models/AudioProcessConfig";
import { AudioProcess } from "./audio-process"
class ProcessStore {
    public processes: AudioProcess[] = []

    public runNew = (config: AudioProcessConfig) => {
        const process = new AudioProcess(config)
        this.processes.push(process)
        process.run()
    }

    public getById = (name: string): AudioProcess | null => {
        const match = this.processes.filter((process) => {
            return process.name === name
        })[0]
        return match || null
    }
}

export default new ProcessStore()
