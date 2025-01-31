// Copyright 2025 Nether Host

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const handleError = require("../../utils/handle-error.js");
const JSON5 = require("json5");
const fs = require("fs");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);
const User = require("../../models/User.js");
const { loadMessages } = require("../../utils/language.js");
const { registerUser } = require("../../utils/register-user.js");
const { isStaff } = require("../../utils/staff.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Manually register a user with NetherCore.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to register.")
        .setRequired(true)
    ),
  async execute(interaction, client) {
    try {
      const user = interaction.options.getUser("user");

      let userData;
      userData = await User.findOne({ "user.id": interaction.user.id });

      if (!userData) return;

      const language = userData.language.value;
      const messages = loadMessages(language);

      if (!isStaff(interaction.user.id))
        return interaction.reply(messages.noPermissionError);

      await registerUser(user, client);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Registered User")
            .setDescription(`${user} has been registered with NetherCore.`)
            .setColor(config.general.botColor)
            .setFooter({
              text: `Nether Host | nether.host`,
              iconURL: client.user.displayAvatarURL({ dynamic: true }),
            }),
        ],
      });
    } catch (error) {
      handleError(error);
    }
  },
};
