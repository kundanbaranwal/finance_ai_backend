// Simple keyword-based categorization
const categoryKeywords = {
  food: [
    "restaurant",
    "food",
    "grocery",
    "pizza",
    "burger",
    "coffee",
    "cafe",
    "meal",
    "lunch",
    "dinner",
    "breakfast",
    "drink",
    "bakery",
  ],
  rent: ["rent", "landlord", "lease", "mortgage", "property", "housing"],
  transport: [
    "uber",
    "taxi",
    "gas",
    "fuel",
    "transit",
    "metro",
    "train",
    "bus",
    "parking",
    "car",
    "vehicle",
    "transport",
  ],
  shopping: [
    "amazon",
    "mall",
    "store",
    "shop",
    "retail",
    "clothes",
    "apparel",
    "market",
    "purchase",
    "buy",
  ],
  subscriptions: [
    "subscription",
    "netflix",
    "spotify",
    "gym",
    "membership",
    "monthly",
    "adobe",
    "disney",
    "hulu",
  ],
  utilities: [
    "electric",
    "water",
    "gas",
    "internet",
    "phone",
    "utility",
    "bill",
  ],
  entertainment: [
    "movie",
    "cinema",
    "concert",
    "ticket",
    "game",
    "gaming",
    "entertainment",
    "leisure",
  ],
  healthcare: [
    "hospital",
    "doctor",
    "pharmacy",
    "medicine",
    "medical",
    "health",
    "clinic",
    "dental",
  ],
};

function categorizeTransaction(description) {
  const lowerDesc = description.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        return category;
      }
    }
  }

  return "other";
}

module.exports = { categorizeTransaction };
