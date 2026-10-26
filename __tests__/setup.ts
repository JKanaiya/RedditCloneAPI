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

beforeAll(async () => {
  const usera = await prisma.user.create({
    data: {
      name: "user",
      email: "user@fakemail.com",
      password: passwords.password1,
    },
  });
  await prisma.user.create({
    data: {
      name: "userb",
      email: "userb@fakemail.com",
      password: passwords.password2,
    },
  });
  await prisma.chatroom.create({
    data: {
      id: 12,
      userId: usera.id,
    },
  });
});

afterAll(async () => {
  // NOTE: the date in the test setup needs to be deleted in the inverted sequence of its creation
  await prisma.message.deleteMany({});
  await prisma.chatroom.deleteMany({});
  await prisma.user.deleteMany({});
});

export { request };
