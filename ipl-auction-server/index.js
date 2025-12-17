import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

// Simple image proxy to avoid ORB/CORB issues with external hosts
app.get("/proxy", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || typeof url !== "string") {
      res.status(400).send("Missing url");
      return;
    }
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        Accept: "image/*,*/*;q=0.8",
      },
    });
    if (!upstream.ok) {
      res.status(upstream.status).send("Upstream error");
      return;
    }
    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.set("Access-Control-Allow-Origin", "*");
    res.send(buf);
  } catch (e) {
    res.status(500).send("Proxy failure");
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createRoom", ({ username }) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    rooms[roomCode] = {
      host: socket.id,
      users: [{ id: socket.id, name: username, role: "HOST" }],
      teams: {},
      status: "waiting",
    };

    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode });
    io.to(roomCode).emit("roomUsersUpdated", rooms[roomCode].users);
  });

  socket.on("joinRoom", ({ roomCode, username }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit("errorMessage", "Room not found");
      return;
    }

    room.users.push({ id: socket.id, name: username, role: "PLAYER" });
    socket.join(roomCode);

    io.to(roomCode).emit("roomUsersUpdated", room.users);
  });

  socket.on("selectTeam", ({ roomCode, team }) => {
    const room = rooms[roomCode];
    if (!room) return;
    if (room.teams[team]) return;
    room.teams[team] = socket.id;
    io.to(roomCode).emit("teamUpdated", room.teams);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    Object.keys(rooms).forEach((roomCode) => {
      const room = rooms[roomCode];
      if (!room) return;
      room.users = room.users.filter((u) => u.id !== socket.id);
      Object.keys(room.teams).forEach((team) => {
        if (room.teams[team] === socket.id) {
          delete room.teams[team];
        }
      });
      io.to(roomCode).emit("roomUsersUpdated", room.users);
      io.to(roomCode).emit("teamUpdated", room.teams);
    });
  });

  socket.on("startAuction", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    io.to(roomCode).emit("auctionStarted");
  });

  socket.on("nextPlayer", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    io.to(roomCode).emit("nextPlayerUpdate");
  });

  socket.on("pauseAuction", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    io.to(roomCode).emit("auctionPaused");
  });

  socket.on("resumeAuction", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    io.to(roomCode).emit("auctionResumed");
  });

  socket.on("stopAuction", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    io.to(roomCode).emit("auctionStopped");
  });

  socket.on("placeBid", ({ roomCode, bid }) => {
    const room = rooms[roomCode];
    if (!room) return;
    io.to(roomCode).emit("bidUpdate", bid);
  });

  socket.on("skipPlayer", ({ roomCode, playerId, timestamp }) => {
    const room = rooms[roomCode];
    if (!room) return;
    io.to(roomCode).emit("playerSkipped", { playerId, timestamp });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
