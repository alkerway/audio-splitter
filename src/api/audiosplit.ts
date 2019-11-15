import {Request, Response} from "express"
import { MulterUpload } from "../config/multer";
import ProcessStore from "../controllers/processes"
import {AudioProcessConfig} from "../models/AudioProcessConfig";

export const upload = async (req: Request, res: Response) => {
    MulterUpload(req, res, (err: Error) => {
        if (err) {
            return res.status(500).json(err)
        }
        const pathToSpleeterDir = __dirname.split("/").slice(0, -1).join("/")
        const stems = 5
        const processConfig: AudioProcessConfig = {
            name: req.file.filename,
            pathToSpleeterDir,
            stems
        }
        ProcessStore.runNew(processConfig)
        res.status(200).send("Uploaded, starting task")
    })
}
