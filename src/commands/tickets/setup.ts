import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  TextChannel,
  NewsChannel,
  ApplicationCommandOptionType,
  MessageFlags,
} from "discord.js";
import type { CommandData, SlashCommandProps } from "commandkit";

export const data: CommandData = {
  name: "ticket-setup",
  description: "Sends a ticket panel.",
  default_member_permissions:
    PermissionsBitField.Flags.Administrator.toString(),
  options: [
    {
      name: "channel",
      description: "The channel to send the ticket panel to.",
      type: ApplicationCommandOptionType.Channel,
      required: true,
      channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
    },
    {
      name: "content",
      description: "The message inside the ticket panel embed.",
      type: ApplicationCommandOptionType.String,
      required: true,
      max_length: 1000,
    },
  ],
};

export async function run({ interaction, client }: SlashCommandProps) {
  const channel = interaction.options.getChannel("channel") as
    | TextChannel
    | NewsChannel;
  const message = interaction.options.getString("content");

  if (!channel || !channel.isTextBased()) {
    return interaction.reply({
      content:
        "400 Bad Request: `The current channel does not accept messages.`",
      flags: [MessageFlags.Ephemeral],
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("Nether Host Support")
    .setDescription(message!)
    .setColor("Red")
    .setFooter({
      text: "Nether Host | nether.host",
      iconURL: client.user.avatarURL({ extension: "webp" }) ?? undefined,
    });

  const button = new ButtonBuilder()
    .setCustomId("ticket-open-button")
    .setLabel("New")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  await channel.send({
    embeds: [embed],
    components: [row],
  });

  await interaction.reply({
    content: `Ticket panel successfully sent to ${channel}.`,
    flags: [MessageFlags.Ephemeral],
  });
}
