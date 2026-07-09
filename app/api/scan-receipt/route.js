import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY is not configured in .env.local'
      }, { status: 500 });
    }

    // Strip out base64 prefixes if present
    const regex = /^data:(image\/\w+);base64,(.*)$/;
    const matches = image.match(regex);
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (matches) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const promptText = `Analyze this receipt image. Perform OCR and extract details into a structured JSON object.
Today's default date is: ${todayStr}. Use the receipt's date if printed, else fallback to this default date.

Return a JSON object conforming strictly to this structure:
{
  "amount": number,
  "category": "salary" | "food" | "transport" | "utilities" | "entertainment" | "shopping" | "health" | "travel" | "other",
  "description": string,
  "date": "YYYY-MM-DD",
  "items": string[]
}

Rules:
1. "amount" must be the grand total of the receipt as a positive number.
2. "description" should be the name of the store, merchant, or service provider (capitalized).
3. Guess the best category (e.g. restaurant/grocery -> "food", bus/taxi -> "transport", clothes/electronics -> "shopping", movie -> "entertainment").
4. "items" should list up to 5 main items printed on the receipt.
5. Return ONLY the JSON object. Do not wrap it in markdown code blocks.`;

    // Call Gemini API with multimodal vision capabilities
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
                { text: promptText },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
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
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const resData = await response.json();
    const outputText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!outputText) {
      throw new Error('Invalid response from Gemini API');
    }

    const parsedReceipt = JSON.parse(outputText);
    return NextResponse.json(parsedReceipt);
  } catch (error) {
    console.error('Receipt Scan error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
