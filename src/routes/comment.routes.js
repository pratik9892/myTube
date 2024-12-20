import {Router} from "express"
import { verifyJWT } from "../middleswares/auth.middleware.js";
import {
    getVideoComments,
    addComments,
    updateComments,
    deleteComments
} from "../controllers/comment.controller.js"

const router = Router()

router.route("/get-comments/:videoId").get(verifyJWT,getVideoComments)
router.route("/add-comments/:videoId").post(verifyJWT,addComments)
router.route("/update-comments/:commentId").patch(verifyJWT,updateComments)
router.route("/delete-comment/:commentId").delete(verifyJWT,deleteComments)

export default router