import "dotenv/config.js";
import cors from "cors";
import indexRouter from "./routes/indexRouter.js";
import express, { type NextFunction } from "express";
import passport from "passport";
import { Server } from "socket.io";
import { createServer } from "http";
import {
  subComment,
  updateComment,
  comment,
} from "./controllers/indexController.js";

const app = express();
app.use(express.json());
app.use(cors());
app.use(indexRouter);
app.use(passport.initialize());
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  },
});

// io.use((socket, next) => {
//   passport.authenticate("jwt", { session: false })(
//     socket.request,
//     socket.request.response || {},
//     (err: any, user: any) => {
//       if (err || !user) {
//         return next(new Error("Authentication error"));
//       }
//       // Attach user to the socket request for later use
//       socket.request.user = user;
//       next();
//     },
//   );
// });

io.engine.use((req: Request, res: Request, next: NextFunction) => {
  const isHandshake = req._query.sid === undefined;
  if (isHandshake) {
    passport.authenticate("jwt", { session: false })(req, res, next);
  } else {
    next();
  }
});

io.on("connection", (socket) => {
  socket.on("edit-comment", async (comment) => {
    try {
      await updateComment(comment.commentId, comment.text, socket.request.user);
      io.emit("updated-comments");
      console.log("did it fire");
    } catch (e) {
      console.log("Error" + e);
    }
  });

  socket.on("comment-on-post", async (c) => {
    try {
      await comment(c.postId, c.text, socket.request.user);
      io.emit("updated-comments");
    } catch (e) {
      console.log("Error" + e);
    }
  });

  socket.on("comment-on-comment", async (comment) => {
    try {
      await subComment(comment.commentId, comment.text, socket.request.user);
      io.emit("updated-comments");
    } catch (e) {
      console.log("Error" + e);
    }
  });
  socket.on("connect_error", (err) => {
    // the reason of the error, for example "xhr poll error"
    console.log(err.message);

    // some additional description, for example the status code of the initial HTTP response
    console.log(err.description);

    // some additional context, for example the XMLHttpRequest object
    console.log(err.context);
  });
});

io.engine.on("connection_error", (err) => {
  console.log(err.req); // the request object
  console.log(err.code); // the error code, for example 1
  console.log(err.message); // the error message, for example "Session ID unknown"
  console.log(err.context); // some additional error context
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
