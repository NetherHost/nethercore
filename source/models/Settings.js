// Copyright 2025 Nether Host

const { Schema, model } = require("mongoose");

const settingsSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  language: {
    default: { type: String, default: "en-US" },
    global: { type: Boolean, default: false },
    allowUserOverride: { type: Boolean, default: true },
  },
  commands: {
    commandsCount: { type: Number, default: 0 },
    disabled: [{ type: String }],
  },
  tickets: {
    access: {
      type: String,
      enum: ["CLIENT_ONLY", "EVERYONE", "DISABLED"],
      default: "EVERYONE",
    },
    autoClose: {
      enabled: { type: Boolean, default: true },
      duration: { type: Number, default: 1440 }, // 24 hours in mins
    },
  },
});

module.exports = model("Settings", settingsSchema);
