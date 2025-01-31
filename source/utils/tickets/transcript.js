// Copyright 2025 Nether Host

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const path = require("path");
const fs = require("fs");
const handleError = require("../handle-error.js");
const JSON5 = require("json5");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);
const { loadMessages } = require("../language.js");

async function saveTranscript(content, channel, languageCode) {
  const transcriptDir = path.resolve("./source/data/transcripts");
  await fs.promises.mkdir(transcriptDir, { recursive: true }); // create dir if it doesnt exist
  const filePath = path.join(
    transcriptDir,
    `${channel.name}-${channel.id}.txt` // create file
  );

  await fs.promises.writeFile(filePath, content); // write transcript data to file
  return filePath;
}

async function fetchMessages(channel) {
  const messages = [];
  let lastMessageId;

  // loop through ticket messages
  while (true) {
    const fetchedMessages = await channel.messages.fetch({
      limit: 100,
      before: lastMessageId,
    });

    if (fetchedMessages.size === 0) break; // break if no messages are fetched

    messages.push(...fetchedMessages.values()); // add fetched messages to array
    lastMessageId = fetchedMessages.last().id;
  }

  return messages; // return messages
}

function formatMessages(messages) {
  let lastDate = "";

  return messages.reverse().reduce((transcript, msg) => {
    if (msg.author.bot) return transcript; // skip bot messages

    const messageDate = new Date(msg.createdAt); // get message date
    const currentDate = messageDate.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }); // convert message date to string

    // add date header if date is different
    if (currentDate !== lastDate) {
      transcript += `\n=== ${currentDate} ===\n`;
      lastDate = currentDate;
    }

    // format message time
    const time = messageDate.toLocaleTimeString("en-US", {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // show attachments (if any) as links
    const attachments = msg.attachments.map((att) => att.url).join("\n");

    transcript += `[${time}] ${msg.author.username}: ${msg.content}\n${
      attachments ? `${attachments}\n` : ""
    }`;

    return transcript;
  }, "");
}

async function sendTranscript(user, transcript, client, languageCode) {
  try {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel(" ")
        .setURL("https://trustpilot.com/evaluate/nether.host")
        .setStyle(ButtonStyle.Link)
        .setEmoji("1289603836360523907")
    );

    const messages = loadMessages(languageCode);

    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(messages.ticketTranscriptUserEmbedTitle)
          .setColor(config.general.botColor)
          .setDescription(messages.ticketTranscriptUserEmbedDesription)
          .setFooter({
            text: "Nether Host | nether.host",
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
          }),
      ],
      files: [transcript],
      components: [row],
    });

    return true;
  } catch (error) {
    handleError(error);
    return false;
  }
}

module.exports = {
  saveTranscript,
  fetchMessages,
  formatMessages,
  sendTranscript,
};
