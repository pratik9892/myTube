import mongoose,{isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {Comment} from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import { apiResponse } from "../utils/apiResponse.js"


const toggleVideoLike = asyncHandler(async(req,res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new apiError(400,"Invalid videoId")
    }

    const prevVideoLike = await Like.findOne({
        video : videoId,
        likedBy : req.user?._id
    })

    if(prevVideoLike){
        await Like.findByIdAndDelete(prevVideoLike._id)

        return res.
        status(200)
        .json(
            new apiResponse(200,{isLiked:false},"Unliked successfully")
        )
    }

    const videoLike = await Like.create({
        video : videoId,
        likedBy : req.user?._id
    })

    if(!videoLike){
        throw new apiError(500,"Error while Liking video")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,{isLiked:true},"Liked Successfully")
    )
})


const toggleCommentLike = asyncHandler(async(req,res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new apiError(400,"Invalid videoId")
    }

    const prevCommentLike = await Like.findOne({
        comment : commentId,
        likedBy : req.user?._id
    })

    if(prevCommentLike){
        await Like.findByIdAndDelete(prevCommentLike._id)

        return res.
        status(200)
        .json(
            new apiResponse(200,{isLiked:false},"Unliked successfully")
        )
    }

    const commentLike = await Like.create({
        comment : commentId,
        likedBy : req.user?._id
    })

    if(!commentLike){
        throw new apiError(500,"Error while Liking video")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,{isLiked:true},"Liked Successfully")
    )
})

const toggleTweetLike = asyncHandler(async(req,res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new apiError(400,"Invalid videoId")
    }

    const prevtweetLike = await Like.findOne({
        tweet : tweetId,
        likedBy : req.user?._id
    })

    if(prevtweetLike){
        await Like.findByIdAndDelete(prevtweetLike._id)

        return res.
        status(200)
        .json(
            new apiResponse(200,{isLiked:false},"Unliked successfully")
        )
    }

    const tweetLike = await Like.create({
        tweet : tweetId,
        likedBy : req.user?._id
    })

    if(!tweetLike){
        throw new apiError(500,"Error while Liking video")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,{isLiked:true},"Liked Successfully")
    )
})

const getAllLikedVideo = asyncHandler(async(req,res) => {

    const {userId} = req.params
    
    if(!isValidObjectId(userId)){
        throw new apiError(400,"Invalid user id")
    }

    const likedvideo = await Like.aggregate([
        {
            $match : {
                likedBy : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from : "videos",
                localField:"video",
                foreignField:"_id",
                as:"video", 
                pipeline:[
                    {
                        $lookup : {
                            from :"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"ownerDetails"
                        }
                    },
                    {
                        $unwind : "$ownerDetails"
                    }
                ]
            },
        },
        {
            $unwind : "$video"
        },
        {
            $sort : {createdAt : 1}
        },
        {
            $project : {
                _id:0,
                video:{
                    videoFile:1,
                    title:1,
                    description:1,
                    thumbnail:1,
                    duration:1,
                    views:1,
                    createdAt:1,
                    isPublished:1,
                    ownerDetails:{
                        username:1,
                        fullName:1,
                        avatar:1
                    }
                }
            }
        }


        // experiment
        // {
        //     $lookup : {
        //         from : "users",
        //         localField:"likedBy",
        //         foreignField:"_id",
        //         as:"ownerdetails"
        //     }
        // }




        // original
        // {
        //     $lookup : {
        //         from : "videos",
        //         localField:"video",
        //         foreignField:"_id",
        //         as:"likedVideos",
        //         pipeline : [
        //             {
        //                 $lookup : {
        //                     from : "users",
        //                     localField:"owner",
        //                     foreignField:"_id",
        //                     as:"ownerDetails"
        //                 }
        //             },
        //             {
        //                 $unwind:"$ownerDetails"
        //             }
        //         ]
        //     },
        // },
        // {
        //     $unwind : "$likedVideos"
        // },
        // {
        //     $sort : {createdAt : -1}
        // },
        // {
        //     $project : {
        //         _id : 0,
        //         Likedvideo : {
        //             videoFile:1,
        //             title:1,
        //             description:1,
        //             views:1,
        //             duration:1,
        //             thumbnail:1,
        //             owner:1,
        //             isPublished:1,
        //             ownerDetails : {
        //                 username:1,
        //                 fullName:1,
        //                 avatar : 1
        //             }
        //         }
        //     }
        // }
    ])

    console.log(likedvideo);
    

    return res
    .status(200)
    .json(
        new apiResponse(200,likedvideo,"Fetched all liked videos")
    )

    

})




export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getAllLikedVideo
}