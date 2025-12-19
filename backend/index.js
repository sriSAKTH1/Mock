const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for simplicity
    methods: ["GET", "POST"],
  },
});

// Proxy route to bypass CORS for images
app.get("/proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("URL is required");

  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send("Error fetching image");
  }
});

// Store room state
const rooms = {};

// Helper to sanitize users (remove circular references)
function getSafeRoomUsers(users) {
  return users.map((u) => {
    const { disconnectTimeout, ...safeUser } = u;
    return safeUser;
  });
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createRoom", ({ username }) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[roomCode] = {
      users: [
        { id: socket.id, name: username, role: "ADMIN", isHost: true, online: true },
      ],
      state: {}, // Auction state
    };
    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode });
    io.to(roomCode).emit("roomUsersUpdated", getSafeRoomUsers(rooms[roomCode].users));
  });

  socket.on("joinRoom", ({ roomCode, username }) => {
    const room = rooms[roomCode];
    if (room) {
      const existingUser = room.users.find((u) => u.name === username);
      if (existingUser) {
        // Reconnect logic
        existingUser.id = socket.id;
        existingUser.online = true;
        if (existingUser.disconnectTimeout) clearTimeout(existingUser.disconnectTimeout);
      } else {
        room.users.push({
          id: socket.id,
          name: username,
          role: "SPECTATOR",
          online: true,
        });
      }
      socket.join(roomCode);
      socket.emit("roomJoined", { roomCode, status: "started" });
      io.to(roomCode).emit("roomUsersUpdated", getSafeRoomUsers(room.users));
    } else {
      socket.emit("errorMessage", "Room not found");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const user = room.users.find((u) => u.id === socket.id);
      if (user) {
        user.online = false;
        // user.disconnectTimeout = setTimeout(() => {
        //   room.users = room.users.filter((u) => u.id !== socket.id);
        //   io.to(roomCode).emit("roomUsersUpdated", getSafeRoomUsers(room.users));
        // }, 60000); // Remove after 1 min
        io.to(roomCode).emit("roomUsersUpdated", getSafeRoomUsers(room.users));
      }
    }
  });

  // Relay all auction events
  const relayEvents = [
    "startAuction",
    "pauseAuction",
    "resumeAuction",
    "stopAuction",
    "placeBid",
    "nextPlayer",
    "skipPlayer",
    "selectTeam",
  ];

  relayEvents.forEach((event) => {
    socket.on(event, (data) => {
      if (data.roomCode) {
        socket.to(data.roomCode).emit(event, data);
      }
    });
  });

  // State Sync
  socket.on("requestSync", ({ roomCode }) => {
    // Ask host to sync
    const room = rooms[roomCode];
    if (room) {
      const host = room.users.find((u) => u.isHost);
      if (host) {
        io.to(host.id).emit("requestSync", { requesterId: socket.id });
      }
    }
  });

  socket.on("syncState", ({ roomCode, targetId, state }) => {
     io.to(targetId).emit("syncState", state);
  });

  socket.on("startBreak", ({ roomCode, endTime }) => {
    io.to(roomCode).emit("breakStarted", { endTime });
  });

  socket.on("endBreak", ({ roomCode }) => {
    io.to(roomCode).emit("breakEnded");
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
