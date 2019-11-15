import multer from "multer"

const UPLOAD_PATH = `spleeterwork/input`;

// export const multerUpload = multer({dest: UPLOAD_PATH})
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, UPLOAD_PATH)
    },
    filename(req, file, cb) {
        cb(null, file.originalname )
    }
})
export const MulterUpload = multer({storage}).single("file")
