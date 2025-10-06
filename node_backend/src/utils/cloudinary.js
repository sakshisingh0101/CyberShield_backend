import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.APIKEY, 
    api_secret: process.env.APISECRET // env var are treated as string , we do not need to wrap them in string explicitly

});

const uploadOnCloudinary=async  (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const response=await cloudinary.uploader.upload(localFilePath,{
             resource_type:"auto" // file type : img, video, raw, auto 
        })
        console.log("File uploaded successfully on cloudinary and url link is  ",response.url)
             fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        console.log("Uplaod failed")
        fs.unlinkSync(localFilePath);
        // removing file from local because of failure in upload ;
        return null;
    }
}
export {uploadOnCloudinary};