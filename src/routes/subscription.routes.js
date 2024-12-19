import { Router } from "express";
import {
    toggleSubscription,
    getAllSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"

import { verifyJWT } from "../middleswares/auth.middleware.js";

const router = Router()

router.route("/toggle-subscription/:channelId").post(verifyJWT,toggleSubscription)
router.route("/subscribers-list/:channelId").post(verifyJWT,getAllSubscribers)
router.route("/subscribed-channel/:subscriberId").post(verifyJWT,getSubscribedChannels)





export default router