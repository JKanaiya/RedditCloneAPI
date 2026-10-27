import express from "express";
import "dotenv/config.js";
import cors from "cors";
import indexRouter from "./routes/indexRouter.js";

const app = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(cors());
app.use(indexRouter);
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

const PORT = process.env.HOST || 3000;
app.listen(PORT, () => {
  `Express listening on PORT: ${PORT}`;
});
