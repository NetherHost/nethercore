import type { CommandData, SlashCommandProps } from "commandkit";
import { ApplicationCommandOptionType, PermissionsBitField } from "discord.js";
import { bulkRegisterUsers } from "../utils/register";

export const data: CommandData = {
  name: "bulk-register",
  description: "Run the bulk user registration utility",
  default_member_permissions:
    PermissionsBitField.Flags.Administrator.toString(),
};

export async function run({ interaction, client }: SlashCommandProps) {
  if (!interaction.guild?.id) return;

  await interaction.deferReply({ ephemeral: true });

  await interaction.editReply({
    content: "Started user bulk registration...",
  });
  await bulkRegisterUsers(client, interaction.guild.id);
  await interaction.editReply({
    content: "Bulk user registration completed!",
  });
}
