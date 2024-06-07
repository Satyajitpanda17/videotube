import {asyncHandler} from './utils/asyncHandler.js';
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from '../utils/apiResponse.js';

const registerUser = asyncHandler( async(req,res) => {
    //get user details from frontend
    //validation - not empty
    //check if user already exist
    //check for images , avatar
    //upload them to cloudinary
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response
    
    const {fullname,email,username,password} = req.body
    console.log("email:",email);
    
    if([fullname,email,username,password].some((field) => field?.trim === "")){
    throw new ApiError(400,"All fields required")
    }
     
    const existedUser = User.findOne({
        $or : [ {username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User already exists!")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
   

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPathLocalPath)
  
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    
   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registerd successfully")
   )
})

export {registerUser}







//curly braces import is possible is export is not default
//normal import is possible when export is default