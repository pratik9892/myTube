import { Router } from "express";
import { verifyJWT } from "../middleswares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getPlaylistbyUserId, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router()

router.route("/create-playlist").post(verifyJWT,createPlaylist)
router.route("/update-playlist/:playlistId").patch(verifyJWT,updatePlaylist)
router.route("/delete-playlist/:playlistId").delete(verifyJWT,deletePlaylist)
router.route("/add-video/:playlistId/:videoId").patch(verifyJWT,addVideoToPlaylist)
router.route("/remove-video/:playlistId/:videoId").patch(verifyJWT,removeVideoFromPlaylist)
router.route("/get-playlist-videos/:playlistId").get(verifyJWT,getPlaylistById)
router.route("/get-playlist-user/:userId").get(verifyJWT,getPlaylistbyUserId)

export default router