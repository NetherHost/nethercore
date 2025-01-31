// Copyright 2025 Nether Host

const { EmbedBuilder } = require("discord.js");

module.exports = {
  error(e) {
    return new EmbedBuilder()
      .setTitle("Error")
      .setDescription(`An error has occurred. \n\n \`${e}\``)
      .setColor("Red");
  },
  warning(e) {
    return new EmbedBuilder()
      .setTitle("Warning")
      .setDescription(`${e}`)
      .setColor("Yellow");
  },
};
