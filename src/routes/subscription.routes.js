import { Router } from 'express';
import { verifyJWt } from '../middlewares/auth_middleware.js';
import {
         getSubscribedChannels, 
         getUserChannelSubscribers, 
         toggleSubscription } from '../controllers/subscription.controller.js';
const router = Router();
router.use(verifyJWt);

router
    .route("/c/:channelId")
    .get(getSubscribedChannels)
    .post(toggleSubscription);

router.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default router