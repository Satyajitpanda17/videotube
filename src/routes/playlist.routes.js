import {Router} from "express";
import { verifyJWt } from "../middlewares/auth_middleware.js";
import { getPlaylistById, 
        updatePlaylist , 
        deletePlaylist,
        addVideoToPlaylist,
        removeVideoFromPlaylist,
        getUserPlaylist
    } from "../controllers/playlist.controller.js";

import { upload } from "../middlewares/multer_middleware.js";
const router = Router();

router.use(verifyJWt, upload.none());

router.route("/").post(createPlaylist);

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route("/user/:userId").get(getUserPlaylist);

export default router;
