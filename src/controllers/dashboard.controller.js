import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js";
import { isValidObjectId } from "mongoose";
import { apiError } from "../utils/apiError.js";
import mongoose from "mongoose";

const getChannelStats = asyncHandler(async(req,res) => {
     
    const userId = req.user?._id

    const totalSubs = await Subscription.aggregate([
        {
            $match : {
                channel : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group : {
                _id : null,
                subsCount : {
                    $sum : 1
                }
            }
        }
    ])

    const video = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $project : {
                totalLikes : {
                    $size : "$likes"
                },
                totalViews : "$views",
                totalVideos : 1
            }
        },
        {
            $group : {
                _id : null,
                totalLikes : {
                    $sum : "$totalLikes"
                },
                totalViews : {
                    $sum : "$totalViews"
                },
                totalVideos : {
                    $sum : 1
                }
            }
        }
    ])

    const channelStats = {
        totalSubs : totalSubs[0]?.subsCount || 0,
        totalLikes : video[0]?.totalVideos || 0,
        totalVideos : video[0]?.totalVideos || 0,
        totalViews : video[0]?.totalViews || 0
    }

    return res
    .status(200)
    .json(new apiResponse(200,channelStats,"Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async(req,res) => {

    const userId = req.user?._id

    const videos = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "likes",
                localField:"_id",
                foreignField:"video",
                as:"likes",
            }
        },
        {
            $lookup : {
                from : "comments",
                localField:"_id",
                foreignField:"video",
                as:"comments"
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
            $addFields : {
                totalLikes : {
                    $size : "$likes"
                },
                totalComments : {
                    $size : "$comments"
                }
            }
        },
        {
            $project : {
                _id:1,
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                duration:1,
                views:1,
                isPublished:1,
                totalLikes:1,
                totalComments:1,
                owner:{
                    username:1,
                    fullName:1,
                    avatar:1
                }

            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(200,videos,"Videos fetched successfully")
    )

 })


export {
    getChannelStats,
    getChannelVideos
}