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
    try {
      const subreddit = await prisma.subReddit.findFirst({
        where: {
          name: subName,
        },
      });
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

const getFollowingPosts = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: req.user.id,
        },
        include: { following: true },
      });

      const ids = user?.following.map((user) => user.id);

      const posts = await prisma.post.findMany({
        where: {
          userId: { in: ids },
        },
      });
      if (posts) {
        res.status(200).json(posts);
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

// model FollowRequest {
//   id         Int  @id @default(autoincrement())
//   receiver   User @relation("FollowRequests", fields: [receiverId], references: [id])
//   sender     User @relation("SentRequest", fields: [senderId], references: [id])
//   receiverId Int
//   senderId   Int
// }

const createFollowRequest = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const { receiverEmail } = req.body;
    try {
      const receiver = await prisma.user.findFirst({
        where: {
          email: receiverEmail,
        },
        include: {
          followRequests: true,
        },
      });
      if (receiver) {
        const followRequest = await prisma.followRequest.create({
          data: {
            receiverId: receiver.id,
            senderId: req.user.id,
          },
        });
        const requestSent = await prisma.user.update({
          where: {
            id: receiver.id,
          },
          data: {
            followRequests: {
              set: [...receiver.followRequests, followRequest],
            },
          },
          include: {
            followRequests: true,
          },
        });
        res.status(200).json({
          message: "Follow Request Sent",
          requestSent,
        });
      } else {
        throw new Error();
      }
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  },
];

const rejectFollowRequest = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const followRequest = await prisma.followRequest.findFirst({
        where: {
          id: Number(req.query.follReqId),
        },
      });
      if (followRequest) {
        const sender = await prisma.user.findFirst({
          where: {
            id: followRequest.senderId,
          },
        });
        if (req.user.id == followRequest.receiverId && sender != null) {
          const denier = await prisma.user.findFirst({
            where: {
              id: req.user.id,
            },
            include: {
              followers: true,
            },
          });
          await prisma.followRequest.delete({
            where: {
              id: followRequest.id,
            },
          });
          res.status(200).json({ message: "Follow Request Rejected", denier });
        }
      } else {
        throw new Error();
      }
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  },
];

const acceptFollowRequest = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const followRequest = await prisma.followRequest.findFirst({
        where: {
          id: Number(req.query.follReqId),
        },
      });
      if (followRequest) {
        const sender = await prisma.user.findFirst({
          where: {
            id: followRequest.senderId,
          },
        });
        if (req.user.id == followRequest.receiverId && sender != null) {
          const receiver = await prisma.user.findFirst({
            where: {
              id: req.user.id,
            },
            include: {
              followers: true,
            },
          });
          const addFollower = await prisma.user.update({
            where: {
              id: req.user.id,
            },
            data: {
              followers: {
                set: [...receiver.followers, sender],
              },
            },
            include: {
              followers: true,
            },
          });
          await prisma.followRequest.delete({
            where: {
              id: followRequest.id,
            },
          });
          res
            .status(200)
            .json({ message: "Follow Request Accepted", addFollower });
        }
      } else {
        throw new Error();
      }
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  },
];

const updateUser = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const { newName } = req.body;
    try {
      const user = await prisma.user.update({
        where: {
          email: req.user.email,
        },
        data: {
          name: newName,
        },
      });
      res.status(200).json({ message: "Name Changed", user });
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
  createFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowingPosts,
  updateUser,
};
