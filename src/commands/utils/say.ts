import type { CommandData, SlashCommandProps } from "commandkit";
import {
  ApplicationCommandOptionType,
  PermissionsBitField,
  TextChannel,
  NewsChannel,
  ThreadChannel,
  DMChannel,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";

export const data: CommandData = {
  name: "say",
  description: "Say something as NetherCore.",
  default_member_permissions:
    PermissionsBitField.Flags.Administrator.toString(),
  options: [
    {
      name: "message",
      description: "The message to send as NetherCore.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "anonymous",
      description: "Send this message anonymously?",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
};

export async function run({ interaction }: SlashCommandProps) {
  const message = interaction.options.getString("message", true);
  const anonymous = interaction.options.getBoolean("anonymous") ?? true;

  const channel = interaction.channel;
  if (!channel?.isTextBased() || !("send" in channel)) {
    return interaction.reply({
      flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
      components: [
        new TextDisplayBuilder().setContent(
          "I cannot send messages in this channel."
        ),
      ],
    });
  }

  try {
    if (anonymous) {
      await (
        channel as TextChannel | NewsChannel | ThreadChannel | DMChannel
      ).send(message);

      return interaction.reply({
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
        components: [
          new TextDisplayBuilder().setContent("Message sent anonymously."),
        ],
      });
    }

    return interaction.reply({
      flags: [MessageFlags.IsComponentsV2],
      components: [new TextDisplayBuilder().setContent(message)],
    });
  } catch (error) {
    console.error("Error in /say command:", error);
    return interaction.reply({
      flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
      components: [
        new TextDisplayBuilder().setContent(
          "There was an error while executing this command."
        ),
      ],
    });
  }
}
