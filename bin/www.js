const app = require("../app");
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://koneksi-on.web.app",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 3000;

io.on("connection", (socket) => {
  console.log({ status: `User Connected.` });

  socket.on("sendMessage", (data) => {

    io.emit("broadcastMessage", data);
  });

  socket.on("deleteMessage", (data) => {
    io.emit("broadcastDelete", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

httpServer.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
