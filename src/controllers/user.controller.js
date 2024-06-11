import { asyncHandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userId) => {
    try{

        const user =  await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken =  user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})
        return {accessToken , refreshToken}

    } catch(error){
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}





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
    
    const {fullName,email,username,password} = req.body
    console.log("email:",email);
    
    if([fullName,email,username,password].some((field) => field?.trim === "")){
    throw new ApiError(400,"All fields required")
    }
     
    const existedUser = await User.findOne({
        $or : [ {username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User already exists!")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
   

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
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

const loginUser = asyncHandler( async(req , res) => {
    //req body  -> data
    //username or email
    //find the user
    //password check
    //access and refresh token generate
    //send cookies
    //send response

    const {email , username , password} = req.body
    if(!(username || email)){
        throw new ApiError(400 , "Username or Email required")
    } 

    const user = await User.findOne({
        $or: [{username} , {email}]
    })

    if(!user){
        throw new ApiError(404 , "User does not exist")
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)

    if(!isPasswordvalid){
        throw new ApiError(404, "Invalid user credentials")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }
    
    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(200,
            {
                user : loggedInUser , accessToken , refreshToken
            },
            "User logged in Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req,res) => {
    //find user
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearcookie("accessToken" , options)
    .clearcookie("refreshToken" ,  options)
    .json(
        new ApiResponse(200, {}, "User logged out Successfully")
    )
})

const refreshAccessToken = asyncHandler( async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if (incomingRefreshToken != user?.refreshToken) {
            throw new ApiError(401,"Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user?._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken: newRefreshToken},
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req,res) =>{

    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json( new ApiResponse(200 , {} , "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res) =>{
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        ))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName , email} = req.body

     if(!(fullName || email)){
        throw new ApiError(400, "All fields are required")
     }

     await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set:{
                fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(200 , user , "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
              avatar : avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password")
   
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"))

})  // delete the old avatar when we update the avatar

const updateUserCoverImage = asyncHandler(async(req,res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPathLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
              coverImage : coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password")
    
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Cover Image updated successfully"))

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
const {username} = req.params

if(!username?.trim()){
    throw new ApiError(400,"Username is missing")
}
 const channel = await User.aggregate([
{
    $match : {
        username : username?.toLowerCase()
    }
},
{  // to know number of subscribers
    $lookup : {
        from : "subscriptions",
        localField : "_id",
        foreignField : "channel",
        as : "subscribers"
    }
},
{  // to know number of subscrined channels
    $lookup : {
        from : "subscriptions",
        localField : "_id",
        foreignField : "subcriber",
        as : "subscribedTo"
    }
},
{
    $addFields : {
        subscribersCount : {
            $size : "$subscribers"
        },
        channelsSubscribedToCount : {
            $size : "$subscribedTo"
        },
        isSubscribed : {
            $cond : {
                if: {$in: [req.user?._id , "$subscribers.subscriber"]},
                then: true,
                else: false
            }
        }
    }
},
{
    $project : {
        fullName : 1,
        username : 1,
        subscribersCount : 1,
        channelsSubscribedToCount : 1,
        isSubscribed : 1,
        avatar : 1,
        coverImage : 1,
        email : 1
    }
}
 ])

 if (!channel?.length) {
    throw new ApiError(404,"Channel does not exists")
 }

 return res
 .status(200)
 .json(
    new ApiResponse(200 , channel[0] , "User channel fetched successfully")
 )
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId.createFromHexString(req.user._id) // if any error comes check it
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName : 1,
                                        username : 1,
                                        avatar : 1  
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            user[0].watchHistory,
            "Watch History fetched Successfully"
        )
    )
})


export {
    registerUser , 
    loginUser , 
    logoutUser , 
    refreshAccessToken , 
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}







//curly braces import is possible is export is not default
//normal import is possible when export is default