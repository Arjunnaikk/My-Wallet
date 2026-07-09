const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually
const envLocalPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.error('Error: .env.local not found at ' + envLocalPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const apiKey = env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY is missing in your .env.local file.');
  process.exit(1);
}

console.log('Testing Gemini API Connection...');
console.log('API Key (first 6 chars):', apiKey.substring(0, 6) + '...');

async function testGemini() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: 'Say "hello world" if you can hear me.' }
              ]
            }
          ]
        }),
      }
    );

    const status = response.status;
    const resText = await response.text();

    if (response.ok) {
      const resData = JSON.parse(resText);
      const outputText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('\n✅ GEMINI API IS WORKING!');
      console.log('Response Status:', status);
      console.log('Gemini reply:', outputText ? outputText.trim() : '(Empty response)');
    } else {
      console.log('\n❌ GEMINI API ERROR!');
      console.log('Response Status:', status);
      console.log('Error Details:', resText);
    }
  } catch (err) {
    console.error('\n❌ HTTP Request Failed:', err.message);
  }
}

testGemini();
