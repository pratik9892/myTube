import { Router } from "express";
import { verifyJWT } from "../middleswares/auth.middleware.js";
import {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweet
} from "../controllers/tweet.controller.js"

const router = Router()

router.route("/add-tweet").post(verifyJWT,createTweet)
router.route("/update-tweet/:tweetId").patch(verifyJWT,updateTweet)
router.route("/delete-tweet/:tweetId").delete(verifyJWT,deleteTweet)
router.route("/get-user-tweet/:userId").get(verifyJWT,getUserTweet)

export default router