const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  month: {
    type: String,
    required: true, // Format: "YYYY-MM"
  },
  spendingSummary: {
    type: String,
    default: "",
  },
  topCategories: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  savingAreas: [String],
  monthlySavingGoal: {
    type: Number,
    default: 0,
  },
  totalSpending: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient monthly lookups
analysisSchema.index({ userId: 1, month: 1 });

module.exports = mongoose.model("Analysis", analysisSchema);
