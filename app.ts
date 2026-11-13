import "dotenv/config.js";
import cors from "cors";
import indexRouter from "./routes/indexRouter.js";
import express, { type NextFunction } from "express";
import passport from "passport";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(cors());
app.use(indexRouter);
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://odinmessagingapp.netlify.app",
    ],
    credentials: true,
  },
});

io.use((socket, next) => {
  passport.authenticate("jwt", { session: false })(
    socket.request,
    socket.request.response || {},
    (err: any, user: any) => {
      if (err || !user) {
        return next(new Error("Authentication error"));
      }
      // Attach user to the socket request for later use
      socket.request.user = user;
      next();
    },
  );
});

io.on("connection", (socket) => {
  // TODO: THis needs some structure, make a first draft and work from there
  socket.on("user_page", async (post) => {
    console.log(socket.connected);
  });
  socket.on("comment_added", async (comment) => {});
  socket.on("connect_error", (err) => {
    // the reason of the error, for example "xhr poll error"
    console.log(err.message);

    // some additional description, for example the status code of the initial HTTP response
    console.log(err.description);

    // some additional context, for example the XMLHttpRequest object
    console.log(err.context);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Express listening on PORT: ${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  io.close(() => {
    httpServer.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
});
