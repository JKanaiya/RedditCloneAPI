import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import "dotenv/config.js";
import cors from "cors";
import indexRouter from "../routes/indexRouter.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(indexRouter);
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

describe("Auth testing", () => {
  it("works with a user that already exists", async () => {
    const loginRes = await request(app)
      .post("/log-in")
      .send({
        email: "user@fakemail.com",
        password: "fakepassword1",
      })
      .expect(200);

    expect(loginRes.body).toEqual(
      expect.objectContaining({ email: "user@fakemail.com" }),
    );
  });

  it("does not auth a user with an incorrect password", async () => {
    const getToken = await request(app).post("/log-in").send({
      email: "user@fakemail.com",
      password: "fakerpassword",
    });
    const attemptAuth = await request(app)
      .post("/message")
      .send({
        token: getToken.body.token,
        name: "user",
        text: "Hi, this is a message",
        chatroomId: 12,
      })
      .expect(401);

    expect(attemptAuth.text).toBe("Unauthorized");
  });
});
