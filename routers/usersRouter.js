const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.get("/", async (req, res, next) => {
  const userList = await User.find().select("-passwordHash");

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");

  if (!user) {
    return res.status(500).json({
      success: false,
      message: "The user with the given id was not found!",
    });
  }
  res.status(200).send(user);
});

router.get("/get/count", async (req, res) => {
  const userCount = await User.countDocuments();

  if (!userCount) {
    return res.status(500).json({ success: false, message: 0 });
  }

  res.send({
    userCount: userCount,
  });
});

// POST METHODS

router.post("/", async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    // ??? impruve this part for encryption
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    distrit: req.body.distrit,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();

  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "The user cannot be created!" });
  }
  res.send(user);
});

router.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let existingUser;

  const secretWord = process.env.secretJwtWord;
  try {
    existingUser = await User.findOne({
      email: email.toLowerCase(),
    });
  } catch (err) {
    return res.status(503).send("Login Service is not available!");
  }

  if (
    existingUser === false ||
    bcrypt.compareSync(password, existingUser.passwordHash) === false
  ) {
    console.log("Logging user failed.");
    return res.status(400).send("User or password is wrong!");
  }

  let token;

  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
        isAdmin: existingUser.isAdmin,
      },
      secretWord,
      { expiresIn: "2h" }
    );
  } catch (err) {
    return res.status(503).send("Something went wrong!");
  }

  return res.status(200).json({
    success: true,
    data: {
      userId: existingUser.id,
      email: existingUser.email,
      token: token,
    },
  });
});

router.post("/register", async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    // ??? impruve this part for encryption
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: false,
    street: req.body.street,
    distrit: req.body.distrit,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();

  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "The user cannot be created!" });
  }

  res.send(user);
});

router.delete("/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "The user was deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "User not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

module.exports = router;
