import {v2 as cloudinary} from "cloudinary"

cloudinary.config({
    api_key:process.env.CLOUDINARY_API_KEY,
    cloud_name:process.env.CLOUD_NAME,
    api_secret:process.env.CLOUDINARY_SECRET_KEY
})

export default cloudinary;