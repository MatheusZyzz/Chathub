# ⚡ ChatHub — Multi-Provider AI Chat

Um hub de chat que conecta múltiplos modelos de IA (Claude, GPT-4o, Gemini, Mistral, Llama 3) em uma interface unificada estilo ChatGPT.

![ChatHub](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![Deploy](https://img.shields.io/badge/Deploy-Vercel-black)

## ✨ Funcionalidades

- 🔐 **Sistema de login/cadastro** com senha criptografada (SHA-256)
- 💬 **Meus Chats** — histórico completo salvo localmente
- 🤖 **5 Providers de IA** — Claude, GPT-4o, Gemini, Mistral, Llama 3 (via Groq)
- 📡 **Broadcast Mode** — envie para todos os modelos e compare respostas
- ⚙️ **Configuração de API Keys** — cada usuário conecta suas próprias keys
- 🔑 **Teste de conexão** — valide suas keys antes de usar
- 🔍 **Busca nos chats** — encontre conversas antigas rapidamente
- ✏️ **Renomear chats** — duplo-clique no título para editar
- 💾 **Persistência total** — tudo salvo no localStorage por usuário

## 🚀 Deploy Rápido (Vercel — Recomendado)

### Pré-requisitos
- Conta no [GitHub](https://github.com)
- Conta no [Vercel](https://vercel.com) (grátis)

### Passo a passo

#### 1. Suba para o GitHub

```bash
# Na pasta do projeto
cd chathub

# Inicie o git
git init
git add .
git commit -m "ChatHub initial commit"

# Crie um repositório no GitHub e conecte
git remote add origin https://github.com/SEU_USUARIO/chathub.git
git branch -M main
git push -u origin main
```

#### 2. Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique **"Add New" → "Project"**
3. Selecione o repositório `chathub`
4. O Vercel detecta automaticamente o Vite — clique **"Deploy"**
5. Aguarde ~1 minuto. Pronto! Seu ChatHub estará em `https://chathub-xxx.vercel.app`

#### 3. Configure um domínio (opcional)

No dashboard do Vercel → Settings → Domains → adicione seu domínio personalizado.

## 🛠️ Desenvolvimento Local

```bash
# Clone o projeto
git clone https://github.com/SEU_USUARIO/chathub.git
cd chathub

# Instale dependências
npm install

# Rode em modo desenvolvimento
npm run dev

# Acesse http://localhost:3000
```

Em desenvolvimento, o Vite proxy cuida do CORS automaticamente.
Em produção (Vercel), a serverless function `api/chat.js` faz o proxy.

## 📁 Estrutura do Projeto

```
chathub/
├── api/
│   └── chat.js          # Serverless function (proxy para APIs)
├── public/
├── src/
│   ├── api.js           # Chamadas para cada provider
│   ├── App.jsx          # Componente principal (auth + chat)
│   ├── index.css        # Estilos globais e animações
│   ├── main.jsx         # Entry point React
│   ├── providers.js     # Configuração dos providers
│   └── storage.js       # Utilitários de persistência (localStorage)
├── index.html
├── package.json
├── vercel.json          # Configuração Vercel
└── vite.config.js       # Configuração Vite + proxies dev
```

## 🔌 Providers Suportados

| Provider | Modelo | Onde obter a API Key |
|----------|--------|---------------------|
| **Claude** | claude-sonnet-4-20250514 | [console.anthropic.com](https://console.anthropic.com/) |
| **GPT-4o** | gpt-4o | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Gemini** | gemini-2.0-flash | [aistudio.google.com](https://aistudio.google.com/apikey) |
| **Mistral** | mistral-large-latest | [console.mistral.ai](https://console.mistral.ai/api-keys/) |
| **Llama 3** | llama-3.3-70b-versatile | [console.groq.com](https://console.groq.com/keys) |

## 🔒 Segurança

- API keys ficam salvas **apenas no localStorage do navegador** de cada usuário
- Em produção, as chamadas passam pela serverless function do Vercel (server-side), evitando exposição de keys no client
- Senhas são hasheadas com SHA-256 antes de salvar
- Nenhum dado é enviado a servidores externos além dos próprios providers de IA

## 🎨 Personalização

### Adicionar um novo provider

1. Adicione o provider em `src/providers.js`
2. Implemente a função de chamada em `src/api.js`
3. Adicione o case correspondente em `api/chat.js`

### Alterar tema/cores

As cores são definidas inline nos componentes. Os tokens principais:
- Background: `#131316`
- Surface: `#18181C`, `#1A1A1F`, `#1E1E22`
- Borders: `#2A2A30`
- Accent: `#E8D5B7`, `#C9A96E` (dourado)
- Text: `#E8E6E3`, `#F0EDE8`

## 📋 Alternativas de Deploy

### Netlify

```bash
npm run build
# Arraste a pasta `dist/` para netlify.com/drop
# Adicione um arquivo netlify/functions/chat.js com a mesma lógica do api/chat.js
```

### Railway / Render

Use como um servidor Node.js. Adicione um `server.js`:

```js
import express from 'express';
import { handler } from './api/chat.js';

const app = express();
app.use(express.json());
app.use(express.static('dist'));
app.post('/api/chat', handler);
app.get('*', (req, res) => res.sendFile('dist/index.html'));
app.listen(process.env.PORT || 3000);
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "server.js"]
```

## 📄 Licença

MIT — use, modifique e distribua livremente.
