import mongoose , {isValidObjectId} from "mongoose";
import { Like } from "../models/like.models.js";
import { asyncHandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/apiError.js";
import {ApiResponse} from "../utils/apiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid videoId")
    }

    const likedAlready = Like.findOne(
        {
            video : videoId,
            likedBy : req.user?._id,
        }
    )
    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready?._id)

        return res
        .status(200)
        .json(new ApiResponse(200 , {isLiked : false}))
    }

    await Like.create({
        video : videoId,
        likedBy : req.user?._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200 , {isLiked : true}))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
     
    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "Invalid commentId")
    }
    
    const likedAlready = Like.findOne(
        {
            comment : commentId,
            likedBy : req.user?._id,
        }
    )
   
    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready?._id)

        return res
        .status(200)
        .json(new ApiResponse(200 , {isLiked : false}))
    }
   
    await Like.create({
        comment : commentId,
        likedBy : req.user?._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200 , {isLiked : true}))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400 , "Invalid commentId")
    }
    
    const likedAlready = Like.findOne(
        {
            tweet : tweetId,
            likedBy : req.user?._id,
        }
    )
   
    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready?._id)

        return res
        .status(200)
        .json(new ApiResponse(200 , {isLiked : false}))
    }
   
    await Like.create({
        tweet : tweetId,
        likedBy : req.user?._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200 , {isLiked : true}))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    
    const likedVideoAggregate = await Like.aggregate([
        {
            $match : {
            likedBy : new mongoose.Types.ObjectId()
        },
    },
    {
       $lookup : {
        from : "videos",
        localField : "video",
        foreignField : "_id",
        as : "likedVideo",
        pipeline : [
            {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "ownerDetails"
                },
            },
            {
                $unwind : "$ownerDetails"
            }
        ]
       },
    },
    {
        $unwind : "$likedVideo"
    },
    {
        $sort : {
            createdAt : -1
        }
    },
    {
        $project: {
            _id: 0,
            likedVideo: {
                _id: 1,
                "videoFile.url": 1,
                "thumbnail.url": 1,
                owner: 1,
                title: 1,
                description: 1,
                views: 1,
                duration: 1,
                createdAt: 1,
                isPublished: 1,
                ownerDetails: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                },
            },
        },
    },
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(200 , likedVideoAggregate , "Liked Videos fetched Successfully")
    );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
