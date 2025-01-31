// Copyright 2025 Nether Host

const { saveChannelMessage } = require("../../utils/log-messages.js");
const JSON5 = require("json5");
const fs = require("fs");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);
const handleError = require("../../utils/handle-error.js");

module.exports = (client, message) => {
  try {
    if (message.author.bot) return;

    const aiSupportChannel = client.channels.cache.get(
      config.channels.aiSupportChannelId
    );

    if (!aiSupportChannel)
      return console.error(
        color.red("[ERROR] ") +
          color.white(
            "Unable to find AI support channel. Likely invalid channel ID provided in config/general.json5"
          )
      );

    saveChannelMessage(message, aiSupportChannel);
  } catch (error) {
    handleError(error);
  }
};
