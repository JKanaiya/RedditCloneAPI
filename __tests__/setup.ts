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

beforeAll(async () => {
  await prisma.user.create({
    data: {
      name: users[0]!.name,
      email: users[0]!.email,
      password: users[0]!.password,
    },
  });
  await prisma.user.create({
    data: {
      name: users[1]!.name,
      email: users[1]!.email,
      password: users[1]!.password,
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: {},
  });
  const user = await prisma.user.findMany();
  console.log(user);
});

export { request };
