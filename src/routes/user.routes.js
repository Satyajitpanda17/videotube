import { Router } from "express";
import { 
   changeCurrentPassword, 
   getCurrentUser, 
   getUserChannelProfile, 
   getWatchHistory, 
   loginUser, 
   logoutUser, 
   registerUser, 
   updateAccountDetails, 
   updateUserAvatar, 
   updateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer_middleware.js";
import { verifyJWt } from "../middlewares/auth_middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(
    upload.fields([
     {
        name:"avatar",
        maxCount:1
     },
     {
        name:"coverImage",
        maxCount:1
     }
    ]),
    registerUser)

    router.route("/login").post(loginUser)

    //secured routes
    router.route("/logout").post(verifyJWt , logoutUser)
    router.route("/refresh-token").post(refreshAccessToken)
    router.route("/change-password").post(verifyJWt , changeCurrentPassword)
    router.route("/current-user").get(verifyJWt , getCurrentUser)
    router.route("/update-account").patch(verifyJWt , updateAccountDetails)
    router.route("/avatar").patch(verifyJWt , upload.single("avatar") , updateUserAvatar)
    router.route("/cover-image").get(verifyJWt , getUserChannelProfile)
    router.route("/history").get(verifyJWt , getWatchHistory)

    
export default router