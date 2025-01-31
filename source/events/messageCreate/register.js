const User = require("../../models/User.js");
const {
  registerUser,
  registerUserAsSpanish,
} = require("../../utils/register-user");

module.exports = async (client, message) => {
  const isRegistered = await User.findOne({ "user.id": message.author.id });
  if (message.author.bot || isRegistered) return;

  const hasSpanishRole = message.member.roles.cache.has("1113259092077719562");
  console.log(hasSpanishRole);

  if (hasSpanishRole === false) {
    console.log("Checking if user is English");
    await registerUser(message.author, client);
    console.log("Registered user as English");
  } else {
    console.log("Checking if user is Spanish");
    await registerUserAsSpanish(message.author, client);
    console.log("Registered user as Spanish");
  }
};
