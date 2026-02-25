import { PROVIDERS } from "./providers";

// All calls go through /api/chat (Express server handles CORS & proxying)
async function callProvider(provider, apiKey, messages) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      apiKey,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Erro ${res.status}`);
  }

  return data.text || "Sem resposta.";
}

// Exported so the settings modal can test keys
export async function testApiKey(providerId, apiKey) {
  return callProvider(providerId, apiKey, [{ role: "user", content: "Diga apenas: OK" }]);
}

// Main function
export async function getResponse(providerId, messages, text, apiKeys) {
  const provider = PROVIDERS.find((p) => p.id === providerId);
  const key = apiKeys[providerId];

  if (!key) {
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

  return callProvider(providerId, key, messages);
}
