import jwt from "jsonwebtoken";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { body, validationResult } from "express-validator";
import { prisma } from "./prisma.js";
import passport from "passport";
import bcrypt from "bcryptjs";
import type { NextFunction, Response, Request } from "express";

type UserPayload = {
  email: String;
  password: String;
};

const validateUserForm = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Email must match this format emailhere@gmail.com"),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must have a minimum of 8 characters"),
  body("passwordConfirm")
    .trim()
    .custom((val, { req }) => {
      return val === req.body.password;
    })
    .withMessage("Passwords do not match!"),
];

// TODO: Add the form validation for the posts

const opts: any = {
  // fromAuthHeaderAsBearerToken() creates a new extractor that looks for the JWT
  // in the authorization header with the scheme 'bearer'pts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          email: jwt_payload.email,
        },
      });
      if (!user) {
        return void done(null, false, { message: "No such user email exists" });
      }

      const match = await bcrypt.compare(jwt_payload.password, user.password);
      // console.log(match);
      // const equalEmail = jwt_payload.email === user.email;
      // const equalPass = await bcrypt.compare(
      //   jwt_payload.password,
      //   user.password,
      // );
      // console.log("Ee: " + equalEmail);
      // console.log("Ep: " + equalPass);
      // const val = await bcrypt.hash(jwt_payload.password, 10);
      // console.log(await bcrypt.compare(val, user.password));

      if (!match) {
        return void done(Error, user, { message: "Incorrect password" });
      }

      return void done(null, user);
    } catch (err) {
      console.log("error" + err);
      return void done(null, false, { message: "Error in authorizing user" });
    }
  }),
);

const logOut = function (req: Request, res: Response, next: NextFunction) {
  req.logout((err) => {
    if (err) {
      return void next(err);
    }
    return void res.status(200).json("User Logged out successfully");
  });
};

const logIn = async (req: Request, res: Response) => {
  const payload = {
    email: req.body.email,
    password: req.body.password,
  };
  const secretKey: string = process.env.SECRET as string;

  jwt.sign(payload, secretKey, { expiresIn: "3h" }, async (err, token) => {
    if (err) {
      console.log("error" + err);
      return void res.status(400).json({ error: err });
    } else {
      const user = await prisma.user.findFirst({
        where: {
          email: req.body.email,
        },
      });
      return void res.status(200).json({ token, user: user });
    }
  });
  return;
};

const signUp = async (req: Request, res: Response) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        errors: errors.array(),
      });
      return;
    }

    const userExists = await prisma.user.findFirst({
      where: {
        email: req.body.email,
      },
    });

    if (!userExists) {
      const user = await prisma.user.create({
        data: {
          name: req.body.name || req.body.email,
          email: req.body.email,
          password: hashedPassword,
          // spectator: req.body.spectator ? true : false,
        },
      });
      res.status(200).json({ message: "Registration Successful", user });
      return;
    } else {
      res.status(400).json("Email is already associated with an account");
      return;
    }
  } catch (err) {
    res.status(500).json({ "Error in registering user": err });
    return;
  }
};

export { signUp, logOut, logIn, validateUserForm, passport };
