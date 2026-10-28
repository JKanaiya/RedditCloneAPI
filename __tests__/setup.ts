import { beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import "dotenv/config";
import supertest, { type SuperTest, Test } from "supertest";
import { prisma } from "../controllers/prisma.js";

let request: SuperTest<Test>;

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

const now = new Date();

// beforeAll(async () => {
//   const user1 = await prisma.user.create({
//     data: {
//       name: users[0]!.name,
//       email: users[0]!.email,
//       password: users[0]!.password,
//     },
//   });
//   await prisma.subReddit.create({
//     data: { id: 500, name: "0thSub" },
//   });
//   await prisma.post.create({
//     data: {
//       subRedditId: 500,
//       text: "Wow, i can hear my voice echo in this void.",
//       title: "Hello?",
//       created: now.toISOString(),
//       userId: user1!.id,
//     },
//   });
// });
//
// afterAll(async () => {
//   try {
//     await prisma.followRequest.deleteMany({});
//     await prisma.vote.deleteMany({});
//     await prisma.comment.deleteMany({});
//     await prisma.post.deleteMany({});
//     await prisma.subReddit.deleteMany({});
//     await prisma.user.deleteMany({});
//   } catch (error) {
//     console.error(error);
//   }
// });

export { request };
