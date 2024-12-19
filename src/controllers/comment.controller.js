import mongoose from "mongoose"
import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {Comment} from "../models/comment.model.js"
import { apiResponse } from "../utils/apiResponse.js"


const getVideoComments = asyncHandler(async(req,res) => {
    const {videoId} = req.params
    
    if(!isValidObjectId(videoId)){
        throw new apiError(400,"Invalid videoID")
    }

    const comments = await Comment.aggregate([
        {
            $match : {
                video : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $lookup:{
                from : "likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
        },
        {
            $addFields:{
                owner : {
                    $first : "$owner"
                },
                likesCount:{
                    $size:"$likes"
                },
                isLiked : {
                    $cond : {
                        $if : {
                            $in : [req.user?._id,"$likes.likedBy"]
                        },
                        then : true,
                        else : false,
                    }
                }
            }
        },
        {
            $sort : {createdAt:-1}
        },
        {
            $project : {
                content:1,
                createdAt:1,
                likesCount:1,
                isLiked:1,
                owner:{
                    username:1,
                    avatar:1
                }
            }
        }
    ])

    const options = {
        page : parseInt(page,10),
        limit:parseInt(limit,10)
    }

    const videoComments = await Comment.aggregatePaginate(comments,options)

    return res
    .status(200)
    .json(
        new apiResponse(200,videoComments,"Comments fetched successfully")
    )
})

const addComments = asyncHandler(async(req,res) => {

    const {content} = req.body
    const {videoId} = req.params


    // if(!isValidObjectId(videoId)){
    //     throw new apiError(400,"Invalid VideoId")
    // }

    const video = await Video.findById(videoId)

    if(!video){
        throw new apiError(400,"Video not found")
    }

    if(!content){
        throw new apiError(400,"Content is Empty")
    }

    const createdComment = await Comment.create({
        video:videoId,
        content,
        owner:req.user?._id
    })

    if(!createdComment){
        throw new apiError(500,"Error while creating comment")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,createdComment,"Comment created successfully")
    )

})

const updateComments = asyncHandler(async(req,res) => {
    const {content} = req.body
    const {commentId} = req.params


    // if(!isValidObjectId(videoId)){
    //     throw new apiError(400,"Invalid VideoId")
    // }


    if(!content){
        throw new apiError(400,"Content is Empty")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new apiError(400,"No comment found")
    }

    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new apiError(500,"Only the owner can update comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
           $set : {
            content,
           }
        },
        {
            $new:true
        }
    )

    if(!updatedComment){
        throw new apiError(500,"Error while updating comment")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,updatedComment,"Comment updated successfully")
    )
})


const deleteComments = asyncHandler(async(req,res) => {

    const {commentId} = req.params

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new apiError(400,"No comment found")
    }

    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new apiError(500,"Only the owner can update comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(comment?._id)

    if(!deletedComment){
        throw new apiError(500,"Error while deleting comment")
    }

    await Like.deleteMany({
        comment : comment?._id,
        owner:req.user?._id
    })


    return res
    .status(200)
    .json(
        new apiResponse(200,{},"Comment deleted successfully")
    )
})

export {
    getVideoComments,
    addComments,
    updateComments,
    deleteComments
}