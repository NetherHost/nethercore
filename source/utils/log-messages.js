// Copyright 2025 Nether Host

const handleError = require("./handle-error.js");
const fs = require("fs");
const path = require("path");

function saveChannelMessage(message, channel) {
  try {
    if (message.channel.id !== channel.id) return;

    const logFilePath = path.join(
      process.cwd(),
      "source",
      "data",
      "ai-support.log"
    );

    const messageDir = path.dirname(logFilePath);
    if (!fs.existsSync(messageDir)) {
      fs.mkdirSync(messageDir, { recursive: true });
    }

    const date = new Date();
    const formattedDate = date.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    const time = date.toLocaleTimeString("en-US", {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const logEntry = `[${formattedDate} - ${time}] ${message.content}\n`;

    fs.appendFileSync(logFilePath, logEntry, "utf8");
  } catch (error) {
    handleError(error);
  }
}

module.exports = { saveChannelMessage };
