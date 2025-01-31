// Copyright 2025 Nether Host

const handleError = require("./handle-error.js");
const JSON5 = require("json5");
const fs = require("fs");
const User = require("../models/User.js");
const { registerUser } = require("../utils/register-user.js");

async function linkAccount(user, email) {
  try {
    let userData;
    userData = await User.findOne({ "user.id": user.id });

    if (!userData) {
      userData = await registerUser(user);
    }

    userData.link.email = email;
    userData.link.status = true;
    userData.save();
  } catch (error) {
    handleError(error);
  }
}

async function unlinkAccount(user) {
  try {
    let userData;
    userData = await User.findOne({ "user.id": user.id });

    if (!userData) {
      userData = await registerUser(user);
    }

    if (userData.link.status) {
      userData.link.status = false;
      userData.save();

      return true;
    } else {
      return false;
    }
  } catch (error) {
    handleError(error);
  }
}

function validateEmail(email) {
  try {
    const containsAt = email.includes("@");
    const containsDot = email.includes(".");

    if (!containsAt || !containsDot) {
      return false;
    }

    return true;
  } catch (error) {
    handleError(error);
  }
}

module.exports = {
  linkAccount,
  unlinkAccount,
  validateEmail,
};
