import {Request, Response} from "express"
import {MulterUpload} from "../config/multer";
export const upload = async (req: Request, res: Response) => {
    MulterUpload(req, res, (err: Error) => {
        if (err) {
            return res.status(500).json(err)
        }
        return res.status(200).send(req.file)
    })
}
