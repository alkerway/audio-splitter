import {Request, Response} from "express"
import { CLEANUP_AFTER_SEND } from "../config/cleanup"
import ProcessStore from "../controllers/processes"
import { Statuses } from "../models"

export const getfiles = async (req: Request, res: Response) => {
    const processname = req.query && req.query.name
    // console.log(req.body)
    if (processname) {
        const process = ProcessStore.getById(processname)
        if (process &&
            (process.status === Statuses.COMPLETE ||
                process.status === Statuses.SENT ||
                process.status === Statuses.ERRORED)) {
            const filepath = process.getFileToDownload()
            if (!filepath) {
                return res.status(400).json({
                    name: processname,
                    message: "not ready yet"
                })
            }
            res.download(filepath)
            if (process.status !== Statuses.ERRORED) {
                process.status = Statuses.SENT
            }
            process.scheduleCleanup(CLEANUP_AFTER_SEND)
        } else {
            return res.status(400).send({
                name: processname,
                message: "no process found for name"
            })
        }
    } else {
        return res.status(400).send({
            name: processname,
            message: "no process in request"
        })
    }
}
