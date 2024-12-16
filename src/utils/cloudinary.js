import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localfilePath,folder) => {
    try {
        console.log(localfilePath);
        
        if(!localfilePath) return null;
        const response = await cloudinary.uploader.upload(localfilePath,{
        resource_type:'auto',
        folder:folder
    })
    console.log(response + "response");
    
        console.log("file is succesfully uploaded : ", response.url);
        fs.unlinkSync(localfilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localfilePath)
        return error;
    }
}

const deleteOnCloudinary = async (cloudinaryPublicId) => {
    try {
        if(!cloudinaryPublicId) return null;
        await cloudinary.uploader.destroy(cloudinaryPublicId, {
            resource_type : 'auto'
        })
    } catch (error) {
        return error
    }
}

export {uploadOnCloudinary,deleteOnCloudinary}