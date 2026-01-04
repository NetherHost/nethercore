import type { CommandData, ChatInputCommand } from "commandkit";
import { ApplicationCommandOptionType, PermissionsBitField } from "discord.js";

export const command: CommandData = {
    name: "ping",
    description: "Replies with pong",
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
    interaction.reply({ content: "Pong!" });
};
