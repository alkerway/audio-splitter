import {Request, Response} from "express"
import { MulterUpload } from "../config/multer";
import ProcessStore from "../controllers/processes"
import {AudioProcessConfig, Stem} from "../models/AudioProcessConfig";

export const upload = async (req: Request, res: Response) => {
    MulterUpload(req, res, (err: Error) => {
        console.log(req.body)

        if (err) {
            return res.status(500).json(err)
        }
        const pathToSpleeterDir = __dirname.split("/").slice(0, -1).join("/")
        const stems = Number(req.body.stems) as Stem
        const processConfig: AudioProcessConfig = {
            name: req.file.filename,
            pathToSpleeterDir,
            stems,
            isolate: new Set(JSON.parse(req.body.isolate)) as Set<string>,
            remove: new Set(JSON.parse(req.body.remove)) as Set<string>
        }
        ProcessStore.runNew(processConfig)
        res.status(200).send({name: req.file.filename})
    })
}
