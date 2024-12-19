import { Router } from "express";
import { verifyJWT } from "../middleswares/auth.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, toggleIsPublished, updateVideo, uploadVideo } from "../controllers/video.controller.js";
import { upload } from "../middleswares/multer.middleware.js";

const router = Router()

//secured video routes
router.route("/upload-video").post(verifyJWT,upload.fields([
    {
        name : "video",
        maxCount : 1
    },
    {
        name : "thumbnail",
        maxCount:1
    }
]),uploadVideo)
router.route("/update-video/:videoId").patch(verifyJWT,upload.single("thumbnail"),updateVideo)
router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo)
router.route("/video/:videoId").get(verifyJWT,getVideoById) 
router.route("/toggle-status/:videoId").patch(verifyJWT,toggleIsPublished)
router.route("/allvideos").get(verifyJWT,getAllVideos)


export default router