import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localfilePath) => {
    try {
        if(!localfilePath) return null;
        const response = await cloudinary.v2.uploader.upload(localfilePath,{
        resource_type:'auto'
    })
        console.log("file is succesfully uploaded : ", response.url);
        fs.unlinkSync(localfilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localfilePath)
        return null;
    }
}

const deleteOnCloudinary = async (cloudinaryPublicId) => {
    try {
        if(!cloudinaryPublicId) return null;
        await cloudinary.uploader.destroy(cloudinaryPublicId, {
            resource_type : 'auto'
        })
    } catch (error) {
        return null
    }
}

export {uploadOnCloudinary,deleteOnCloudinary}