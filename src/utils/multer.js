import multer from "multer";


export const upload = ()=>{

   const storage= multer.diskStorage({})

    const fileFilter =  (req, file, cb)=> {

        if (file.mimetype.startsWith("image")) {
        return cb(null, true)
        }
        cb(new Error('Images only', { cause: 400 }), false)
        }
        const fileUpload = multer({
            fileFilter,
            storage,
        })

    return fileUpload
}