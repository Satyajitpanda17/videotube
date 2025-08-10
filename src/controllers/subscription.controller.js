import { Subscription } from "../models/subscription.models";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asynchandler";

const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel ID");
    }
    const subscribe = await Subscription.findOne({
        subscriber:req.user?._id,
        channel:channelId,
    })
    if(subscribe){
        await Subscription.findByIdAndDelete(subscribe._id);
        return res
        .status(200)
        .json(new ApiResponse(200,{subscriber:false},"Unsubscribed successfully"));
    }
    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    })
    return res
    .status(200)
    .json(new ApiResponse(200,{subscriber:true},"Subscribed successfully"));
})

const getUserChannelSubscribers = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        return new ApiError(400,"Invalid channel id");
    }
    if(channelId.channel.owner !== req.user._id){
        throw new ApiError(404,"You cannot see the subscribers list coz you are not the owner");
    }
    const subscribers = await Subscription.aggregate([
        {
            $match:{
                 channel:new mongoose.Types.ObjectId(String(channelId)),
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscriber",
                pipeline:[
                    {
                        $lookup:{
                            from:"Subscription",
                            localField:"_id",
                            foreignField:"channel",
                            as:"subscribedToSubscriber"
                        }
                    },
                     {
                        $addFields:{
                            subscribedToSubscriber:{
                                $cond:{
                                    if:{
                                        $in:[channelId,"$subscribedToSubscriber.subscriber"]
                                    },
                                    then:true,
                                    else:false,
                                },
                            },
                            subscriberCount:{
                                $size:'$subscribedToSubscriber'
                            }
                        }
                    },  
                ]
            }
        },
        {
            $unwind: "$subscriber",
        },
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    subscribedToSubscriber: 1,
                    subscribersCount: 1,
                },
            },
        },
    ])
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                "Subscribers fetched successfully"
            )
        );
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "videos",
                        },
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$videos",
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedChannel"
        },
        {
            $project: {
                _id: 0,
                subscribedChannel: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    latestVideo: {
                        _id: 1,
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1
                    },
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedChannels,
                "Subscribed channels fetched successfully"
            )
        );
});

export{
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}