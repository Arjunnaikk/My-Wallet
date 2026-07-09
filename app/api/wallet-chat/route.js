import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function txInCurrentMonth(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const txDate = new Date(dateStr);
  return txDate.getFullYear() === today.getFullYear() && txDate.getMonth() === today.getMonth();
}

function localChatAdvisorFallback(userQuery, transactions = [], budgets = [], accounts = []) {
  const query = userQuery.toLowerCase();
  const totalBalance = accounts.reduce((acc, a) => acc + (parseFloat(a.balance) || 0), 0);
  
  let totalExpense = 0;
  let totalIncome = 0;
  const categoryExpenses = {};
  
  transactions.forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (txInCurrentMonth(t.date)) {
      if (t.type === 'expense') {
        totalExpense += amt;
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + amt;
      } else if (t.type === 'income') {
        totalIncome += amt;
      }
    }
  });

  const netSavings = totalIncome - totalExpense;
  const fmt = (num) => `₹${parseFloat(num).toFixed(2)}`;

  if (query.includes('spend') || query.includes('expense') || query.includes('summary') || query.includes('how much') || query.includes('history')) {
    const breakdown = Object.entries(categoryExpenses)
      .map(([cat, amt]) => `- **${cat.toUpperCase()}**: ${fmt(amt)}`)
      .join('\n');

    return `### 📊 Monthly Financial Summary (Offline Fallback)
Here is a local calculation of your transactions for the current month:

*   **Total Income**: **${fmt(totalIncome)}**
*   **Total Expenses**: **${fmt(totalExpense)}**
*   **Net Savings**: **${fmt(netSavings)}** (${netSavings >= 0 ? 'Surplus' : 'Deficit'})
*   **Wallet Balances**: **${fmt(totalBalance)}**

**Category Breakdown:**
${breakdown || 'No expenses recorded this month.'}

---
*Note: Your Gemini API Key returned a quota error (429). I calculated these stats offline using your local ledger database. Enable billing in Google AI Studio to unlock natural conversation.*`;
  }
  
  if (query.includes('budget') || query.includes('limit') || query.includes('over')) {
    const rows = budgets.map(b => {
      const spent = categoryExpenses[b.category] || 0;
      const limit = parseFloat(b.limit_amount) || 0;
      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      const status = percent >= 100 ? '🔴 Over' : percent >= 80 ? '专 Warning' : '🟢 Safe';
      return `| **${b.category.toUpperCase()}** | ${fmt(limit)} | ${fmt(spent)} | ${status} (${percent.toFixed(0)}%) |`;
    }).join('\n');

    return `### 🎯 Budget Compliance (Offline Fallback)
Here is your budget status relative to your expenses this month:

| Category | Budget Limit | Spent | Status |
| :--- | :--- | :--- | :--- |
${rows || '| No budgets configured | - | - | - |'}

---
*Note: Your Gemini API Key returned a quota error (429). I computed these stats offline using your local ledger database.*`;
  }
  
  if (query.includes('saving') || query.includes('tip') || query.includes('advice') || query.includes('help')) {
    const highestCat = Object.entries(categoryExpenses).sort((a,b) => b[1] - a[1])[0];
    const highestCatStr = highestCat ? `Your highest category expense is in **${highestCat[0].toUpperCase()}**. Try cutting back on non-essential purchases here.` : 'Analyze your largest category expenses and set budget alerts for them.';
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(0) : '0';

    return `### 💡 Saving Recommendations (Offline Fallback)
Based on your local transaction history, here are 3 financial tips:

1.  **Monitor Category Spending**: ${highestCatStr}
2.  **Aim for a 20% Savings Rate**: Your current savings rate is **${savingsRate}%**. Try to keep expenses below 80% of your incoming salary.
3.  **Review Subscriptions**: Audit your recurring payments and terminate any services you have not used in the last 30 days.

---
*Note: Your Gemini API Key returned a quota error (429). These tips are generated offline by the local advisor fallback.*`;
  }

  return `### 💼 Wallet Overview (Offline Fallback)
Your Gemini API Key returned a quota error (429), so I processed your query using your local ledger database:

*   **Total Available Balances**: **${fmt(totalBalance)}**
    ${accounts.map(a => `- **${a.name}**: ${fmt(a.balance)}`).join('\n')}

*   **Recent Transactions**:
    ${transactions.slice(0, 5).map(t => `- [${t.date}] **${t.description || t.category}**: ${t.type === 'expense' ? '-' : '+'}₹${t.amount}`).join('\n') || 'No transactions recorded yet.'}

How else can I help you check your ledger balances? (Or configure your Gemini API Key billing in Google AI Studio to unlock conversational chats!)`;
}

export async function POST(req) {
  try {
    const { messages, transactions, budgets, accounts } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbackReply = localChatAdvisorFallback(lastUserMessage, transactions, budgets, accounts);
      return NextResponse.json({ reply: fallbackReply });
    }

    // Prepare financial context
    const accountsCtx = accounts
      ? accounts.map(a => `- ${a.name} (${a.type}): ₹${parseFloat(a.balance).toFixed(2)}`).join('\n')
      : 'No accounts data';

    const budgetsCtx = budgets
      ? budgets.map(b => `- ${b.category}: Limit ₹${parseFloat(b.limit_amount).toFixed(2)}`).join('\n')
      : 'No budgets configured';

    // Format transactions concisely to save tokens
    const recentTransactions = transactions
      ? transactions.slice(0, 100).map(t => 
          `[${t.date}] ${t.type.toUpperCase()}: ₹${t.amount} in '${t.category}' - ${t.description || 'No desc'} (Account ID: ${t.account_id}${t.to_account_id ? `, To: ${t.to_account_id}` : ''})`
        ).join('\n')
      : 'No transactions recorded';

    const systemPrompt = `You are "My Wallet AI Assistant", a smart and helpful personal finance analyst. You help the user understand their financial situation, suggest saving strategies, warn about budget overruns, and analyze spending patterns.

Here is the user's current financial data:

ACCOUNTS:
${accountsCtx}

BUDGETS:
${budgetsCtx}

TRANSACTIONS (Showing last 100 transactions):
${recentTransactions}

Guidelines for responding:
1. Be concise, polite, and helpful. Use bold text, lists, and tables where appropriate to present numbers clearly.
2. Always refer to currencies in Indian Rupee (₹).
3. If they ask about their total spending, compute it from the transactions list provided.
4. If they ask about budget compliance, compare recent transaction categories against their budgets.
5. Base all answers strictly on the user's provided data. If they ask about things outside their data, gently guide them back to their finances.
6. Provide actionable recommendations (e.g., "You have spent 85% of your food budget, try to cook at home this week").
7. Do not mention that you received this data as a system context. Act as if you naturally have access to their secure ledger.`;

    // Map message roles for Gemini: 'user' remains 'user', 'assistant' maps to 'model'
    const geminiContents = messages.map(m => {
      const role = m.role === 'assistant' ? 'model' : 'user';
      return {
        role: role,
        parts: [{ text: m.content }]
      };
    });

    // Insert the system prompt at the very beginning of contents
    geminiContents.unshift({
      role: 'user',
      parts: [{ text: `SYSTEM CONTEXT: ${systemPrompt}\n\nUnderstood. I will help the user analyze this data.` }]
    }, {
      role: 'model',
      parts: [{ text: 'Greetings! I am your My Wallet AI Assistant. How can I help you analyze your finances today?' }]
    });

    let reply;
    try {
      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: geminiContents,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Gemini Chat API returned error: ${response.status} - ${errorText}. Using offline advisor fallback.`);
        reply = localChatAdvisorFallback(lastUserMessage, transactions, budgets, accounts);
      } else {
        const resData = await response.json();
        reply = resData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
          throw new Error('Invalid response from Gemini API');
        }
      }
    } catch (apiErr) {
      console.warn("Exception during Gemini Chat, using offline advisor fallback:", apiErr.message);
      reply = localChatAdvisorFallback(lastUserMessage, transactions, budgets, accounts);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Wallet Chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
