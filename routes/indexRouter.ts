import express from "express";
import { type Request, type Response } from "express";

import { logIn, signUp, logOut, passport } from "../controllers/auth.js";

const indexRouter = express.Router();

indexRouter.post("/log-in", logIn);
indexRouter.post("/sign-up", signUp);
indexRouter.get(
  "/auth-check",
  passport.authenticate("jwt", { session: false }),
  (req: Request, res: Response) => {
    res.status(200).json("authed");
  },
);

export default indexRouter;
