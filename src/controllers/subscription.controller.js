import { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose"

const toggleSubscription = asyncHandler(async(req,res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new apiError(400,"Invalid Channel ID")
    }

    const isChannelSub = await Subscription.findOne(
        {
            subscriber : req.user?._id,
            channel : channelId
        }
    )

    if(isChannelSub){
        const deleteSub = await Subscription.findByIdAndDelete(isChannelSub?._id)

        if(!deleteSub){
            throw new apiError(500,"Error while unsuscribing")
        }

        return res
        .status(200)
        .json(
            new apiResponse(200,{isSubscribed:false},"Unsubscribed successfully")
        )

    }


    const createChannelSub = await Subscription.create({
        subscriber : req.user?._id,
        channel : channelId
    })

    if(!createChannelSub){
        throw new apiError(500,"Error while subscribing")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,{isSubscribed:true},"Subscribed successfully")
    )

})

const getAllSubscribers = asyncHandler(async(req,res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new apiError(400,"Invalid user id")
    }

    const subscribers  = await Subscription.aggregate([
        {
            $match : {
                channel : new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "subscriber",
                foreignField:"_id",
                as:"subscriber",
                pipeline :[
                    {
                        $lookup : {
                            from : "subscriptions",
                            localField : "_id",
                            foreignField:"channel",
                            as:"subscribedToSubscriber"
                        }
                    },
                    {
                        $addFields : {
                            subscribedToSubscriber : {
                                $cond: {
                                    if: {
                                        $in: [channelId, "$subscribedToSubscriber.subscriber"],
                                    },
                                    then: true,
                                    else: false,
                                }
                            },
                            subscribersCount : {
                                $size : "$subscribedToSubscriber"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind : "$subscriber"
        },
        {
            $project : {
                _id : 0,
                subscriber : {
                    _id : 1,
                    username : 1,
                    fullname : 1,
                    avatar : 1,
                    subscribedToSubscriber : 1,
                    subscribersCount : 1
                }
            }
        }
    ])


    if(!subscribers){
        throw new apiError(500,"Error while computing subscriber")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,subscribers,"Subscribers fetched successfully")
    )

})


const getSubscribedChannels = asyncHandler(async(req,res) => {

    const {subscriberId} = req.params

    if(!isValidObjectId(subscriberId)){
        throw new apiError(400,"Invalid Subscriber id")
    }

    console.log(subscriberId);
    
    const subscribedTo = await Subscription.aggregate([
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
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$subscribedChannel",
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

console.log(subscribedTo);

    
if(!subscribedTo){
    throw new apiError(500,"Error while calculating subscribed channels")
}

    return res
    .status(200)
    .json(
        new apiResponse(200,subscribedTo,"Fetch subscribed channels succesfully")
    )

})


export {
    toggleSubscription,
    getAllSubscribers,
    getSubscribedChannels
}