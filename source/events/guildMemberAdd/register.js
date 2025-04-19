// Copyright 2025 Nether Host

const { registerUser } = require("../../utils/register-user.js");
const handleError = require("../../utils/handle-error.js");
const User = require("../../models/User.js");

module.exports = async (client, member) => {
  try {
    if (member.user.bot || (await userExists(member.user))) return;

    await registerUser(member.user, client);
  } catch (error) {
    handleError(error);
  }
};

async function userExists(user) {
  const userData = await User.findOne({ "user.id": user.id });
  if (userData) {
    return true;
  } else {
    return false;
  }
}
