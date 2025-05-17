import type { CommandData, SlashCommandProps } from "commandkit";
import { ApplicationCommandOptionType, PermissionsBitField } from "discord.js";
import User from "../../models/User";

export const data: CommandData = {
  name: "register",
  description: "Registers a user with the database. For testing purposes.",
};

export async function run({ interaction }: SlashCommandProps) {
  const user = await User.findOne({ userId: interaction.user.id });

  if (user)
    return await interaction.reply({
      content: `409 Conflict: \`You are already registered with the database.\``,
    });

  const newUser = new User({
    userId: interaction.user.id,
    linked: {
      isLinked: false,
    },
    isStaff: false,
    timestamps: {
      joiendAt: Date.now(),
    },
  });

  await newUser.save();

  await interaction.reply({
    content: `Successfully registered your account with the database.`,
  });
}
