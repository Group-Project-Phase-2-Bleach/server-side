if (process.env.NODE_ENV !== "production") {
  // mulai sekarang pakai dotenv config kalau tidak pada masa production
  require("dotenv").config(); // ini harus di apply paling awal
}
const { PrivateMessage, User, Profile } = require("./models");
const imgurClientId = process.env.imgurClientId;

const express = require("express");
const app = express();
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://appchat-bleach.web.app/"
        : "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 3000;

// const port = 3000;
const cors = require("cors");
const router = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const { Op } = require("sequelize");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(router);

app.use(errorHandler);

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);
  socket.on("sendMessage", async ({ text, file, username, senderId }) => {
    try {
      const findReceivedUser = await User.findOne({
        where: { username: username },
      });
      if (!findReceivedUser) {
        throw { name: "CustomError", status: 404, message: "User not Found." };
      }

      if (file) {
        const base64Image = file.split(",")[1];
        const imageBuffer = Buffer.from(base64Image, "base64");

        const { data } = await axios.post(
          "https://api.imgur.com/3/image",
          {
            image: base64Image,
            type: "base64",
          },
          {
            headers: {
              Authorization: "Client-ID " + imgurClientId,
            },
          }
        );

        const linkImgur = data.data.link;

        const sendPrivateMessage = await PrivateMessage.create({
          text,
          SenderId: req.user.id,
          ReceiverId: findReceivedUser.id,
          imgUploadPriv: linkImgur,
        });
        return res.status(201).json(sendPrivateMessage);
      }

      const sendPrivateMessages = await PrivateMessage.create({
        text,
        SenderId: senderId,
        ReceiverId: findReceivedUser.id,
      });

      const findPrivMessage = await PrivateMessage.findOne({
        where: { id: sendPrivateMessages.id },
        include: [
          {
            model: User,
            as: "Sender",
            attributes: ["username"],
            include: [
              {
                model: Profile,
                as: "Profile",
                attributes: ["profileImgUrl", "fullName"],
              },
            ],
          },
        ],
      });

      // if (findPrivMessage.SenderId == senderId) {
      //   findPrivMessage.dataValues.messageBelongsToLoggedUser = true;
      // } else {
      //   findPrivMessage.dataValues.messageBelongsToLoggedUser = false;
      // }

      io.emit("broadMessage", findPrivMessage);
      // io.to("someRoom").emit("broadMessage", findPrivMessage);
    } catch (error) {
      console.log(error);
    }
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
