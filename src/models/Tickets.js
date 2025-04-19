const { Schema, model } = require("mongoose");

const ticketSchema = new Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true }, // unique ticket id
  name: { type: String },

  status: {
    type: String,
    enum: ["open", "closed", "deleted"],
    default: "open",
  },

  department: {
    type: String,
    enum: ["general", "billing", "technical", "other"],
    required: true,
  },

  claim: {
    status: { type: Boolean, default: false },
    claimedBy: { type: String },
    claimedAt: { type: Date },
  },

  timestamps: {
    createdAt: { type: Date, default: Date.now },
    attendedToAt: { type: Date },
    closedAt: { type: Date },
    deletedAt: { type: Date },
  },
});

module.exports = model("Ticket", ticketSchema);
