import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { getPublicId } from "../utils/retrievePublicID.js";

const genarateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  /*
    take information about user from frontend
    check if all fields required are present
    check if user exist or not with help of email or username password
    check images and also avatar image
    upload them to clodinary, check if properly uploaded 
    create user object in db by using user.create method
    remove password and refersh token from the user object
    check if user object is properly created or not 
    if created return it
   */

  const { username, fullName, email, password } = req.body;
  // console.log(username , email)
  // console.log(req.body);

  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new apiError(409, "User already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path
  // console.log(req.files);
  /*
    optional chaining gives problem and if user doesnot upload coverimage 
    it stores the value undefined and also we later check while creating user
    */

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath, "user-avatar");
  const coverImage = await uploadOnCloudinary(
    coverImageLocalPath,
    "user-cover"
  );
  // console.log(avatar);
  // console.log(coverImage);
  // console.log(avatar);

  if (!avatar) {
    throw new apiError(400, "Avatar file not uploaded");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Something went wrong while creating user");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User Successfully Created"));
});

const loginUser = asyncHandler(async (req, res) => {
  /*
    first take login information such as username,email,password from req.body
    trim it check if all fields are present
    if all fields are present check if user exist or not
    if user exist loggin user and generate tokens and save in cookies
    if not give give 
    */

  // const {email , password , username} = req.body
  const { username, email, password } = req.body;

  // console.log(email,password,username);

  if (!username && !email) {
    throw new apiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new apiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new apiError(404, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await genarateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(201, {}, "User successfully loggedout"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  /*
    first take refresh token from req.cookie or req.body
    then check if we have refresh token
    use jwt.verify and it will return decoded token
    then find user by User.findyById(decodedtoken._id)
    if user exist 
    then check incomingRefreshToken and refreshToken from user are same
    */

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request");
  }

  try {
    const decodedtoken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedtoken?._id);

    if (!user) {
      throw new apiError(401, "Invalid refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh Token is expired or used");
    }

    const { accessToken, newRefreshToken } =
      await genarateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  /*
        first take old pass and new pass from req.body
        user can only change pass if he is logged in so we implement auth middleware and get 
        neccsary info about user by req.user
        then we check if oldpassword is correst by first finding the user from findbyid(req.user._id)
        and then use isPasswordCorrect method which is defined in user model
        it will return boolean value
        if oldpaasword in user database and oldpassword enterd by user is corrext then 
        user.password = newPassword
        it will also be hashed because we have defined a mongoose middleware save
        then save this ny user.save and use vallidateBeforeSave false so only password fiels is overwritten
    */

  const { oldPassword, newPassword } = req.body;
  // console.log(oldPassword,newPassword);

  const user = await User.findById(req.user._id);

  const isOldPassCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isOldPassCorrect) {
    throw new apiError(401, "Old Password is Incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password Change Succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current User Fetched Successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new apiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Account details succesfully updated"));
});

const updateAvatarImage = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is missing");
  }

  const userAvatar = await User.findById(req?.user?._id);
  const publicId = getPublicId(userAvatar?.avatar);
  // const publicId = userAvatar?.avatar?.split("/upload/")[1]?.split(".")[0]?.split("/")?.slice(1)?.join("/")
  // console.log(publicId + "    user-avatar link of previous image");

  const avatar = await uploadOnCloudinary(avatarLocalPath, "user-avatar");

  if (!avatar.url) {
    throw new apiError(400, "Error while uploading");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  // console.log(user);

  if (publicId) {
    deleteOnCloudinary(publicId);
  }

  return res
    .status(200)
    .json(new apiResponse(200, "Avatar file Updated Successfully", user));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const avatarCoverPath = req.file?.path;

  if (!avatarCoverPath) {
    throw new apiError(400, "Cover file is missing");
  }

  const userCover = await User.findById(req.user?._id);
  const publicId = userCover?.avatar
    ?.split("/upload/")[1]
    ?.split(".")[0]
    ?.split("/")
    ?.slice(1)
    ?.join("/");

  const cover = await uploadOnCloudinary(avatarCoverPath, "user-cover");

  if (!cover.url) {
    throw new apiError(400, "Error while uploading");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: cover.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  if (userCover) {
    deleteOnCloudinary(userCover);
  }

  return res
    .status(200)
    .json(new apiResponse(200, "Cover file Updated Successfully", user));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new apiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  console.log(channel);
  if (!channel?.length) {
    throw new apiError(404, "channel doesnot exist");
  }

  return res.status(200).json(new apiResponse(200, channel[0]));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched succesfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateAvatarImage,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
