import {Router} from "express";
import { verifyJWT } from "../middleswares/auth.middleware.js";
import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getAllLikedVideo
} from "../controllers/like.controller.js"

const router = Router()

router.route("/toggle-video-like/:videoId").post(verifyJWT,toggleVideoLike)
router.route("/toggle-comment-like/:commentId").post(verifyJWT,toggleCommentLike)
router.route("/toggle-tweet-like/:tweetId").post(verifyJWT,toggleTweetLike)
router.route("/all-liked-videos/:userId").post(verifyJWT,getAllLikedVideo)



export default router
