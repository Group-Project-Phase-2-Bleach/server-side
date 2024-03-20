if (process.env.NODE_ENV !== "production") {
  require("dotenv").config(); 
}

// const port = 3000;
const express = require("express");
const app = express();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const cors = require("cors");
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


const authentication = require("./middlewares/authentication");
const profileAuthorization = require("./middlewares/profileAuthorization");
const deleteDirectMessageAuthorization = require("./middlewares/deleteDirectMessage");
const deletePublicMessageAuthorization = require("./middlewares/deletePublicMessage");

const UserController = require("./controllers/UserController");
const ProfileController = require("./controllers/ProfileController");
const MessageController = require("./controllers/MessageController");
const GroupController = require("./controllers/GroupController");

const errorHandler = require("./middlewares/errorHandler");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

app.post("/login", UserController.Login);
app.post("/register", UserController.Register);
app.post("/google-login", UserController.googleLogin);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello world" });
});

app.use(authentication)

app.get("/user", UserController.findCurrentlyLoggedUser);

app.get("/profile", ProfileController.getAllProfiles)
app.get("/profile/:username", ProfileController.getProfileByUsername)
app.post("/profile", upload.single("image"), ProfileController.createProfile)
app.put("/profile/:username",profileAuthorization, upload.single("image"), ProfileController.updateProfile)

app.get("/:username/message", MessageController.getDirectMessages)
app.post("/:username/message", upload.single("image"), MessageController.sendDirectMessage)
app.delete("/:id/message",deleteDirectMessageAuthorization, MessageController.deleteDirectMessage)

app.use("/group", GroupController.getAllPublicGroupMessage)
app.post("/group", upload.single("image"), GroupController.sendMessageToPublicGroup)
app.delete("/group/:id", deletePublicMessageAuthorization, GroupController.deletePublicGroupMessage)

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


module.exports = app;
