import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";

import { faker } from "@faker-js/faker";
import request from "supertest";
import express from "express";
import "dotenv/config.js";
import cors from "cors";
import indexRouter from "../routes/indexRouter.js";

const randomEmail = faker.internet.email();

const app = express();

app.use(express.json());
app.use(cors());
app.use(indexRouter);
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

const user = {
  email: "user2@fakemail.com",
  password: "fakepassword3",
};

const passwords = {
  password1: await bcrypt.hash("fakepassword1", 10),
  password2: await bcrypt.hash("fakepassword2", 10),
};

const users = [
  {
    email: "user@fakemail.com",
    name: "fakename",
    password: passwords.password1,
  },
  {
    email: "user1@fakemail.com",
    name: "fakename1",
    password: passwords.password2,
  },
];

describe("Auth testing", () => {
  it("allows sign-ups with valid data", async () => {
    const signUpRes = await request(app)
      .post("/sign-up")
      .send({
        email: randomEmail,
        password: "fakepassword3",
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
        email: "user@fakemail.com",
        password: "fakepassword1",
      })
      .expect(200);

    const authCheck = await request(app)
      .get("/auth-check")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`);
    expect(authCheck.body).toBe("authed");
  });

  it("does not auth a user with an incorrect password", async () => {
    const loginRes = await request(app).post("/log-in").send({
      email: "user@fakemail.com",
      password: "fakingpassword",
    });
    const authCheck = await request(app)
      .get("/auth-check")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`);
    expect(authCheck.body).not.toBe("authed");
  });
});

describe("Subreddit + Post Testing", async () => {
  const loginRes = await request(app).post("/log-in").send({
    email: user.email,
    password: user.password,
  });

  let post;

  it("User can create a subreddit", async () => {
    const subreddit = await request(app)
      .post("/subreddit")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`)
      .send({
        email: "user@fakemail.com",
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
        email: "user@fakemail.com",
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
    post = posted.body.post;
  });

  it("Comments on existing posts, comments on existing comments, votes on comment", async () => {
    const comment = await request(app)
      .post("/comment")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`)
      .send({
        postId: post.id,
        email: users[0]!.email,
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
});

describe("Follow Requests", async () => {
  const loginRes = await request(app).post("/log-in").send({
    email: user.email,
    password: user.password,
  });

  it("Requests sent to user appear in the array.\nAccepted requests adds the sender to the user's followers array", async () => {
    const currentUserFollRequest = await request(app)
      .post("/follow-request")
      .set(`Authorization`, `Bearer ${loginRes.body.token}`)
      .send({
        receiver: randomEmail,
      });
    expect(currentUserFollRequest.body).toEqual(
      expect.objectContaining({ message: "Follow Request Sent" }),
    );

    const acceptedFollowRequest = await request(app)
      .get("/accept-follow-request")
      .query({ fRequestId: currentUserFollRequest.body.FollowRequest.id })
      .set(`Authorization`, `Bearer ${loginRes.body.token}`);
    expect(acceptedFollowRequest.body).toEqual(
      expect.objectContaining({ message: "Follow Request Accepted" }),
    );
  });
  it("Accepted requests adds the sender to the user's followers array", async () => {});
});
