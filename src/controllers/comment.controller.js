import mongoose  from "mongoose";
import { Video } from "../models/video.models.js"
import { Comment } from "../models/comment.models.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import {ApiResponse} from "../utils/apiResponse.js";

const getVideoComment = asyncHandler(async(req,res) => {

    const {videoId} = req.params
    const {page=1 , limit=10} = req.query

    const video = await Video.findById(videoId);

    if(!video){
            throw new ApiError(404 , "No Video Found !!")
        }

    const commentsAggregate = Comment.aggregate([
        {
            $match : new mongoose.Types.inputId(videoId)
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner"
            }
        },
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "comment",
                as : "likes"
            }
        },
        {
            $addFields : {
                likesCount : {
                    $size : "$likes"
                },
                owner : {
                    $first : "$owner"
                },
                isLiked : {
                    $cond : {
                        if : {$in : [req.user?._id,"$likes.likedBy"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $sort : {
                createdAt : -1
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                },
                isLiked: 1
            }
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, comments, "Comments fetched successfully"));

})

const addComment = asyncHandler(async(req,res) => {
    const {videoId} = req.params
    const { content } = req.body;

    if(!content){
        throw new ApiError(400, "Content is required")
    }
    
    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404 , "No Video Found !!")
    }

    const comment = Comment.create({
        content,
        video : videoId,
        owner : req.user?._id
    })

    if(!comment){
        throw new ApiError(500,"Failed to add comment to the video")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"));

})

const updateComment = asyncHandler(async(req,res) => {
    
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "content is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if(comment?.owner.toString()!=req.user?._id.toString()){
        throw new ApiError(400, "only comment owner can edit their comment");
    }

    const updatedContent = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set: {
                content
            }
        },
        { new: true }
    )

    if (!updateComment) {
        throw new ApiError(500, "Failed to edit the comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment edited successfully")
        )
})

const deleteComment = asyncHandler(async(req,res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only comment owner can delete their comment");
    }

    await Comment.findByIdAndDelete(commentId);

    await Like.deleteMany({
        comment: commentId,
        likedBy: req.user
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, { commentId }, "Comment deleted successfully")
        );
})

export 
{
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
};
