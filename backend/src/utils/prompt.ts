import { PaymentMethodEnum } from "../models/transaction.model";

export const receiptPrompt = `
You are a financial assistant that helps users analyze and extract transaction details from receipt image (base64 encoded)
Analyze this receipt image (base64 encoded) and extract transaction details matching this exact JSON format:
{
  "title": "string",          // Merchant/store name or brief description
  "amount": number,           // Total amount (positive number)
  "date": "ISO date string",  // Transaction date in YYYY-MM-DD format
  "description": "string",    // Items purchased summary (max 50 words)
  "category": "string",       // category of the transaction 
  "type": "EXPENSE",           // Always "EXPENSE" for receipts
  "paymentMethod": "string",  // One of: ${Object.values(PaymentMethodEnum).join(",")}
}

Rules:
1. Amount must be positive
2. Date must be valid and in ISO format
3. Category must match our enum values
4. If uncertain about any field, omit it
5. If not a receipt, return {}

Example valid response:
{
  "title": "Walmart Groceries",
  "amount": 58.43,
  "date": "2025-05-08",
  "description": "Groceries: milk, eggs, bread",
  "category": "groceries",
  "paymentMethod": "CARD",
  "type": "EXPENSE"
}
`;

interface ReportInsightParams {
  totalIncome: number;
  totalExpenses: number;
  availableBalance: number;
  savingsRate: number;
  categories: Record<string, { amount: number; percentage: number }>;
  periodLabel: string;
}

export const reportInsightPrompt = ({
  totalIncome,
  totalExpenses,
  availableBalance,
  savingsRate,
  categories,
  periodLabel,
}: ReportInsightParams): string => {
  const categoriesText = Object.entries(categories)
    .map(([name, data]) => `- ${name}: $${data.amount} (${data.percentage}%)`)
    .join('\n');

  return `You are a financial advisor analyzing a user's spending report for ${periodLabel}.

Financial Summary:
- Total Income: $${totalIncome}
- Total Expenses: $${totalExpenses}
- Available Balance: $${availableBalance}
- Savings Rate: ${savingsRate}%

Top Spending Categories:
${categoriesText || 'No spending data available'}

Generate 3-5 personalized financial insights in JSON format as an array of objects:
[
  {
    "title": "Brief insight title (max 60 characters)",
    "description": "Detailed explanation with actionable advice (max 200 characters)",
    "type": "positive" | "warning" | "neutral"
  }
]

Guidelines:
1. Provide actionable, specific advice based on the data
2. If savings rate is negative or low (<10%), suggest ways to reduce spending
3. If savings rate is good (>20%), provide encouragement and investment suggestions
4. Highlight unusual spending patterns in top categories
5. Be encouraging but realistic
6. Use "type": "positive" for good habits, "warning" for concerns, "neutral" for general advice
7. Keep insights concise and practical

Example response:
[
  {
    "title": "Great Savings Performance! 🎯",
    "description": "Your 25% savings rate is excellent! Consider investing surplus in diversified index funds or high-yield savings accounts.",
    "type": "positive"
  },
  {
    "title": "Food & Dining Spending High",
    "description": "Food costs are 35% of expenses. Try meal prepping on Sundays to reduce dining out and save $200-300 monthly.",
    "type": "warning"
  },
  {
    "title": "Build Emergency Fund",
    "description": "Aim to save 3-6 months of expenses. Start by automating $100 weekly transfers to a separate savings account.",
    "type": "neutral"
  }
]

Return ONLY valid JSON array, no additional text or markdown.`;
};