// Copyright 2025 Nether Host

const {
  EmbedBuilder,
  SlashCommandBuilder,
  chatInputApplicationCommandMention,
} = require("discord.js");
const handleError = require("../utils/handle-error.js");
const { getCommands } = require("../utils/help.js");
const fs = require("fs");
const JSON5 = require("json5");

const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get a list of commands for NetherCore."),

  async execute(interaction, client) {
    try {
      const commands = await getCommands(client);

      if (!commands || commands.length === 0) {
        return await interaction.reply("No commands found.");
      }

      const commandsList = commands
        .map((command) => {
          let commandString = `- ${chatInputApplicationCommandMention(
            command.name,
            command.id
          )} - ${command.description}`;

          if (command.subcommands.length > 0) {
            const subcommandsList = command.subcommands
              .map(
                (subcommand) =>
                  `  - /${command.name} ${subcommand.name} - ${subcommand.description}`
              )
              .join("\n");

            commandString += `\n${subcommandsList}`;
          }

          return commandString;
        })
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle("NetherCore Command List")
        .setDescription(commandsList)
        .setColor(config.general.botColor);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      handleError(error);
    }
  },
};
