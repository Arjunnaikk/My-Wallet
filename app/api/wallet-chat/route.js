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
${breakdown || 'No expenses recorded this month.'}`;
  }
  
  if (query.includes('budget') || query.includes('limit') || query.includes('over')) {
    const rows = budgets.map(b => {
      const spent = categoryExpenses[b.category] || 0;
      const limit = parseFloat(b.limit_amount) || 0;
      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      const status = percent >= 100 ? '🔴 Over' : percent >= 80 ? '🟡 Warning' : '🟢 Safe';
      return `| **${b.category.toUpperCase()}** | ${fmt(limit)} | ${fmt(spent)} | ${status} (${percent.toFixed(0)}%) |`;
    }).join('\n');

    return `### 🎯 Budget Compliance (Offline Fallback)
Here is your budget status relative to your expenses this month:

| Category | Budget Limit | Spent | Status |
| :--- | :--- | :--- | :--- |
${rows || '| No budgets configured | - | - | - |'}`;
  }

  return `### 💼 Wallet Overview (Offline Fallback)
Here is a summary from your local ledger database:

*   **Total Available Balances**: **${fmt(totalBalance)}**
    ${accounts.map(a => `- **${a.name}**: ${fmt(a.balance)}`).join('\n')}

*   **Recent Transactions**:
    ${transactions.slice(0, 5).map(t => `- [${t.date}] **${t.description || t.category}**: ${t.type === 'expense' ? '-' : '+'}₹${t.amount}`).join('\n') || 'No transactions recorded yet.'}`;
}

export async function POST(req) {
  try {
    const { messages, transactions, budgets, accounts } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const apiKey = groqApiKey || geminiApiKey;

    if (!apiKey) {
      const fallbackReply = localChatAdvisorFallback(lastUserMessage, transactions, budgets, accounts);
      return NextResponse.json({ reply: fallbackReply });
    }

    const accountsCtx = accounts
      ? accounts.map(a => `- ${a.name} (${a.type}): ₹${parseFloat(a.balance).toFixed(2)}`).join('\n')
      : 'No accounts data';

    const budgetsCtx = budgets
      ? budgets.map(b => `- ${b.category}: Limit ₹${parseFloat(b.limit_amount).toFixed(2)}`).join('\n')
      : 'No budgets configured';

    const recentTransactions = transactions
      ? transactions.slice(0, 100).map(t => 
          `[${t.date}] ${t.type.toUpperCase()}: ₹${t.amount} in '${t.category}' - ${t.description || 'No desc'}`
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
5. Base all answers strictly on the user's provided data.
6. Provide actionable recommendations.`;

    let reply;
    const isGroq = groqApiKey || apiKey.startsWith('gsk_');

    try {
      if (isGroq) {
        // Groq API with llama-3.3-70b-versatile
        const groqMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: 0.5
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Groq Chat error ${response.status}: ${errorText}. Using fallback.`);
          reply = localChatAdvisorFallback(lastUserMessage, transactions, budgets, accounts);
        } else {
          const resData = await response.json();
          reply = resData.choices?.[0]?.message?.content;
          if (!reply) throw new Error('Invalid response from Groq API');
        }
      } else {
        // Gemini API
        const geminiContents = messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        geminiContents.unshift({
          role: 'user',
          parts: [{ text: `SYSTEM CONTEXT: ${systemPrompt}` }]
        }, {
          role: 'model',
          parts: [{ text: 'Greetings! I am your My Wallet AI Assistant. How can I help you analyze your finances today?' }]
        });

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: geminiContents })
          }
        );

        if (!response.ok) {
          reply = localChatAdvisorFallback(lastUserMessage, transactions, budgets, accounts);
        } else {
          const resData = await response.json();
          reply = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!reply) throw new Error('Invalid response from Gemini API');
        }
      }
    } catch (apiErr) {
      console.warn("Exception during Chat AI, using fallback:", apiErr.message);
      reply = localChatAdvisorFallback(lastUserMessage, transactions, budgets, accounts);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Wallet Chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
