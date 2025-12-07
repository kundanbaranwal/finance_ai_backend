const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Budget = require("../models/Budget");

// Get budget for a month
router.get("/:month", auth, async (req, res) => {
  try {
    const { month } = req.params;

    const budget = await Budget.findOne({
      userId: req.userId,
      month,
    });

    if (!budget) {
      return res
        .status(404)
        .json({ message: "Budget not found for this month" });
    }

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching budget" });
  }
});

// Create or update budget for a month
router.post("/:month", auth, async (req, res) => {
  try {
    const { month } = req.params;
    const { totalBudget, categoryBudgets } = req.body;

    if (!totalBudget || totalBudget <= 0) {
      return res.status(400).json({ message: "Invalid total budget" });
    }

    let budget = await Budget.findOne({
      userId: req.userId,
      month,
    });

    if (budget) {
      budget.totalBudget = totalBudget;
      budget.categoryBudgets = categoryBudgets || new Map();
      budget.updatedAt = new Date();
    } else {
      budget = new Budget({
        userId: req.userId,
        month,
        totalBudget,
        categoryBudgets: categoryBudgets || new Map(),
      });
    }

    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: "Server error saving budget" });
  }
});

// Delete budget
router.delete("/:month", auth, async (req, res) => {
  try {
    const { month } = req.params;

    const budget = await Budget.findOneAndDelete({
      userId: req.userId,
      month,
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json({ message: "Budget deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting budget" });
  }
});

module.exports = router;
