import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // In-memory state (for demo purposes, since user declined Firebase)
  let doubts: any[] = [];

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Send initial data
    socket.emit("init", doubts);

    socket.on("create-doubt", (doubt) => {
      doubts.push(doubt);
      io.emit("doubt-created", doubt);
    });

    socket.on("answer-doubt", ({ doubtId, answer, facultyId, facultyName }) => {
      const doubt = doubts.find((d) => d.id === doubtId);
      if (doubt) {
        doubt.status = "answered";
        doubt.answer = answer;
        doubt.facultyId = facultyId;
        doubt.facultyName = facultyName;
        io.emit("doubt-updated", doubt);
      }
    });

    socket.on("send-message", ({ doubtId, message }) => {
      const doubt = doubts.find((d) => d.id === doubtId);
      if (doubt) {
        doubt.messages.push(message);
        io.emit("message-received", { doubtId, message });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
