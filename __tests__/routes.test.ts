import { describe, it, expect } from "vitest";
import { prisma } from "../controllers/prisma.js";
import { afterAll } from "vitest";
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

const user = {
  email: "user@fakemail.com",
  password: "fakepassword1",
};

describe("Auth testing", () => {
  it("allows sign-ups with valid data", async () => {
    const signUpRes = await request(app)
      .post("/sign-up")
      .send({
        email: user.email,
        password: user.password,
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

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {},
    });
  });
});
