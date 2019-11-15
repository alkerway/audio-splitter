import * as child_process from "child_process"
import {Request, Response} from "express"
import { MulterUpload } from "../config/multer";

export const upload = async (req: Request, res: Response) => {
    MulterUpload(req, res, (err: Error) => {
        if (err) {
            return res.status(500).json(err)
        }
        const originalName = req.file.originalname
        // const dirName = originalName.split(".")[0] + generateId(6)
        const pathToSpleeterDir = __dirname.split("/").slice(0, -1).join("/")
        const stems = 5
        const outputDirectory = req.file.filename.split(".")[0]
        const command = `sh ${pathToSpleeterDir}/spleeterwork/run-spleeter.bash` +
            ` -f=${req.file.filename}` +
            ` -s=${stems}` +
            ` -o=${outputDirectory}` +
            ` --spleeterpath=${pathToSpleeterDir}/spleeterwork` +
            ` -u=1000`
        console.log(command)
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log("error", error)
            } else if (stderr) {
                console.log("stderr", stderr)
            } else {
                console.log("stdout", stdout)
            }
            return res.status(200).send(req.file)
        })
        // console.log(command)
    })
}
