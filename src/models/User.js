const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  userId: { type: String },
  isLinked: { type: Boolean },
  staff: {
    isStaff: { type: Boolean },
    ticketMessages: { type: Number },
    ticketsClosed: { type: Number },
  },
  timestamps: {
    joinedAt: { type: Date },
    leftAt: { type: Date },
    createdAt: { type: Date },
  },
});
