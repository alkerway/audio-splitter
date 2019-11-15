import {Request, Response} from "express"
import ProcessStore from "../controllers/processes"
import { Statuses } from "../models"

export const checkstatus = async (req: Request, res: Response) => {
    const processname = req.body && req.body.name
    if (processname) {
        const process = ProcessStore.getById(processname)
        if (process) {
            return res.send({
                status: process.status
            })
        }
    }
    return res.status(400).send({
        message: "no process found"
    })
}
