import type { Request, Response } from "express";
import { prisma } from "./prisma";
import passport from "passport";

const createSubreddit = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const { name } = req.body;

    try {
      const subreddit = await prisma.subReddit.create({
        data: {
          name,
        },
      });
      res.status(200).json({ message: "Subreddit Created", subreddit });
    } catch (e) {
      res.status(400).json(e);
    }
  },
];

const subscribe = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const { email, name } = req.body;
    try {
      const user = await prisma.user.findFirst({
        where: { email: email },
      });
      if (user) {
        const subreddit = await prisma.subReddit.findFirst({
          where: {
            name: name,
          },
          include: {
            subscribers: true,
          },
        });
        if (subreddit) {
          const subscribed = await prisma.subReddit.update({
            where: {
              id: subreddit.id,
            },
            data: {
              subscribers: { set: [...subreddit.subscribers, user] },
            },
          });

          res
            .status(200)
            .json({ message: "Subscribed to Subreddit", subscribed });
        }
      } else {
        throw new Error();
      }
    } catch (e) {
      res.status(400).json({ error: e, message: "Failed to Subscribe" });
    }
  },
];

const comment = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const { email, text, postId } = req.body;
    try {
      const post = await prisma.post.findFirst({
        where: {
          id: postId,
        },
      });
      if (post) {
        const comment = await prisma.comment.create({
          data: {
            postId: post.id,
            text,
            userId: req.user.id,
          },
        });
        res.status(200).json({ message: "Commented on Post", comment });
      } else {
        throw new Error();
      }
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  },
];

const subComment = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const { text, commentId } = req.body;
    try {
      const comment = await prisma.comment.findFirst({
        where: {
          id: commentId,
        },
      });
      if (comment) {
        const subComment = await prisma.comment.create({
          data: {
            parentCommentId: comment.id,
            text,
            userId: req.user.id,
            postId: comment.postId,
          },
        });
        res.status(200).json({ message: "Commented on Comment", subComment });
      } else {
        throw new Error();
      }
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  },
];

const subredditPost = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const now = new Date();
    const { title, text, subName } = req.body;
    console.log(title);
    try {
      const subreddit = await prisma.subReddit.findFirst({
        where: {
          name: subName,
        },
      });
      console.log(subreddit);
      if (subreddit) {
        const post = await prisma.post.create({
          data: {
            title,
            text,
            userId: req.user.id,
            created: now.toISOString(),
            subRedditId: subreddit.id,
          },
        });
        res.status(200).json({ message: "Posted to Subreddit", post });
      } else {
        throw new Error();
      }
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  },
];

const postVote = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const { positive, postId } = req.body;
    try {
      const post = await prisma.post.findFirst({
        where: {
          id: postId,
        },
      });
      if (post) {
        const vote = await prisma.vote.create({
          data: {
            positive,
            postId,
            userId: req.user.id,
          },
        });
        res.status(200).json({ message: "Voted on Post", vote });
      } else {
        throw new Error();
      }
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  },
];

const commentVote = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const { positive, commentId } = req.body;
    try {
      const comment = await prisma.comment.findFirst({
        where: {
          id: commentId,
        },
      });
      if (comment) {
        const vote = await prisma.vote.create({
          data: {
            positive,
            commentId,
            userId: req.user.id,
          },
        });
        res.status(200).json({ message: "Voted on Comment", vote });
      } else {
        throw new Error();
      }
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  },
];

export {
  createSubreddit,
  subscribe,
  comment,
  subredditPost,
  subComment,
  postVote,
  commentVote,
};
