// Copyright 2025 Nether Host All rights reserved.
// Unauthorized use, modification, or distribution of this code is prohibited.

const handleError = require("../../utils/handle-error.js");
const color = require("chalk");
const { checkGiveaway } = require("../../utils/giveaway.js");
const Giveaways = require("../../models/Giveaways.js");
const JSON5 = require("json5");
const fs = require("fs");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

const intervalDuration = 5 * 1000;

module.exports = async (client) => {
  try {
    let logCount = 0;

    setInterval(async () => {
      const giveawayData = await Giveaways.findOne({ guildId: config.guildId });

      logCount++;
      if (logCount >= 5) {
        logCount = 0;
        console.log(
          color.green("[INFO] ") +
            color.white("Checking for ended giveaways...")
        );
      }

      if (giveawayData) {
        giveawayData.giveaways.forEach(async (giveaway) => {
          if (!giveaway.ended) {
            await checkGiveaway(giveaway.id, client);
          }
        });
      }
    }, intervalDuration);

    console.log(
      color.green("[INFO] ") + color.white("Giveaway checker started.")
    );
  } catch (error) {
    handleError(error);
  }
};
