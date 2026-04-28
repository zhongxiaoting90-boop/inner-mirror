export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(200).json({ content: [{ type: 'text', text: 'ERROR: GEMINI_API_KEY not set' }] });

  try {
    const { messages, system } = req.body;

    const contents = [];
    for (const m of messages) {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      });
    }

    const body = {
      system_instruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { maxOutputTokens: 800 }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ content: [{ type: 'text', text: 'API错误：' + data.error.message }] });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(200).json({ content: [{ type: 'text', text: 'NO_TEXT:' + JSON.stringify(data).slice(0, 200) }] });
    }

    return res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (error) {
    return res.status(200).json({ content: [{ type: 'text', text: 'CATCH:' + error.message }] });
  }
}
