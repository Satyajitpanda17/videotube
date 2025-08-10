import {Router} from "express";
import { verifyJWt } from "../middlewares/auth_middleware.js";
import { 
        deleteVideo, 
        getAllVideos, 
        getVideoById, 
        publishAVideo, 
        togglePublishStatus, 
        updateVideo } from "../controllers/video.controller.js";
        
import { upload } from "../middlewares/multer_middleware.js";
const router = Router();

router.use(verifyJWt);

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);


export default router