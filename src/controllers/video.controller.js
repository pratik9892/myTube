import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model";
import { apiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary";
import { User } from "../models/user.model";
import { apiResponse } from "../utils/apiResponse";
import { getPublicId } from "../utils/retrievePublicID";
import { Comment } from "../models/comment.model";
import { Like } from "../models/like.model";

const uploadVideo = asyncHandler(async (req, res) => {
  // take title,description from user
  // file such as video and thumbnail
  //upload on cloudinary
  //create a document of video using video.create
  //check if video is created
  //send the response to the user and the video object

  const { title, description } = req.body;
  const videoLocalPath = req.file?.video[0]?.path;
  const thumbnailLocalPath = req.file?.thumbnail[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new apiError(400, "Video or thumbnail File missing");
  }

  const videoUrl = await uploadOnCloudinary(videoLocalPath, "user-video");
  const thumbnailUrl = await uploadOnCloudinary(
    thumbnailLocalPath,
    "user-thumbnail"
  );

  if (!videoUrl) {
    throw new apiError(501, "Video not uploaded");
  }

  if (!thumbnailUrl) {
    throw new apiError(500, "Thumbnail not uploaded");
  }

  const video = await Video.create({
    videoFile: videoUrl.url,
    thumbnail: thumbnailUrl.url,
    title,
    description,
    duration: videoUrl.duration,
    isPublished: false,
    owner: req.user?._id,
  });

  const uploadedVideo = await Video.findById(video._id);

  if (!uploadVideo) {
    throw new apiError(500, "Video not uploaded error");
  }

  return res
    .status(200)
    .json(new apiResponse(200, uploadedVideo, "Video uploaded succesfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  // retrieve videoid from params
  // calculate like,subs count,comments counts, issubscribed value
  // return all the value

  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "videoId not Found");
  }

  if (!isValidObjectId(req.user?._id)) {
    throw new apiError(400, "User not found");
  }

  const video = await Video.aggregate([
    {
      $match: new mongoose.Types.ObjectId(videoId),
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subsCount: {
                $size: { $ifNull: ["$subscribers", []] },
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              subsCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        $likesCount: {
          $size: { $ifNull: ["$likes", []] },
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            $if: {
              $in: [req.user?._id, "$likes.likedBy"],
            },
          },
          $then: true,
          $else: false,
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        duration: 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        likesCount: 1,
        owner: 1,
        isLiked: 1,
        comments: 1,
      },
    },
  ]);

  if (!video) {
    throw new apiError(500, "failed to fetch video");
  }

  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });

  return res
    .status(200)
    .json(new apiResponse(200, video[0], "video fetched by id successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError("Invalid video Id");
  }

  if (!title && !description) {
    throw new apiError(400, "title and description are required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new apiError(400, "Videoid doesnot exist");
  }

  if (video?.owner?.toString() !== req.user?._id.toString()) {
    throw new apiError(400, "Only the owner can edit the video");
  }

  const oldThumbnailPublicId = getPublicId(video?.thumbnail);
  const newThumbnailLocalPath = req.file.path;

  if (!newThumbnailLocalPath) {
    throw new apiError(400, "Thumbnail image not uploaded properly");
  }

  const thumbnail = await uploadOnCloudinary(newThumbnailLocalPath);

  if (!thumbnail) {
    throw new apiError(500, "Error while uploading thumbnail image");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail: thumbnail.url,
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new apiError(500, "Error while updating video");
  }

  if (updatedVideo) {
    await deleteOnCloudinary(oldThumbnailPublicId);
  }

  return res
    .status(200)
    .json(new apiResponse(200, updatedVideo, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "invalid videoid");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new apiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new apiError("only the owner of these video can delete the video");
  }

  const videoPublicId = getPublicId(video?.videoFile);
  const thumbnailPublicId = getPublicId(video?.thumbnail);

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new apiError(500, "Video deletion unsuccessful");
  }

  const delVidRes = await deleteOnCloudinary(videoPublicId, "video");
  const delThumbRes = await deleteOnCloudinary(thumbnailPublicId);

  if (!delVidRes || !delThumbRes) {
    throw new apiError(
      500,
      "Error while deleting video and thumbnail in cloudinary"
    );
  }

  await Comment.deleteMany({
    video : videoId
  })

  await Like.deleteMany({
    video:videoId
  })

  return res
  .status(200)
  .json(
    new apiResponse(200,{},"Video Deleted successfully")
  )

});

const toggleIsPublished = asyncHandler(async (req,res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new apiError(400,"invalid videoid")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new apiError(404,"Video not found")
    }

    if(video.owner.toString() !== req.user?._id.toString()){
        throw new apiError(400,"Only owner can delete the video")
    }

     const isPublishedToogled = await Video.findByIdAndUpdate(
        videoId,
        {
            $set : {
                isPublished : !video.isPublished
            }
        },
        {
            new : true
        }
    )

    if(!isPublishedToogled){
        throw new apiError(500,"Error while toggling isPublished")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,{
            isPublished : isPublishedToogled.isPublished
        },"isPublished toggled successfully")
    )
})

export { 
    uploadVideo, 
    getVideoById, 
    updateVideo, 
    deleteVideo,
    toggleIsPublished
};
