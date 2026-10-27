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
} from "../controllers/indexController.js";

const indexRouter = express.Router();

indexRouter.post("/log-in", logIn);
indexRouter.get(
  "/auth-check",
  passport.authenticate("jwt", { session: false }),
  (req: Request, res: Response) => {
    res.status(200).json("authed");
  },
);
indexRouter.post("/sign-up", signUp);
indexRouter.post("/subreddit", createSubreddit);
indexRouter.post("/subscribe", subscribe);
indexRouter.post("/comment", comment);
indexRouter.post("/sub-post", subredditPost);
indexRouter.post("/sub-comment", subComment);
indexRouter.post("/vote-post", postVote);
indexRouter.post("/vote-comment", commentVote);

export default indexRouter;
