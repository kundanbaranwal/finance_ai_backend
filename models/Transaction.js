const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: [
      "food",
      "rent",
      "transport",
      "shopping",
      "subscriptions",
      "utilities",
      "entertainment",
      "healthcare",
      "other",
    ],
    default: "other",
  },
  source: {
    type: String,
    enum: ["manual", "csv_upload"],
    default: "manual",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
transactionSchema.index({ userId: 1, date: 1 });
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
