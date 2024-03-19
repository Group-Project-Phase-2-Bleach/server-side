if (process.env.NODE_ENV !== "production") {
  require("dotenv").config(); 
}

const port = 3000;
const express = require("express");
const app = express();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const cors = require("cors");


const UserController = require("./controllers/UserController");
const authentication = require("./middlewares/authentication");
const ProfileController = require("./controllers/ProfileController");
const profileAuthorization = require("./middlewares/profileAuthorization");

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






app.listen(port, () => {
  console.log("Server is running " + port);
});
