import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function basicFallbackParse(text) {
  const result = {
    type: 'expense',
    amount: 0,
    category: 'other',
    description: 'Quick Add Entry',
    date: new Date().toISOString().split('T')[0],
    source_account: 'cash',
    destination_account: null,
    is_fallback: true
  };

  // 1. Extract amount
  const amountMatch = text.match(/(?:rs\.?|inr|₹|\$)?\s*(\d+(?:\.\d{1,2})?)/i);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1]);
  }

  // 2. Determine transaction type
  const textLower = text.toLowerCase();
  if (textLower.includes('received') || textLower.includes('got') || textLower.includes('salary') || textLower.includes('income')) {
    result.type = 'income';
    result.category = 'salary';
    result.description = 'Income Entry';
  } else if (textLower.includes('transfer') || textLower.includes('sent to')) {
    result.type = 'transfer';
    result.category = 'transfer';
    result.description = 'Funds Transfer';
  }

  // 3. Parse category keywords
  if (textLower.includes('pizza') || textLower.includes('food') || textLower.includes('restaurant') || textLower.includes('dinner') || textLower.includes('lunch') || textLower.includes('burger') || textLower.includes('swiggy') || textLower.includes('zomato') || textLower.includes('eat')) {
    result.category = 'food';
    result.description = 'Food / Restaurant';
  } else if (textLower.includes('uber') || textLower.includes('ola') || textLower.includes('cab') || textLower.includes('bus') || textLower.includes('train') || textLower.includes('metro') || textLower.includes('travel')) {
    result.category = 'transport';
    result.description = 'Transport';
  } else if (textLower.includes('movie') || textLower.includes('netflix') || textLower.includes('spotify') || textLower.includes('game')) {
    result.category = 'entertainment';
    result.description = 'Entertainment';
  } else if (textLower.includes('rent') || textLower.includes('electricity') || textLower.includes('bill') || textLower.includes('water')) {
    result.category = 'utilities';
    result.description = 'Utility Bill';
  } else if (textLower.includes('doctor') || textLower.includes('medicine') || textLower.includes('hospital') || textLower.includes('health') || textLower.includes('medical')) {
    result.category = 'health';
    result.description = 'Medical / Health';
  } else if (textLower.includes('shopping') || textLower.includes('amazon') || textLower.includes('myntra') || textLower.includes('clothing') || textLower.includes('bought')) {
    result.category = 'shopping';
    result.description = 'Shopping Purchase';
  }

  // 4. Determine source wallet
  if (textLower.includes('cash')) {
    result.source_account = 'cash';
  } else if (textLower.includes('bank') || textLower.includes('gpay') || textLower.includes('upi') || textLower.includes('card')) {
    result.source_account = 'bank';
  }

  // 5. Clean description
  const cleanMatch = text.match(/(?:spent|on|for|from|at)\s+([a-zA-Z\s]+)(?:\s+(?:rs|₹|\$|\d)|$)/i);
  if (cleanMatch && cleanMatch[1] && cleanMatch[1].trim().length > 2) {
    const desc = cleanMatch[1].trim();
    result.description = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  return result;
}

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(basicFallbackParse(text));
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayDayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const systemPrompt = `You are a precise transaction parser. Extract transaction details from the user's natural language input and return a JSON object.
Use the following context for dates:
- Today's date is: ${todayStr} (which is a ${todayDayOfWeek}).
- Relative terms like "yesterday", "day before yesterday", "last monday", "2 days ago" must be calculated relative to this date.

Return a JSON object conforming strictly to this structure:
{
  "type": "income" | "expense" | "transfer",
  "amount": number,
  "category": "salary" | "food" | "transport" | "utilities" | "entertainment" | "shopping" | "health" | "travel" | "other",
  "description": string,
  "date": "YYYY-MM-DD",
  "source_account": "cash" | "bank" | "credit card" | null,
  "destination_account": "cash" | "bank" | "credit card" | null
}

Rules:
1. "amount" must be a positive number.
2. If "source_account" or "destination_account" are mentioned, map them to "cash", "bank", or "credit card". If not mentioned, set to null.
3. For standard income/expenses, "source_account" represents the account where money goes/leaves.
4. For transfers, "source_account" is the sender and "destination_account" is the receiver.
5. Provide a brief, clean description (capitalized).
6. Try to guess the best category. E.g., Uber -> transport, Groceries -> food, Rent -> utilities, Salary -> salary, Movie -> entertainment, Doctor -> health.
7. Return ONLY the JSON object. Do not wrap it in markdown code blocks.`;

    let parsedTransaction;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: `Parse this transaction: "${text}"` }
                ]
              }
            ],
            generation_config: {
              response_mime_type: 'application/json',
            }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Gemini API returned error code ${response.status}: ${errorText}. Falling back to offline parse.`);
        parsedTransaction = basicFallbackParse(text);
      } else {
        const resData = await response.json();
        const outputText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!outputText) {
          throw new Error('Invalid response from Gemini API');
        }
        parsedTransaction = JSON.parse(outputText);
      }
    } catch (apiErr) {
      console.warn("Exception calling Gemini API, using offline fallback:", apiErr.message);
      parsedTransaction = basicFallbackParse(text);
    }

    return NextResponse.json(parsedTransaction);
  } catch (error) {
    console.error('NLP Parse error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
