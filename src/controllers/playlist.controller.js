import { PlayList } from "../models/playlist.models";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asynchandler";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";

const createPlayList = asyncHandler(async(requestAnimationFrame,res) => {
    const {name, description} = req.body
    if(!name && description)
        throw new ApiError(400, "Name and Description are both required");

    const playlist = PlayList.create({
        name,
        description,
        owner:req.user._id,
    })
     if(!playlist){
        throw new ApiError(500,"Something went wrong while creating the playlist !!! try Again");
    }
    return res.status(200).json(new ApiResponse(200,playlist,"playlist created successfully"));
})

const getUserPlaylist = asyncHandler(async(req,res) => {
    const {userId} = req.params
    console.log(userId);
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"invalid ID")
    }

    const playlists = await PlayList.aggregate([
        {
             $match:{
                owner:new mongoose.Types.ObjectId(String(userId))
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },
        {
            $addFields:{
                allVideos:{
                    $size:"$videos"
                },
                totalViews:{
                    $sum:"$videos.views"
                }
            }
        },
        {
            $project:{
                _id:1,
                name:1,
                description:1,
                totalViews:1,
                allVideos:1
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200,playlists,"Playlists fetched successfully"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playlist id")
    }

    const playlist = await PlayList.findById(playlistId);

    if(!playlist){
        throw new ApiError(401,"playlist not found")
    }

    const showPlaylist = await PlayList.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(String(playlistId))
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },
        {
            $match:{
                "videos.isPublished":true
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $addFields:{
                allVideos:{
                    $size:"$videos"
                },
                owner:{
                    $first:"$owner"
                },
                //add total views
            }
        },
        {
            $project:{
                name:1,
                description:1,
                createdAt:1,
                allVideos:1,
                //if you haqve all views field added in the add fields then you can add this here
                videos:{
                    id:1,
                    videoFile:1,
                    thumbnail:1,
                    title:1,
                    description:1,
                    views:1,
                    duration:1,
                },
                owner:{
                    username:1,
                    avatar:1//or "avatar.url:1"
                }
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200,showPlaylist[0],"Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async(req,res) =>{
    const {playlistId, videoId} = req.params
    if (!(isValidObjectId(playlistId)) || !isValidObjectId(videoId)) {
        throw new ApiError(402, "Provide a valid ID");
    }
    
    const playlist = await PlayList.findById(playlistId)
    const video = await Video.findById(videoId);

    if(!playlist){
        throw new ApiError(402,"Error in finding the playlist");
    }
    if(!video){
        throw new ApiError(402,"Error in finding the video");
    }
    console.log(req.user?._id);
    console.log(playlist.owner?._id);
    console.log(video.owner?._id);
    if (playlist.owner?.toString() !== req.user?._id.toString() || video.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You are not the owner");
    }

    const newPlaylist = await PlayList.findByIdAndUpdate(playlistId,{
        $addToSet:{
            videos:videoId,
        }
    },{new:true})
    return res.status(200).json(new ApiResponse(200,newPlaylist,"Video added to playlist successfully"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!(isValidObjectId(playlistId) && !isValidObjectId(videoId))){
        throw new ApiError(402,"provide a valid id")
    }

    const playlist = PlayList.findById(playlistId)
    const video = Video.findById(videoId)

    if ((playlist.owner?.toString() && video.owner.toString()) !== req.user?._id.toString()) {
        throw new ApiError(400, "you are not the owner");
    }

    const newPlaylist = await PlayList.findByIdAndUpdate(playlistId,{
        $pull:{
            videos:videoId,
        }
    },{new:true})

    if(!newPlaylist){
        throw new ApiError(500,"error while adding the video to the playlist");
    }

    return res.status(200).json(new ApiResponse(200,newPlaylist,"Video removed from playlist successfully"));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(404,"please provide a valid playlist Id")
    }
    
    const playlist = await PlayList.findById(playlistId);
    if(!playlist){
        throw new ApiError(500,"playlist not found");
    }
    
    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(404,"you are not the owner");
    }
   
    await PlayList.findByIdAndDelete(playlist._id);
    return res.status(200).json(new ApiResponse(200,{},"Playlist deleted successfully"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!(name||description)){
        throw new ApiError(404,"Name and description fields are mandatory");
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(404,"Please provide a valid playlist id");
    }

    const playlist = await PlayList.findById(playlistId);
    if(!playlist){
        throw new ApiError(402,"Playlist not found");
    }

    if(playlist.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(402,"You cant update coz you are not the owner");
    }
    const updatedPlaylist = await PlayList.findByIdAndUpdate(playlistId,{
        $set:{
            name,
            description,
        },
    },{new:true})

    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"Updation successful"))
});

export{
    createPlayList,
    getUserPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}