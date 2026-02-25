import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ─── SYSTEM PROMPT ───
const SYSTEM_MSG = "Você é um assistente útil. Responda de forma concisa no idioma do usuário.";

// ─── API PROXY ROUTE ───
// All AI provider calls go through here so API keys never touch the browser
app.post("/api/chat", async (req, res) => {
  const { provider, apiKey, messages } = req.body;

  if (!provider || !apiKey || !messages) {
    return res.status(400).json({ error: "Campos obrigatórios: provider, apiKey, messages" });
  }

  try {
    let text;

    switch (provider) {
      // ──────────────────────────
      // ANTHROPIC (Claude)
      // ──────────────────────────
      case "claude": {
        const formatted = messages.map((m) => ({ role: m.role, content: m.content }));
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: SYSTEM_MSG,
            messages: formatted,
          }),
        });
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.error?.message || `Claude API error: ${r.status}`);
        }
        const data = await r.json();
        text = data.content?.[0]?.text || "Sem resposta.";
        break;
      }

      // ──────────────────────────
      // OPENAI (GPT-4o)
      // ──────────────────────────
      case "gpt": {
        const formatted = [
          { role: "system", content: SYSTEM_MSG },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ];
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model: "gpt-4o", messages: formatted, max_tokens: 1024 }),
        });
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.error?.message || `OpenAI API error: ${r.status}`);
        }
        const data = await r.json();
        text = data.choices?.[0]?.message?.content || "Sem resposta.";
        break;
      }

      // ──────────────────────────
      // GOOGLE (Gemini)
      // ──────────────────────────
      case "gemini": {
        const contents = messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              systemInstruction: { parts: [{ text: SYSTEM_MSG }] },
              generationConfig: { maxOutputTokens: 1024 },
            }),
          }
        );
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.error?.message || `Gemini API error: ${r.status}`);
        }
        const data = await r.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta.";
        break;
      }

      // ──────────────────────────
      // MISTRAL
      // ──────────────────────────
      case "mistral": {
        const formatted = [
          { role: "system", content: SYSTEM_MSG },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ];
        const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model: "mistral-large-latest", messages: formatted, max_tokens: 1024 }),
        });
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.error?.message || `Mistral API error: ${r.status}`);
        }
        const data = await r.json();
        text = data.choices?.[0]?.message?.content || "Sem resposta.";
        break;
      }

      // ──────────────────────────
      // GROQ (Llama 3)
      // ──────────────────────────
      case "groq": {
        const formatted = [
          { role: "system", content: SYSTEM_MSG },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ];
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: formatted, max_tokens: 1024 }),
        });
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.error?.message || `Groq API error: ${r.status}`);
        }
        const data = await r.json();
        text = data.choices?.[0]?.message?.content || "Sem resposta.";
        break;
      }

      default:
        return res.status(400).json({ error: `Provider desconhecido: ${provider}` });
    }

    return res.status(200).json({ text });
  } catch (error) {
    console.error(`[${provider}] Error:`, error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── HEALTH CHECK ───
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ─── SERVE FRONTEND (production build) ───
app.use(express.static(join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

// ─── START SERVER ───
app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("  ⚡ ChatHub está rodando!");
  console.log("");
  console.log(`  ➜  Local:   http://localhost:${PORT}`);
  console.log(`  ➜  Network: http://0.0.0.0:${PORT}`);
  console.log("");
});
