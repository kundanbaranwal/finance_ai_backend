const axios = require("axios");

async function generateAIAnalysis(transactions, categoryTotals, totalSpending) {
  // If no API key, return default analysis
  if (!process.env.AI_API_KEY) {
    return getDefaultAnalysis(categoryTotals, totalSpending);
  }

  try {
    // Prepare the prompt
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`)
      .join(", ");

    const prompt = `Analyze this personal spending data and provide insights:
Total Spending: $${totalSpending.toFixed(2)}
Top Categories: ${topCategories}
Number of transactions: ${transactions.length}

Please provide:
1. A brief 2-3 sentence summary of spending pattern
2. 2-3 areas where they could cut spending
3. A suggested monthly saving goal (10-15% of total spending)

Keep the response concise and actionable.`;

    // Call OpenAI API
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a financial advisor helping users understand their spending.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const analysisText = response.data.choices[0].message.content;
    const sections = analysisText.split("\n").filter((s) => s.trim());

    return {
      spendingSummary: sections.slice(0, 3).join(" "),
      savingAreas: extractSavingAreas(sections),
      monthlySavingGoal: Math.round(totalSpending * 0.12),
    };
  } catch (error) {
    console.error("AI API error:", error.message);
    return getDefaultAnalysis(categoryTotals, totalSpending);
  }
}

function getDefaultAnalysis(categoryTotals, totalSpending) {
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  return {
    spendingSummary: `Your spending is distributed across ${
      Object.keys(categoryTotals).length
    } categories. Focus on reducing ${topCategories.join(", ")} to save more.`,
    savingAreas: [
      `Review ${topCategories[0] || "your top"} spending`,
      "Cancel unused subscriptions",
      "Reduce dining out frequency",
    ],
    monthlySavingGoal: Math.round(totalSpending * 0.1),
  };
}

function extractSavingAreas(sections) {
  const areas = [];
  for (const section of sections) {
    const match = section.match(/[-•*]\s*(.+)/);
    if (match && areas.length < 3) {
      areas.push(match[1].trim());
    }
  }
  return areas.length > 0
    ? areas
    : [
        "Reduce dining out",
        "Cancel unused subscriptions",
        "Set category budgets",
      ];
}

module.exports = { generateAIAnalysis };
