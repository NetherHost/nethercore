// Copyright 2025 Nether Host

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const JSON5 = require("json5");
const fs = require("fs");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("credits")
    .setDescription("Credits for the bot, and language translations."),
  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle("Credits")
      .setDescription(
        `Thank you to our amazing community for all your help on development, ideas, and language translations!
    `
      )
      .setColor(config.general.botColor)
      .setFooter({
        text: "Nether Host | nether.host",
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      })
      .addFields(
        {
          name: "Development",
          value: "<@924513291806580736>",
        },
        {
          name: "Translations",
          value:
            "**Spanish**: <@426191252783104004>\n**Dutch**: <@430094372588224543> & <@924513291806580736>\n**Portuguese**: <@951918313733246996>\n**Arabic**: <@1042149840844505171>",
        }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
