import { Router } from "express";
import { verifyJWT } from "../middleswares/auth.middleware";
import { uploadVideo } from "../controllers/video.controller";

const router = Router()

//secured video routes
router.route("/upload-video").post(verifyJWT,uploadVideo)