if (process.env.NODE_ENV !== "production") { // mulai sekarang pakai dotenv config kalau tidak pada masa production
  require("dotenv").config(); // ini harus di apply paling awal
}

const express = require("express");
const app = express();
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://koneksi-on.web.app"
        : "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 3000;


// const port = 3000;
const cors = require("cors");
const router = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(router);

app.use(errorHandler);




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


