import {Playlist} from "../models/playlist.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"

const createPlaylist = asyncHandler(async(req,res) => {

    const {title,description} = req.body

    if(!title && !description){
        throw new apiError(400,"Title or Description not provided")
    }

    const playlist = await Playlist.create({
        title,
        description,
        owner : req.user?._id
    })

    if(!playlist){
        throw new apiError(500,"Error while creating playlist")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,playlist,"Playlist Created")
    )
})


const updatePlaylist = asyncHandler(async(req,res) => {

    const {title,description} = req.body
    const {playlistId} = req.params

    if(!title && !description){
        throw new apiError(400,"Title or Description not provided")
    }

    if(!isValidObjectId(playlistId)){
        throw new apiError(400,"Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new apiError(400,"Playlist not found")
    }

    if(playlist?.owner.toString() !== req.user._id.toString()){
        throw new apiError(400,"Owner can only update these playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $set : {
                title,
                description
            }
        },
        {
            new : true
        }
    )

    if(!updatedPlaylist){
        throw new apiError(500,"Error while updating playlist")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,updatedPlaylist,"Playlist updates successfully")
    )
})

const deletePlaylist = asyncHandler(async(req,res) => {
     const {playlistId} = req.params

     if(!isValidObjectId(playlistId)){
        throw new apiError(400,"Invalid playlist Id")
     }

     const playlist = await Playlist.findById(playlistId)

     if(!playlist){
        throw new apiError(400,"Playlist not found")
     }
    // console.log(playlist);
     
    //  console.log(req.user?._id + "  user id");
    //  console.log(playlist?._id + "     playlist id");
     
     
     if(playlist?.owner.toString() !== req.user?._id.toString()){
        throw new apiError(400,"Only owner can delete these playlist")
     }

     await Playlist.findByIdAndDelete(playlist._id)

     return res
     .status(200)
     .json(
        new apiResponse(200,{},"Playlist deleted successfully")
     )
})


const addVideoToPlaylist = asyncHandler(async(req,res) => {

    const {videoId} = req.params
    const {playlistId} = req.params

    if(!isValidObjectId(videoId)){
        throw new apiError(400,"Invlaid videoId")
    }

    if(!isValidObjectId(playlistId)){
        throw new apiError(400,"Invlaid playlistId")
    }

    const video = await Video.findById(videoId)
    
    if(!video){
        throw new apiError(400,"Video not found")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new apiError(400,"Playlist not found")
    }

    if(playlist?.owner.toString() !== req.user?._id.toString()){
        throw new apiError("Only owner can add video to playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet : {
                videos : videoId
            }
        },
        {
            new : true
        }
    )

    if(!updatedPlaylist){
        throw new apiError(500,"Error while adding video to playlist!! Try again")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,updatedPlaylist,"Video added to playlist")
    )

})

const removeVideoFromPlaylist = asyncHandler(async(req,res) => {
    const {videoId} = req.params
    const {playlistId} = req.params

    if(!isValidObjectId(videoId)){
        throw new apiError(400,"Invlaid videoId")
    }

    if(!isValidObjectId(playlistId)){
        throw new apiError(400,"Invlaid playlistId")
    }

    const video = await Video.findById(videoId)
    
    if(!video){
        throw new apiError(400,"Video not found")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new apiError(400,"Playlist not found")
    }

    if(playlist?.owner.toString() !== req.user?._id.toString()){
        throw new apiError("Only owner can add video to playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull : {
                videos : videoId
            }
        },
        {
            new : true
        }
    )

    if(!updatedPlaylist){
        throw new apiError(500,"Error while removing video to playlist!! Try again")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,updatedPlaylist,"Video removed from playlist")
    )
})

const getPlaylistById = asyncHandler(async(req,res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new apiError(400,"Invlaid playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new apiError(400,"Playlist not found")
    }

    const playlistFull = await Playlist.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "videos",
                foreignField:"_id",
                as:"video",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as:"owner"
                        }
                    },
                ]
            }
        },
        {
            $addFields : {
                totalVideos : {
                    $size : "$video"
                } , 
                totalViews : {
                    $sum : "$video.views"
                }
            }
        },
        // {
        //     $addFields: {
        //         totalVideos: { $size: "$video" }, // Count the total number of videos
        //         totalViews: { 
        //             $sum: "$video.views" // Sum up all the `views` fields in the `video` array
        //         }
        //     }
        // },
        {
            $project : {
                title : 1,
                description :1,
                createdAt:1,
                totalVideos:1,
                owner:1,
                totalViews:1,
                video : {
                _id:1,
               videoFile:1,
                title:1,
                duration:1,
                thumbnail:1,
                description:1,
                createdAt:1,
                views:1,
                owner : {
                    fullName:1,
                    username:1,
                    avatar:1
                }
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(200,playlistFull,"Fetched playlist by ID")
    )

})

const getPlaylistbyUserId = asyncHandler(async(req,res) => {

    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new apiError(400,"Invalid user id")
    }

    const playlistByUser = await Playlist.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField:"videos",
                foreignField:"_id",
                as: "videos"
            }
        },
        {
            $addFields : {
                totalVideos : {
                    $size : "$videos"
                },
                totalViews : {
                    $sum : "$videos.views"
                },
                // thumbnail : {
                //     $first : 
                // }
            }
        },
        {
            $project : {
                _id : 1,
                title:1,
                description:1,
                totalViews :1,
                totalVideos:1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(200,playlistByUser,"Fetched playlist of user")
    )

})

export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    getPlaylistbyUserId
}