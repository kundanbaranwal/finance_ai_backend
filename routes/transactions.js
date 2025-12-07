const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parse/sync");
const fs = require("fs");
const path = require("path");
const auth = require("../middleware/auth");
const Transaction = require("../models/Transaction");
const { categorizeTransaction } = require("../utils/categorizer");

const upload = multer({ dest: "uploads/" });

// Get all transactions for user with filters
router.get("/", auth, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    let query = { userId: req.userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (category && category !== "all") {
      query.category = category;
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching transactions" });
  }
});

// Get transaction by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add single transaction
router.post("/", auth, async (req, res) => {
  try {
    const { date, description, amount, category } = req.body;

    if (!date || !description || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let finalCategory = category;
    if (!finalCategory || finalCategory === "auto") {
      finalCategory = categorizeTransaction(description);
    }

    const transaction = new Transaction({
      userId: req.userId,
      date: new Date(date),
      description,
      amount: parseFloat(amount),
      category: finalCategory,
      source: "manual",
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server error creating transaction" });
  }
});

// Upload CSV file
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const fileContent = fs.readFileSync(req.file.path, "utf-8");
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    const transactions = [];
    for (const record of records) {
      const transaction = new Transaction({
        userId: req.userId,
        date: new Date(record.date),
        description: record.description,
        amount: parseFloat(record.amount),
        category: categorizeTransaction(record.description),
        source: "csv_upload",
      });
      transactions.push(transaction);
    }

    await Transaction.insertMany(transactions);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: `${transactions.length} transactions uploaded successfully`,
      count: transactions.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Error processing CSV file" });
  }
});

// Update transaction
router.put("/:id", auth, async (req, res) => {
  try {
    const { date, description, amount, category } = req.body;

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (date) transaction.date = new Date(date);
    if (description) transaction.description = description;
    if (amount) transaction.amount = parseFloat(amount);
    if (category) transaction.category = category;

    await transaction.save();
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server error updating transaction" });
  }
});

// Delete transaction
router.delete("/:id", auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting transaction" });
  }
});

module.exports = router;
