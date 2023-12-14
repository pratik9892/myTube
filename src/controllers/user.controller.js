import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler( async (req,res) => {
   /*
    take information about user from frontend
    check if all fields required are present
    check if user exist or not with help of email or username passed
    check images and also avatar image
    upload them to clodinary, check if properly uploaded 
    create user object in db by using user.create method
    remove password and refersh token from the user object
    check if user object is properly created or not 
    if created return it
   */
    
    const {username , fullName , email , password} = req.body
    // console.log(username , email)
    console.log(req.body);

    if(
        [fullName,username,email,password].some((field)=> field?.trim() === "")
    ){
        throw new apiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or : [{username},{email}]
    })

    if(existedUser){
        throw new apiError(409,"User already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    // console.log(req.files);
    /*
    optional chaining gives problem and if user doesnot upload coverimage 
    it stores the value undefined and also we later check while creating user
    */

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new apiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // console.log(avatar);
    // console.log(coverImage);

    if(!avatar){
        throw new apiError(400,"Avatar file not uploaded")
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        username : username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if(!createdUser){
        throw new apiError(500,"Something went wrong while creating user")
    }

    return res.status(201).json(
        new apiResponse(200,createdUser,"User Successfully Created")
    )



})

export {registerUser}