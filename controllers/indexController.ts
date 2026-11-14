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
const getUsers = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        include: {
          followers: true,
          following: true,
          posts: { include: { votes: true } },
          followRequests: { include: { receiver: true, sender: true } },
          sentFollowRequests: { include: { receiver: true, sender: true } },
        },
      });
      res.status(200).json(users);
    } catch (e) {
      res.status(400).json({ error: e, message: "Failed to Get Users" });
    }
  },
];

const getPosts = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const posts = await prisma.post.findMany({
        include: {
          votes: true,
          comments: { include: { subComments: true } },
          user: true,
        },
      });
      res.status(200).json(posts);
    } catch (e) {
      res.status(400).json({ error: e, message: "Failed to Get Posts" });
    }
  },
];

const getComments = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const { postId } = req.query;
    try {
      const post = await prisma.post.findFirst({
        where: {
          id: Number(postId),
        },
        include: {
          comments: {
            include: {
              subComments: {
                include: {
                  votes: true,
                  subComments: {
                    include: {
                      votes: true,
                      subComments: {
                        include: {
                          votes: true,
                          User: true,
                        },
                      },
                      User: true,
                    },
                  },
                  User: true,
                },
              },
              votes: true,
              User: true,
            },
          },
          user: true,
          votes: true,
        },
      });
      res.status(200).json(post?.comments);
    } catch (e) {
      res.status(400).json({ error: e, message: "Failed to Get Comments" });
    }
  },
];

const subreddits = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const subreddits = await prisma.subReddit.findMany({
        include: {
          posts: true,
        },
      });
      res.status(200).json(subreddits);
    } catch (e) {
      res.status(400).json({ error: e, message: "Failed to Get Subreddits" });
    }
  },
];

const subscribe = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const { name } = req.body;
    try {
      const user = await prisma.user.findFirst({
        where: { email: req.user?.email },
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

const comment = async (postId: number, text: string, user) => {
  const now = new Date();
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
          userId: user.id,
          created: now.toISOString(),
        },
      });
      return { message: "Commented on Post", comment };
    } else {
      throw new Error();
    }
  } catch (e) {
    console.log(e);
    return "Error: " + e;
  }
};

const subComment = async (commentId: number, text: string, user) => {
  const now = new Date();
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
          userId: user.id,
          postId: comment.postId,
          created: now.toISOString(),
        },
      });
      return { message: "Commented on Comment", subComment };
    } else {
      throw new Error();
    }
  } catch (e) {
    console.log(e);
    return "Error: " + e;
  }
};

const subredditPost = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const now = new Date();
    const { title, text, subName, imageUrl } = req.body;
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
            postImageUrl: imageUrl,
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
        include: { votes: true },
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

const deleteVote = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const { commentId, postId } = req.query;
    try {
      if (postId) {
        const post = await prisma.post.findFirst({
          where: {
            id: Number(postId),
          },
        });
        if (post) {
          const userVote = await prisma.vote.findFirst({
            where: {
              userId: req.user?.id,
              postId: post.id,
            },
          });
          if (userVote) {
            await prisma.vote.delete({
              where: {
                id: userVote.id,
              },
            });
          }
        }
      } else if (commentId) {
        const comment = await prisma.comment.findFirst({
          where: {
            id: Number(commentId),
          },
        });
        if (comment) {
          const userVote = await prisma.vote.findFirst({
            where: {
              userId: req.user?.id,
              commentId: comment.id,
            },
          });
          if (userVote) {
            await prisma.vote.delete({
              where: {
                id: userVote.id,
              },
            });
          }
        }
      } else {
        throw new Error(
          "Could not find related vote, the vote should have an existing comment or post id sent",
        );
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
        const userVote = await prisma.vote.findFirst({
          where: {
            userId: req.user?.id,
            postId: post.id,
          },
        });
        if (userVote) {
          const vote = await prisma.vote.update({
            where: {
              id: userVote.id,
            },
            data: {
              positive,
            },
          });
          res.status(200).json({ message: "Updated Vote on Post", vote });
        } else {
          const vote = await prisma.vote.create({
            data: {
              positive,
              postId,
              userId: req.user?.id,
            },
          });
          res.status(200).json({ message: "Voted on Post", vote });
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
        const userVote = await prisma.vote.findFirst({
          where: {
            userId: req.user?.id,
            commentId: comment.id,
          },
        });
        if (userVote) {
          const vote = await prisma.vote.update({
            where: {
              id: userVote.id,
            },
            data: {
              positive,
            },
          });
          res.status(200).json({ message: "Updated Vote on Comment", vote });
        } else {
          const vote = await prisma.vote.create({
            data: {
              positive,
              commentId,
              userId: req.user?.id,
            },
          });
          res.status(200).json({ message: "Voted on Comment", vote });
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

const updatePost = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const now = new Date();
    const { postId, text, title, imageUrl } = req.body;
    console.log(text);
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: req.user?.id,
        },
      });
      const post = await prisma.post.findFirst({
        where: {
          id: postId,
        },
      });

      if (user && post && user.id == post.userId) {
        const oldDate = new Date(post?.created);
        const diff = Math.abs(now - oldDate) / 60 / 1000;
        // edits done within 3 minutes of creation do not result in an "edited" value
        const updated = await prisma.post.update({
          where: {
            id: postId,
          },
          data: {
            text: text,
            title: title,
            edited: diff > 3 ? now.toISOString() : null,
            postImageUrl: imageUrl,
          },
        });
        res.status(200).json({
          message: "Post Updated",
          updated,
        });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  },
];

const updateComment = async (commentId: number, text: string, user) => {
  const now = new Date();
  try {
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
      },
    });

    if (user && comment && user.id == comment.userId) {
      const oldDate = new Date(comment?.created);
      const diff = Math.abs(now - oldDate) / 60 / 1000;
      // edits done within 3 minutes of creation do not result in an "edited" value
      const updated = await prisma.comment.update({
        where: {
          id: commentId,
        },
        data: {
          text: text,
          edited: diff > 3 ? now.toISOString() : null,
        },
      });
      return {
        message: "Comment Updated",
        updated,
      };
    }
  } catch (e) {
    console.log(e);
    return "Error: " + e;
  }
};

// NOTE: this would be the functionality to delete a comment,
// but there is a value in the user's deleted comment leaving a space for the
// conversation it spawned, so "deleting" a comment just replaces the text with
// 'comment deleted'

// const deleteComment = [
//   passport.authenticate("jwt", { session: false }),
//   async (req: Request, res: Response) => {
//     const { commentId } = req.query;
//     try {
//       const user = await prisma.user.findFirst({
//         where: {
//           id: req.user?.id,
//         },
//       });
//       const comment = await prisma.comment.findFirst({
//         where: {
//           id: commentId,
//         },
//       });
//       if (user && comment && user.id == comment.userId) {
//         await prisma.vote.deleteMany({
//           where: {
//             commentId,
//           },
//         });
//         const deleted = await prisma.comment.delete({
//           where: {
//             id: commentId,
//           },
//         });
//         res.status(200).json({
//           message: "Comment Deleted",
//           deleted,
//         });
//       }
//     } catch (e) {
//       console.log(e);
//       res.status(400).json(e);
//     }
//   },
// ];

const deletePost = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: req.user.id,
        },
      });
      if (user) {
        const post = await prisma.post.update({
          where: {
            id: Number(req.query.postId),
          },
          data: {
            text: "Post has been deleted.",
            title: "Post has been deleted",
            edited: new Date().toISOString(),
          },
        });
        res.json(post);
      } else {
        throw new Error("Could not connect this user to the specified post");
      }
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  },
];

const deleteComment = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: req.user.id,
        },
      });
      if (user) {
        const postComment = await prisma.comment.update({
          where: {
            id: Number(req.query.commentId),
          },
          data: {
            text: "Comment has been deleted.",
            edited: new Date().toISOString(),
          },
        });
        res.json(postComment);
      } else {
        throw new Error("Could not connect this user to the specified comment");
      }
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  },
];

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
        const frExists = await prisma.followRequest.findFirst({
          where: {
            receiverId: receiver.id,
            senderId: req.user.id,
          },
        });
        if (!frExists) {
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
          throw new Error("Follow request already exists");
        }
      } else {
        throw new Error("Incorrect receiver id sent");
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

const unfollowUser = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const { otherUserId } = req.body;
    try {
      const otherUser = await prisma.user.findFirst({
        where: { id: otherUserId },
      });
      const user = await prisma.user.findFirst({
        where: { id: req.user.id },
        include: {
          following: true,
        },
      });

      const foundFollower = user?.following.find((u) => u.id == otherUser.id);
      if (otherUser && foundFollower) {
        const removedUserArray = user.following.filter(
          (user) => user.id != otherUser.id,
        );

        const updatedFollowing = await prisma.user.update({
          where: {
            id: req.user.id,
          },
          data: {
            following: { set: [...removedUserArray] },
          },
        });
        res.status(200).json({ message: "Unfollowed User", updatedFollowing });
      } else {
        throw new Error("Other User is not following the User");
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

const setProfileImg = [
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const profileUpdated = await prisma.user.update({
        where: {
          id: req.user?.id,
        },
        data: {
          profileImageUrl: req.body.piUrl,
        },
      });
      res.status(200).json(profileUpdated);
    } catch (e) {
      res.status(400).json(e);
    }
  },
];

export {
  createSubreddit,
  subscribe,
  comment,
  subreddits,
  subredditPost,
  subComment,
  deleteComment,
  deletePost,
  updateComment,
  updatePost,
  setProfileImg,
  postVote,
  commentVote,
  deleteVote,
  createFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowingPosts,
  updateUser,
  unfollowUser,
  getPosts,
  getComments,
  getUsers,
};
