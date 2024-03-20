const { Op } = require("sequelize");
const { comparePassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { User, Profile, PrivateMessage } = require("../models");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client();

module.exports = class UserController {
  static async Register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      await User.create({
        username,
        email,
        password,
      });
      res.status(201).json({ username, email });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async Login(req, res, next) {
    try {
      const { email, password } = req.body;
      console.log(req.body);

      if (!email) {
        throw {
          name: "CustomError",
          status: 400,
          message: "Email is required",
        };
      }

      if (!password) {
        throw {
          name: "CustomError",
          status: 400,
          message: "Password is required.",
        };
      }

      const user = await User.findOne({ where: { email: email } });

      if (!user || !comparePassword(password, user.password)) {
        throw {
          name: "CustomError",
          status: 401,
          message: "Invalid Email/Password",
        };
      }

      const token = signToken({
        id: user.id,
      });

      res
        .status(200)
        .json({ access_token: token, id: user.id, username: user.username });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    const { googleToken } = req.body;
    try {
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience:
          "888996035254-qqqrffv50i0tk2i45ja7j75g1ii9nlkg.apps.googleusercontent.com",
      });
      const { email, picture, name } = ticket.getPayload();

      const [username] = email.split("@");

      const google = ticket.getPayload();
      console.log(google);

      const password = Math.random().toString();

      const [user, created] = await User.findOrCreate({
        where: { email: email },
        defaults: {
          username: username,
          email: email,
          password: password,
        },
      });
      console.log({ user, created });

      const access_token = signToken({ id: user.id });

      const findProfile = await Profile.findOrCreate({
        where: { UserId: user.id },
        defaults: {
          fullName: name,
          profileImgUrl: picture,
          bio: "",
        },
      });

      res.status(200).json({ message: "Login Success", access_token });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async findCurrentlyLoggedUser(req, res, next) {
    try {
      const user = await User.findOne({
        where: { id: req.user.id },
        attributes: { exclude: ["password"] },
        include: [
          {
            model: Profile,
            as: "Profile",
          },
        ],
      });
      res.status(200).json(user);
    } catch (error) {
      next(error);
      console.log(error);
    }
  }
};
