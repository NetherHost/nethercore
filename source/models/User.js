// Copyright 2025 Nether Host

const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  user: {
    id: { type: String },
    username: { type: String },
    avatarLink: { type: String },
  },
  link: {
    status: { type: Boolean },
    email: { type: String },
  },
  tickets: {
    type: Array,
    default: [],
  },
  language: {
    default: { type: String },
    value: { type: String },
  },
  staff: {
    isStaff: { type: Boolean },
    ticketMessages: { type: Number },
    ticketsClosed: { type: Number },
  },
  ticketBanned: {
    status: { type: Boolean },
    moderator: { type: String },
    reason: { type: String },
  },
  punishments: {
    banned: {
      status: { type: Boolean },
      moderator: { type: String },
      reason: { type: String },
    },
    muted: {
      status: { type: Boolean },
      duration: { type: Number },
      moderator: { type: String },
      reason: { type: String },
    },
  },
  createdAt: { type: Date },
  joinedAt: { type: Date },
  leftAt: { type: Date },
});

module.exports = model("User", userSchema);
