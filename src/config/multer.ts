import multer from "multer"

const currentLocation = __dirname.split("/").slice(0, -1).join("/")
const UPLOAD_PATH = `${currentLocation}/spleeterwork/input`;

const generateId = (length: number) => {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// export const multerUpload = multer({dest: UPLOAD_PATH})
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, UPLOAD_PATH)
    },
    filename(req, file, cb) {
        cb(null, generateId(6) + file.originalname )
    }
})
export const MulterUpload = multer({storage}).single("file")
