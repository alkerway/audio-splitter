import archiver from "archiver";
import * as fs from "fs";
import rimraf from "rimraf";

class FSUtil {

    public zipFiles = (source: string, outputname: string): Promise<void> => {
        const archive = archiver("zip", { zlib: { level: 9 }});
        const stream = fs.createWriteStream(outputname);
        return new Promise((resolve, reject) => {
            archive
                .directory(source, false)
                .on("error", (err: Error) => reject(err))
                .pipe(stream)

            archive.finalize().then(() => {
                resolve()
            });
        })
    }

    public removeAtPath = (path: string): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            rimraf(path, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    public writeErrorToLogFile = (text: string, errorDir: string, name: string) => {
        const errorPath = `${errorDir}/${name}.log`
        return new Promise<void>((resolve, reject) => {
            fs.mkdir(errorDir, (err) => {
                if (err && err.code !== "EEXIST") {
                    console.log("error making log dir", err)
                } else {
                    fs.writeFile(errorPath, text, (fileWriteErr) => {
                        if (fileWriteErr) {
                            console.log("Error writing to log file!!", fileWriteErr)
                        }
                    })
                }
                resolve()
            })
        })
    }

}
export default new FSUtil()
