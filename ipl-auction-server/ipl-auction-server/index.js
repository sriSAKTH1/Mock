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

    // Check if user is reconnecting (by checking if they were previously disconnected or if they are just new)
    // Actually, simple join logic: just add them or update them.
    // For now, let's treat every join as a new active connection or a reconnection of a dropped user if we could identify them.
    // Since we don't have persistent IDs (auth), we rely on socket ID which changes on reconnect.
    // However, the user might want to "reclaim" a spot if they provide the same username?
    // Let's stick to simple logic: Add user.
    
    // Check if this username already exists in the room (maybe disconnected)
    const existingUserIndex = room.users.findIndex(u => u.name === username && !u.online);
    
    if (existingUserIndex !== -1) {
        // Reconnection Logic
        const user = room.users[existingUserIndex];
        const oldSocketId = user.id;
        
        user.id = socket.id; // Update socket ID
        user.online = true;
        user.isBot = false; // Cancel bot mode if active
        if (user.disconnectTimeout) {
            clearTimeout(user.disconnectTimeout);
            delete user.disconnectTimeout;
        }
        console.log(`User reconnected: ${username}`);
        
        // Update teams map if they had a team
        Object.keys(room.teams).forEach(teamId => {
             if (room.teams[teamId] === oldSocketId) {
                 room.teams[teamId] = socket.id;
             }
        });
    } else {
        // New User
        room.users.push({ id: socket.id, name: username, role: "PLAYER", online: true });
    }

    socket.join(roomCode);
    socket.join(roomCode);

    // Emit success event to the joining user with room status
    socket.emit("roomJoined", {
      roomCode,
      username,
      status: room.status,
      teams: room.teams,
      users: room.users
    });

    io.to(roomCode).emit("roomUsersUpdated", room.users);
  });

  socket.on("selectTeam", ({ roomCode, team }) => {
    const room = rooms[roomCode];
    if (!room) return;
    // Allow re-selection if the team is currently assigned to a disconnected user (bot mode pending)
    // Or if currently assigned to this socket.
    if (room.teams[team] && room.teams[team] !== socket.id) {
        // Check if the current owner is offline?
        const ownerId = room.teams[team];
        const owner = room.users.find(u => u.id === ownerId);
        if (owner && owner.online) return; // Team taken by online user
        
        // If owner is offline, we could potentially allow stealing? 
        // For now, stick to standard logic: if key exists, it's taken.
        return; 
    }
    room.teams[team] = socket.id;
    io.to(roomCode).emit("teamUpdated", room.teams);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    Object.keys(rooms).forEach((roomCode) => {
      const room = rooms[roomCode];
      if (!room) return;

      const userIndex = room.users.findIndex((u) => u.id === socket.id);
      if (userIndex !== -1) {
          const user = room.users[userIndex];
          user.online = false;
          user.lastSeen = Date.now();
          
          // Start Timeout for Bot Mode (3 minutes = 180000ms)
          // User asked for 3 to 5 mins. Let's do 3 mins.
          user.disconnectTimeout = setTimeout(() => {
              if (!user.online) {
                  user.isBot = true;
                  io.to(roomCode).emit("userBotMode", { userId: user.id, name: user.name });
                  io.to(roomCode).emit("roomUsersUpdated", room.users);
                  console.log(`User ${user.name} switched to Bot Mode`);
              }
          }, 180000); 

          // Do NOT remove user immediately.
          // room.users = room.users.filter((u) => u.id !== socket.id);
          
          // Do NOT remove from teams immediately either.
          /*
          Object.keys(room.teams).forEach((team) => {
            if (room.teams[team] === socket.id) {
              delete room.teams[team];
            }
          });
          */
          
          io.to(roomCode).emit("roomUsersUpdated", room.users);
          // io.to(roomCode).emit("teamUpdated", room.teams); // Teams stay assigned
      }
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

  socket.on("requestSync", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room && room.host) {
      io.to(room.host).emit("requestSync", { requesterId: socket.id });
    }
  });

  socket.on("syncState", ({ roomCode, targetId, state }) => {
     io.to(targetId).emit("syncState", state);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
