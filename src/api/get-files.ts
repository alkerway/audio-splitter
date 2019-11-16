import {Request, Response} from "express"
import { CLEANUP_AFTER_SEND } from "../config/cleanup"
import ProcessStore from "../controllers/processes"
import { Statuses } from "../models"

export const getfiles = async (req: Request, res: Response) => {
    const processname = req.query && req.query.name
    // console.log(req.body)
    if (processname) {
        const process = ProcessStore.getById(processname)
        if (process && (process.status === Statuses.COMPLETE || process.status === Statuses.SENT)) {
            const filepath = process.getFileToDownload()
            if (!filepath) {
                return res.status(400).json({
                    message: "not ready yet"
                })
            }
            res.download(filepath)
            process.status = Statuses.SENT
            process.scheduleCleanup(CLEANUP_AFTER_SEND)
        } else {
            return res.status(400).send({
                message: "no process found for name"
            })
        }
    } else {
        return res.status(400).send({
            message: "no process in request"
        })
    }
}
