// Copyright 2025 Nether Host

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User.js");
const embed = require("../../config/embed.config.js");
const handleError = require("../../utils/handle-error.js");
const JSON5 = require("json5");
const fs = require("fs");
const { loadMessages, languageChoices } = require("../../utils/language.js");
const { registerUser } = require("../../utils/register-user.js");
const {
  linkAccount,
  unlinkAccount,
  validateEmail,
} = require("../../utils/link.js");

const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Account linking")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Create or renew your account link.")
        .addStringOption((option) =>
          option
            .setName("email")
            .setDescription(
              "The email address of your Nether Host panel account."
            )
            .setRequired(true)
            .setMaxLength(128)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("remove").setDescription("Unlink your Discord account")
    ),

  async execute(interaction, client) {
    try {
      const command = interaction.options.getSubcommand();

      let userData;
      userData = await User.findOne({ "user.id": interaction.user.id });

      if (!userData) {
        userData = await registerUser(interaction.user, client);
      }

      const language = "en-US";
      const messages = loadMessages(language);

      if (command === "add") {
        const email = interaction.options.getString("email");

        if (!validateEmail(email)) {
          await interaction.reply({
            content: `${messages.invalidEmailError}`,
            ephemeral: true,
          });
          return;
        }

        await linkAccount(interaction.user, email);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                messages.accountLinkedTitle.replace(
                  "{username}",
                  interaction.user.username
                )
              )
              .setColor(config.general.botColor)
              .setDescription(
                messages.accountLinkedDescription.replace(
                  "{user}",
                  interaction.user
                )
              )
              .addFields({
                name: messages.accountLinkedFields.field1.name,
                value: `${email}`,
              })
              .setFooter({
                text: "Nether Host | nether.host",
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
              }),
          ],
          ephemeral: true,
        });
      } else if (command === "remove") {
        await unlinkAccount(interaction.user);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                messages.accountUnlinkedTitle.replace(
                  "{username}",
                  interaction.user.username
                )
              )
              .setColor(config.general.botColor)
              .setDescription(
                messages.accountUnlinkedDescription.replace(
                  "{user}",
                  interaction.user
                )
              )
              .setFooter({
                text: "Nether Host | nether.host",
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
              }),
          ],
          ephemeral: true,
        });
      }
    } catch (error) {
      handleError(error);
      await interaction.reply({
        embeds: [embed.error(error)],
      });
    }
  },
};
