const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Transaction = require("../models/Transaction");
const Analysis = require("../models/Analysis");
const { generateAIAnalysis } = require("../utils/aiService");

// Get analysis for a month
router.get("/:month", auth, async (req, res) => {
  try {
    const { month } = req.params;

    let analysis = await Analysis.findOne({
      userId: req.userId,
      month,
    });

    if (!analysis) {
      // Generate new analysis if not found
      analysis = await generateMonthlyAnalysis(req.userId, month);
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching analysis" });
  }
});

// Generate analysis for a month
router.post("/generate/:month", auth, async (req, res) => {
  try {
    const { month } = req.params;

    const analysis = await generateMonthlyAnalysis(req.userId, month);
    res.status(201).json(analysis);
  } catch (error) {
    console.error("Analysis generation error:", error);
    res.status(500).json({ message: "Error generating analysis" });
  }
});

// Get spending summary for period
router.get("/summary/period", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {
      userId: req.userId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const transactions = await Transaction.find(query);

    // Calculate totals by category
    const categoryTotals = {};
    let totalSpending = 0;

    transactions.forEach((transaction) => {
      totalSpending += transaction.amount;
      if (!categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] = 0;
      }
      categoryTotals[transaction.category] += transaction.amount;
    });

    res.json({
      totalSpending,
      categoryTotals,
      transactionCount: transactions.length,
      period: { startDate, endDate },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching summary" });
  }
});

// Helper function to generate monthly analysis
async function generateMonthlyAnalysis(userId, month) {
  const [year, monthNum] = month.split("-");
  const startDate = new Date(`${year}-${monthNum}-01`);
  const endDate = new Date(year, parseInt(monthNum), 0);

  const transactions = await Transaction.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  // Calculate spending by category
  const categoryTotals = {};
  let totalSpending = 0;

  transactions.forEach((transaction) => {
    totalSpending += transaction.amount;
    if (!categoryTotals[transaction.category]) {
      categoryTotals[transaction.category] = 0;
    }
    categoryTotals[transaction.category] += transaction.amount;
  });

  // Get AI analysis
  let aiAnalysis = null;
  try {
    aiAnalysis = await generateAIAnalysis(
      transactions,
      categoryTotals,
      totalSpending
    );
  } catch (error) {
    console.error("AI analysis error:", error);
    aiAnalysis = {
      spendingSummary: "Unable to generate AI analysis at this time",
      savingAreas: [],
      monthlySavingGoal: Math.round(totalSpending * 0.1),
    };
  }

  // Create analysis document
  const analysis = new Analysis({
    userId,
    month,
    spendingSummary: aiAnalysis.spendingSummary || "",
    topCategories: new Map(
      Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    ),
    savingAreas: aiAnalysis.savingAreas || [],
    monthlySavingGoal:
      aiAnalysis.monthlySavingGoal || Math.round(totalSpending * 0.1),
    totalSpending,
  });

  await analysis.save();
  return analysis;
}

module.exports = router;
