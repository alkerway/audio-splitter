import {Request, Response} from "express"

export const checkstatus = async (req: Request, res: Response) => {
    const processname = req.body
    console.log(processname)
    res.send("Status: checking")
}
