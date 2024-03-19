if (process.env.NODE_ENV !== "production") {
  // mulai sekarang pakai dotenv config kalau tidak pada masa production
  require("dotenv").config(); // ini harus di apply paling awal
}

const express = require("express");
const app = express();

const port = 3000;
const cors = require("cors");
const UserController = require("./controllers/UserController");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());


app.post("/login", UserController.Login);
app.post("/register", UserController.Register);
app.post("/google-login", UserController.googleLogin);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello world" });
});



app.listen(port, () => {
  console.log("Server is running " + port);
});
