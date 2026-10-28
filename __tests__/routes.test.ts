import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../controllers/prisma.js";
import bcrypt from "bcryptjs";

import { faker } from "@faker-js/faker";
import request from "supertest";
import express from "express";
import "dotenv/config.js";
import cors from "cors";
import indexRouter from "../routes/indexRouter.js";
import { acceptFollowRequest } from "../controllers/indexController.js";

const createRandomUserData = () => {
  const name = faker.person.firstName();
  const email = faker.internet.email();
  return {
    name,
    email,
    password: "",
  };
};

const createUsers = async (count: number) => {
  let users = [];
  for (let n = 0; n <= count; n++) {
    const user = createRandomUserData();
    user.password = `fakepassword${n}`;
    users.push(user);
  }
  return users;
};

const users = await createUsers(5);

const app = express();

app.use(express.json());
app.use(cors());
app.use(indexRouter);
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

describe("Auth testing", () => {
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        name: users[0]!.name,
        email: users[0]!.email,
        password: await bcrypt.hash(users[0]!.password, 10),
      },
    });
    await prisma.user.create({
      data: {
        name: users[1]!.name,
        email: users[1]!.email,
        password: await bcrypt.hash(users[1]!.password, 10),
      },
    });
  });

  it("allows sign-ups with valid data", async () => {
    const signUpRes = await request(app)
      .post("/sign-up")
      .send({
        email: users[2]!.email,
        password: users[2]!.password,
      })
      .expect(200);

    expect(signUpRes.body).toEqual(
      expect.objectContaining({ message: "Registration Successful" }),
    );
  });

  it("login with a user that already exists", async () => {
    const loginRes = await request(app)
      .post("/log-in")
      .send({
        email: users[0]!.email,
        password: users[0]!.password,
      })
      .expect(200);

    const authCheck = await request(app)
      .get("/auth-check")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`);
    expect(authCheck.body).toBe("authed");
  });

  it("does not auth a user with an incorrect password", async () => {
    const loginRes = await request(app).post("/log-in").send({
      email: users[0]!.email,
      password: "fakingpassword",
    });
    const authCheck = await request(app)
      .get("/auth-check")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`);
    expect(authCheck.body).not.toBe("authed");
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({});
    } catch (error) {
      console.error(error);
    }
  });
});

describe("Subreddit + Post Testing", async () => {
  let post;
  beforeAll(async () => {
    const now = new Date();

    const user1 = await prisma.user.create({
      data: {
        name: users[2]!.name,
        email: users[2]!.email,
        password: await bcrypt.hash(users[2]!.password, 10),
      },
    });

    await prisma.subReddit.create({
      data: { id: 500, name: "0thSub" },
    });

    post = await prisma.post.create({
      data: {
        subRedditId: 500,
        text: "Wow, i can hear my voice echo in this void.",
        title: "Hello?",
        created: now.toISOString(),
        userId: user1!.id,
      },
    });
  });

  const loginRes = await request(app).post("/log-in").send({
    email: users[2]!.email,
    password: users[2]!.password,
  });

  it("User can create a subreddit", async () => {
    const subreddit = await request(app)
      .post("/subreddit")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`)
      .send({
        email: users[2]!.email,
        name: "firstSub",
      });
    expect(subreddit.body).toEqual(
      expect.objectContaining({ message: "Subreddit Created" }),
    );
  });

  it("User can subscribe to subreddit", async () => {
    const subscribed = await request(app)
      .post("/subscribe")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`)
      .send({
        email: users[2]!.email,
        name: "firstSub",
      });
    expect(subscribed.body).toEqual(
      expect.objectContaining({ message: "Subscribed to Subreddit" }),
    );
  });
  it("User can post to subreddit", async () => {
    const posted = await request(app)
      .post("/sub-post")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`)
      .send({
        subName: "firstSub",
        text: "i am a post to this subreddit",
        title: "This is a post",
      });

    expect(posted.body).toEqual(
      expect.objectContaining({ message: "Posted to Subreddit" }),
    );
  });

  it("Comments on existing posts, comments on existing comments, votes on comment", async () => {
    const comment = await request(app)
      .post("/comment")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`)
      .send({
        postId: post.id,
        email: users[2]!.email,
        text: "I am a comment on this post",
      });
    expect(comment.body).toEqual(
      expect.objectContaining({ message: "Commented on Post" }),
    );

    const subComment = await request(app)
      .post("/sub-comment")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`)
      .send({
        commentId: comment.body.comment.id,
        text: "I am a comment on this comment",
      });
    expect(subComment.body).toEqual(
      expect.objectContaining({ message: "Commented on Comment" }),
    );

    const vote = await request(app)
      .post("/vote-comment")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`)
      .send({
        commentId: comment.body.comment.id,
        positive: true,
      });
    expect(vote.body).toEqual(
      expect.objectContaining({ message: "Voted on Comment" }),
    );
  });
  it("Votes on Post", async () => {
    const vote = await request(app)
      .post("/vote-post")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`)
      .send({
        postId: post.id,
        positive: true,
      });
    expect(vote.body).toEqual(
      expect.objectContaining({ message: "Voted on Post" }),
    );
  });
  afterAll(async () => {
    try {
      await prisma.vote.deleteMany({});
      await prisma.comment.deleteMany({});
      await prisma.post.deleteMany({});
      await prisma.subReddit.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.error(error);
    }
  });
});

describe("Follow Requests", async () => {
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        name: users[3]!.name,
        email: users[3]!.email,
        password: await bcrypt.hash(users[3]!.password, 10),
      },
    });

    await prisma.user.create({
      data: {
        name: users[4]!.name,
        email: users[4]!.email,
        password: await bcrypt.hash(users[4]!.password, 10),
      },
    });
  });

  const loginRes = await request(app).post("/log-in").send({
    email: users[3]!.email,
    password: users[3]!.password,
  });

  const secondUser = await request(app).post("/log-in").send({
    email: users[4]!.email,
    password: users[4]!.password,
  });

  it("Requests sent to other user are added to their follow request array.\nAccepted requests adds the sender to the user's followers array", async () => {
    const currentUserFollRequest = await request(app)
      .post("/follow-request")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`)
      .send({
        receiverEmail: users[4]!.email,
      });

    expect(
      currentUserFollRequest.body.requestSent.followRequests.length,
    ).toBeGreaterThan(0);

    const acceptedFollowRequest = await request(app)
      .get("/accept-follow-request")
      .set(`Authorization`, `Bearer ${secondUser.body.token}`)
      .query({
        follReqId: currentUserFollRequest.body.requestSent.followRequests[0].id,
      });

    expect(acceptedFollowRequest.body.addFollower.followers[0]).toEqual(
      expect.objectContaining({ email: users[3]!.email }),
    );
  });
  afterAll(async () => {
    try {
      await prisma.followRequest.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.error(error);
    }
  });
});

describe("User Profile", async () => {
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        name: users[3]!.name,
        email: users[3]!.email,
        password: await bcrypt.hash(users[3]!.password, 10),
      },
    });
  });

  const loginRes = await request(app).post("/log-in").send({
    email: users[3]!.email,
    password: users[3]!.password,
  });

  it("User can update profile name", async () => {
    const user = await request(app)
      .patch("/user")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`)
      .send({
        newName: faker.person.firstName,
      });
    expect(user.body).toEqual(
      expect.objectContaining({ message: "Name Changed" }),
    );
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({});
    } catch (error) {
      console.error(error);
    }
  });
});
