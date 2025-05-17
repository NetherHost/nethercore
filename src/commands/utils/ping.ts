import type { CommandData, SlashCommandProps } from "commandkit";

export const data: CommandData = {
  name: "ping",
  description: "Replies with pong",
};

export function run({ interaction }: SlashCommandProps) {
  interaction.reply({ content: "Pong!" });
}
