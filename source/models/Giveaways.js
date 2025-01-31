// Copyright 2025 Nether Host

const { Schema, model } = require("mongoose");

const giveawaySchema = new Schema({
  guildId: { type: String },
  totalGiveaways: { type: Number },
  giveaways: {
    type: Array,
    default: [],
  },
});

module.exports = model("Giveaways", giveawaySchema);
