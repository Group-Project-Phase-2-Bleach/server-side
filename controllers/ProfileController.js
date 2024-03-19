const { Op } = require("sequelize");
const { Profile, User } = require("../models");
const cloud_name = process.env.cloud_name;
const api_key = process.env.cloudinary_api_key;
const api_secret = process.env.cloudinary_api_secret;

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: cloud_name,
  api_key: api_key,
  api_secret: api_secret,
});

module.exports = class ProfileController {
  static async getAllProfiles(req, res, next) {
    try {
      let { fullName } = req.query;
      let queryOption = {
        where: {},
        include: [
          { model: User, as: "User", attributes: { exclude: ["password"] } },
        ],
      };

      if (fullName) {
        queryOption.where.fullName = { [Op.iLike]: `%${fullName}%` };
      }
      
      const getAllProfiles = await Profile.findAll(queryOption);
      res.status(200).json(getAllProfiles);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async createProfile(req, res, next) {
    try {
      const { fullName, bio } = req.body;

      if (!req.file) {
        throw {
          name: "CustomError",
          status: 400,
          message: "Image is required.",
        };
      }

      const findUser = await Profile.findOne({
        where: { UserId: req.user.id },
      });

      if (findUser) {
        throw {
          name: "CustomError",
          status: 403,
          message: "Profile has already been created.",
        };
      }

      let randomName =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      const mimeType = req.file.mimetype;
      const data = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = `data:${mimeType};base64,${data}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        public_id: randomName,
      });

      await Profile.create({
        UserId: req.user.id,
        fullName,
        profileImgUrl: result.secure_url,
        bio,
      });

      res.status(201).json({ message: "Profile created Succesfully." });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async getProfileByUsername(req, res, next) {
    try {
      const { username } = req.params;
      const findProfile = await User.findOne({
        where: { username: username },
        include: "Profile",
      });
      if (!findProfile) {
        throw {
          name: "CustomError",
          status: 404,
          message: "Profile not Found.",
        };
      }

      res.status(200).json(findProfile.Profile);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { username } = req.params;
      const { fullName, profileImgUrl, bio } = req.body;
      const userProfile = await User.findOne({
        where: { username: username },
        include: "Profile",
      });
      if (!userProfile) {
        throw {
          name: "CustomError",
          status: 404,
          message: "Profile not Found.",
        };
      }

      if (req.file) {
        const mimeType = req.file.mimetype;
        const data = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = `data:${mimeType};base64,${data}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          public_id: req.file.originalname,
        });

        const updatedProfileWithImage = await Profile.update(
          {
            UserId: req.user.id,
            fullName,
            profileImgUrl: result.secure_url,
            bio,
          },
          { where: { id: userProfile.Profile.id } }
        );

        return res
          .status(201)
          .json({ message: "Profile updated Succesfully." });
      }

      const updatedProfile = await Profile.update(
        {
          UserId: req.user.id,
          fullName,
          bio,
        },
        { where: { id: userProfile.Profile.id } }
      );

      res.status(201).json({ message: "Profile updated Succesfully." });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
};
