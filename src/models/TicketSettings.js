const { Schema, model } = require("mongoose");

const ticketSettingsSchema = new Schema({
  access: {
    type: String,
    enum: ["EVERYONE", "CLIENTS_ONLY", "CLOSED"],
    default: "EVERYONE",
  },
  autoClose: {
    enabled: { type: Boolean, default: false },
    interval: { type: Number },
  },
  claims: {
    enabled: { type: Boolean },
    autoClaimOnMessage: { type: Boolean, default: false },
    onlyOneClaimer: { type: Boolean, default: true }, // if false, staff members cannot override claims
  },
  totalTickets: { type: Number, default: 0 },
  ticketBanList: [
    {
      userId: { type: String },
      moderator: { type: String },
      reason: { type: String },
      bannedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = model("TicketSettings", ticketSettingsSchema);
