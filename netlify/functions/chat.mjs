const SYSTEM_PROMPT = `You are the Audio Design Studio assistant. Help users with audio design, acoustics, room treatment, sound recording, soundscapes, and audio visualization. Be clear, practical, and honest about uncertainty. Give safe, general guidance and recommend a qualified professional for specialized construction or hearing-health concerns.`;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

export default async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Use POST to send a chat message.' }, 405, { Allow: 'POST' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json({ error: 'Chat is not configured yet. Add OPENAI_API_KEY to this site’s Netlify environment variables.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
    return json({ error: `Send between 1 and ${MAX_MESSAGES} messages.` }, 400);
  }

  const messages = [];
  for (const message of body.messages) {
    if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') {
      return json({ error: 'Each message must have a valid role and text content.' }, 400);
    }
    const content = message.content.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) {
      return json({ error: `Messages must be between 1 and ${MAX_MESSAGE_LENGTH} characters.` }, 400);
    }
    messages.push({ role: message.role, content });
  }

  if (messages[messages.length - 1].role !== 'user') {
    return json({ error: 'The last message must be from the user.' }, 400);
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        instructions: SYSTEM_PROMPT,
        input: messages,
        max_output_tokens: 800,
      }),
    });

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('OpenAI API request failed:', upstream.status, result.error?.type || result.error?.code || 'unknown error');
      return json({ error: upstream.status === 429 ? 'The assistant is busy or the API quota is unavailable. Try again shortly.' : 'The AI service could not complete your request. Check the API configuration and try again.' }, 502);
    }

    const reply = typeof result.output_text === 'string'
      ? result.output_text.trim()
      : (result.output || []).flatMap((item) => item.content || []).filter((item) => item.type === 'output_text').map((item) => item.text).join('\n').trim();

    if (!reply) return json({ error: 'The AI service returned no text. Please try again.' }, 502);
    return json({ reply }, 200);
  } catch (error) {
    console.error('Chat function error:', error instanceof Error ? error.message : 'unknown error');
    return json({ error: 'Could not reach the AI service. Please try again.' }, 502);
  }
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}
