import express from "express";
import { type Request, type Response } from "express";

import { logIn, signUp, logOut, passport } from "../controllers/auth.js";
import {
  createSubreddit,
  subscribe,
  comment,
  subredditPost,
  subComment,
  postVote,
  commentVote,
  createFollowRequest,
  acceptFollowRequest,
  updateUser,
} from "../controllers/indexController.js";

const indexRouter = express.Router();

indexRouter.get(
  "/auth-check",
  passport.authenticate("jwt", { session: false }),
  (req: Request, res: Response) => {
    res.status(200).json("authed");
  },
);
indexRouter.get("/accept-follow-request", acceptFollowRequest);
indexRouter.post("/sign-up", signUp);
indexRouter.post("/subreddit", createSubreddit);
indexRouter.post("/subscribe", subscribe);
indexRouter.post("/comment", comment);
indexRouter.post("/sub-post", subredditPost);
indexRouter.post("/sub-comment", subComment);
indexRouter.post("/log-in", logIn);
indexRouter.post("/vote-post", postVote);
indexRouter.post("/vote-comment", commentVote);
indexRouter.post("/follow-request", createFollowRequest);
indexRouter.patch("/user", updateUser);

export default indexRouter;
