if (process.env.NODE_ENV !== "production") {
  require("dotenv").config(); 
}

const express = require("express");
const app = express();

const port = 3000;
const cors = require("cors");
const UserController = require("./controllers/UserController");
const authentication = require("./middlewares/authentication");

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


app.listen(port, () => {
  console.log("Server is running " + port);
});
