import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";

const createTweet = asyncHandler(async(req,res) => {

    const {content} = req.body

    if(!content){
        throw new apiError(400,"Tweet is empty")
    }

    const tweet = await Tweet.create({
        content,
        owner : req.user?._id
    })

    if(!tweet){
        throw new apiError(500,"Error while creating tweet")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,tweet,"Tweet created successfully")
    )
})

const updateTweet = asyncHandler(async(req,res)=>{

    const {content} = req.body
    const {tweetId} = req.params

    if(!content){
        throw new apiError(400,"Content of tweet is empty")
    }

    if(!isValidObjectId(tweetId)){
        throw new apiError(400,"Invalid Tweet Id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new apiError(400,"Tweet not found")
    }

    if(tweet?.owner.toString() !== req.user._id.toString()){
        throw new apiError(400,"Only owner can update the tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweet?._id,
        {
            $set : {
                content
            }
        },
        {
            new : true
        }
    )

    if(!updateTweet){
        throw new apiError(500,"Error while updating tweet")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,updatedTweet,"Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async(req,res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new apiError(400,"Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new apiError(400,"Tweet not found")
    }

    if(tweet?.owner.toString() !== req.user?._id.toString()){
        throw new apiError(400,"Only owner can delete the tweet")
    }

    await Tweet.findByIdAndDelete(tweet?._id)

    await Like.deleteMany({
        tweet : tweet?._id
    })

    return res
    .status(200)
    .json(
        new apiResponse(200,{},"Tweet deleted successfully")
    )
})

const getUserTweet = asyncHandler(async(req,res) => {

    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new apiError(400,"Invalid tweet Id")
    }

    const tweet = await Tweet.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project : {
                            username : 1,
                            avatar : 1
                        }
                    }
                ]
            }
        },{
            $unwind : "$owner"
        },
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "tweet",
                as:"likes",
                pipeline : [
                    {
                        $project : {
                            likedBy : 1
                        }
                    }
                ]
            }
        },
        {
            $addFields : {
                likesCount : {
                    $size : "$likes"
                },
                isLiked : {
                    $cond : {
                        if : {
                            $in : [req.user?._id,"$likes.likedBy"]
                        },
                        then : true,
                        else : false
                    }
                },
                
            }
        },
        {
            $sort : {
                createdAt : -1
            }
        },
        {
            $project : {
                content : 1,
                owner : {
                    _id : 1,
                    username : 1,
                    avatar :1
                },
                createdAt:1,
                likesCount : 1,
                isLiked :1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(200,tweet,"Users tweet fetched")
    )
})



export {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweet
}