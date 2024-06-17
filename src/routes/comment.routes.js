import { Router } from "express";
import { verifyJWt } from "../middlewares/auth_middleware.js";
import {upload} from "../middlewares/multer_middleware.js";

const router = Router()

router.use(verifyJWt , upload.none()) //apply verifyJWT and multer middleware throughout the file

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);


export default router