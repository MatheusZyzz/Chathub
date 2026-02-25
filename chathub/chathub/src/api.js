import { PROVIDERS, SYSTEM_MSG } from "./providers";

// ─── DETERMINE API BASE URL ───
// In development, Vite proxy handles CORS (e.g., /api/anthropic -> api.anthropic.com)
// In production, calls go through /api/chat serverless function
const isDev = import.meta.env.DEV;

// ─── PROVIDER API IMPLEMENTATIONS ───

async function callClaude(messages, apiKey) {
  const formatted = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const url = isDev
    ? "/api/anthropic/v1/messages"
    : "/api/chat";

  const body = isDev
    ? {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM_MSG,
        messages: formatted,
      }
    : {
        provider: "claude",
        apiKey,
        messages: formatted,
      };

  const headers = { "Content-Type": "application/json" };
  if (isDev && apiKey) headers["x-api-key"] = apiKey;
  if (isDev) headers["anthropic-version"] = "2023-06-01";
  if (isDev) headers["anthropic-dangerous-direct-browser-access"] = "true";

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `Erro Claude: ${res.status}`);
  }
  const data = await res.json();

  if (isDev) {
    return data.content?.[0]?.text || "Sem resposta.";
  }
  return data.text || "Sem resposta.";
}

async function callOpenAI(messages, apiKey) {
  const formatted = [
    { role: "system", content: SYSTEM_MSG },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const url = isDev
    ? "/api/openai/v1/chat/completions"
    : "/api/chat";

  const body = isDev
    ? { model: "gpt-4o", messages: formatted, max_tokens: 1024 }
    : { provider: "gpt", apiKey, messages: messages.map((m) => ({ role: m.role, content: m.content })) };

  const headers = { "Content-Type": "application/json" };
  if (isDev) headers["Authorization"] = `Bearer ${apiKey}`;

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `Erro OpenAI: ${res.status}`);
  }
  const data = await res.json();

  if (isDev) {
    return data.choices?.[0]?.message?.content || "Sem resposta.";
  }
  return data.text || "Sem resposta.";
}

async function callGemini(messages, apiKey) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = isDev
    ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
    : "/api/chat";

  const body = isDev
    ? {
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_MSG }] },
        generationConfig: { maxOutputTokens: 1024 },
      }
    : { provider: "gemini", apiKey, messages: messages.map((m) => ({ role: m.role, content: m.content })) };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `Erro Gemini: ${res.status}`);
  }
  const data = await res.json();

  if (isDev) {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta.";
  }
  return data.text || "Sem resposta.";
}

async function callMistral(messages, apiKey) {
  const formatted = [
    { role: "system", content: SYSTEM_MSG },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const url = isDev
    ? "/api/mistral/v1/chat/completions"
    : "/api/chat";

  const body = isDev
    ? { model: "mistral-large-latest", messages: formatted, max_tokens: 1024 }
    : { provider: "mistral", apiKey, messages: messages.map((m) => ({ role: m.role, content: m.content })) };

  const headers = { "Content-Type": "application/json" };
  if (isDev) headers["Authorization"] = `Bearer ${apiKey}`;

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `Erro Mistral: ${res.status}`);
  }
  const data = await res.json();

  if (isDev) {
    return data.choices?.[0]?.message?.content || "Sem resposta.";
  }
  return data.text || "Sem resposta.";
}

async function callGroq(messages, apiKey) {
  const formatted = [
    { role: "system", content: SYSTEM_MSG },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const url = isDev
    ? "/api/groq/openai/v1/chat/completions"
    : "/api/chat";

  const body = isDev
    ? { model: "llama-3.3-70b-versatile", messages: formatted, max_tokens: 1024 }
    : { provider: "groq", apiKey, messages: messages.map((m) => ({ role: m.role, content: m.content })) };

  const headers = { "Content-Type": "application/json" };
  if (isDev) headers["Authorization"] = `Bearer ${apiKey}`;

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `Erro Groq: ${res.status}`);
  }
  const data = await res.json();

  if (isDev) {
    return data.choices?.[0]?.message?.content || "Sem resposta.";
  }
  return data.text || "Sem resposta.";
}

// ─── CALLER MAP ───
export const API_CALLERS = {
  claude: callClaude,
  gpt: callOpenAI,
  gemini: callGemini,
  mistral: callMistral,
  groq: callGroq,
};

// ─── MAIN FUNCTION ───
export async function getResponse(providerId, messages, text, apiKeys) {
  const provider = PROVIDERS.find((p) => p.id === providerId);
  const key = apiKeys[providerId];

  if (!key) {
    // Simulated response when no key
    return new Promise((r) =>
      setTimeout(
        () =>
          r(
            `[${provider.name} – sem API key]\nEsta é uma resposta simulada. Conecte sua API key de ${provider.tagline} em ⚙️ Configurações para respostas reais.\n\nVocê disse: "${text}"`
          ),
        600 + Math.random() * 800
      )
    );
  }

  return API_CALLERS[providerId](messages, key);
}
