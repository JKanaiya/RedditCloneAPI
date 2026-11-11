import bcrypt from "bcryptjs";
import { prisma } from "../controllers/prisma.js";
import { faker } from "@faker-js/faker";

// TODO: Add a user, maybe the spectator user as well to the posters followers[]

const createRandomPosts = () => {
  return {
    title: faker.book.title(),
    text: faker.lorem.lines(1),
  };
};

const createRandomUserData = () => {
  const name = faker.person.firstName();
  const email = faker.internet.email();
  return {
    name,
    email,
    password: "",
  };
};

const createPosts = (count: number) => {
  const posts = [];
  for (let n = 0; n <= count; n++) {
    const post = createRandomPosts();
    posts.push(post);
  }
  return posts;
};

const createUsers = (count: number) => {
  const users = [];
  for (let n = 0; n <= count; n++) {
    const user = createRandomUserData();
    user.password = `fakepassword${n}`;
    users.push(user);
  }
  return users;
};

const users = createUsers(15);
const posts = createPosts(7);

async function main() {
  // await prisma.vote.deleteMany({});
  // await prisma.comment.deleteMany({});
  // await prisma.post.deleteMany({});
  // await prisma.subReddit.deleteMany({});
  // await prisma.user.deleteMany({
  //   where: {
  //     NOT: {
  //       email: "bla123@fakemail.com",
  //     },
  //   },
  // });

  // const prismaUsers = await prisma.user.findMany({});
  // const commentlessPosts = await prisma.post.findMany({});
  //
  //
  // let n = 0;
  // for (let i = 66; i <= 79; i++) {
  //   console.log(commentlessPosts[n]);
  //   const subComment = await prisma.comment.upsert({
  //     where: {
  //       id: i + 7,
  //       parentCommentId: i,
  //     },
  //     update: {},
  //     create: {
  //       text: faker.vehicle.bicycle(),
  //       userId: prismaUsers[n]!.id,
  //       postId: commentlessPosts[n]!.id,
  //       created: now.toISOString(),
  //       parentCommentId: i,
  //     },
  //   });
  //   if (commentlessPosts[n + 1] != undefined) {
  //     n++;
  //   }
  // }

  const now = new Date();
  users.map(async (user) => {
    const bla = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        name: user.name,
        password: await bcrypt.hash(user.password, 10),
      },
    });
  });

  const sub1 = await prisma.subReddit.upsert({
    where: {
      id: 1,
    },
    update: {},
    create: {
      name: "0thSubreddit",
    },
  });

  const sub2 = await prisma.subReddit.upsert({
    where: {
      id: 2,
    },
    update: {},
    create: {
      name: "nthSubreddit",
    },
  });

  const user1 = await prisma.user.findFirst({
    where: {
      email: users[0]!.email,
    },
  });

  const user2 = await prisma.user.findFirst({
    where: {
      email: users[1]!.email,
    },
  });

  const prismaUsers = await prisma.user.findmany({});

  for (let i = 0; i < 7; i++) {
    const post = await prisma.post.upsert({
      where: {
        id: i,
      },
      update: {},
      create: {
        subRedditId: i % 2 == 0 ? sub1.id : sub2.id,
        text: posts[i]!.text,
        title: posts[i]!.title,
        created: now.toISOString(),
        userId: i % 2 == 0 ? user1!.id : user2!.id,
      },
    });
    prismaUsers.map(async (user) => {
      await prisma.vote.create({
        data: {
          userId: user.id,
          postId: post.id,
          positive: i % 2 == 0,
        },
      });
    });
  }

  const commentlessPosts = await prisma.post.findMany({});

  for (let i = 0; i < 7; i++) {
    const comment = await prisma.comment.upsert({
      where: {
        id: i,
        postId: i,
      },
      update: {},
      create: {
        text: faker.vehicle.bicycle(),
        userId: prismaUsers[i]!.id,
        postId: commentlessPosts[i]!.id,
        created: now.toISOString(),
      },
    });
    prismaUsers.map(async (user) => {
      await prisma.vote.create({
        data: {
          userId: user.id,
          commentId: comment.id,
          positive: i % 2 == 0,
        },
      });
    });
    const subComment = await prisma.comment.upsert({
      where: {
        id: i + 7,
        parentCommentId: i,
      },
      update: {},
      create: {
        text: faker.vehicle.bicycle(),
        userId: prismaUsers[i + 1]!.id,
        postId: commentlessPosts[i]!.id,
        created: now.toISOString(),
      },
    });
  }

  const baseUser = await prisma.user.findFirst({
    where: {
      email: "bla123@fakemail.com",
    },
    include: {
      following: true,
    },
  });
  if (baseUser) {
    const filteredUsers = prismaUsers.filter(
      (user) => user.email != baseUser.email,
    );
    await prisma.user.update({
      where: {
        id: baseUser.id,
      },
      data: {
        following: {
          set: [...baseUser?.following, ...filteredUsers],
        },
      },
      include: { following: true },
    });
  } else {
    console.log("create base user");
  }
}

main()
  .then(async () => {
    // await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e);
    // await prisma.$disconnect()
    // process.exit(1)
  });
