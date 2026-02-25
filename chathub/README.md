# ⚡ ChatHub — Multi-Provider AI Chat

Hub de chat que conecta **Claude, GPT-4o, Gemini, Mistral e Llama 3** em uma interface unificada.  
Cada usuário cria sua conta, conecta suas próprias API keys e conversa.

---

## 📋 O que você precisa

| Item | Mínimo |
|------|--------|
| **Servidor** | VPS com 1 vCPU, 1GB RAM (ex: DigitalOcean $6/mês, Hetzner €4/mês, Oracle Cloud grátis) |
| **Sistema** | Ubuntu 22.04+ ou qualquer Linux com Docker |
| **Docker** | Docker + Docker Compose instalados |
| **Domínio** (opcional) | Para HTTPS (ex: `chat.seusite.com`) |

---

## 🚀 Deploy Passo a Passo

### PASSO 1 — Preparar o servidor

Conecte no seu servidor via SSH:

```bash
ssh root@SEU_IP_DO_SERVIDOR
```

Instale o Docker (se ainda não tiver):

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Permitir seu usuário usar Docker sem sudo
sudo usermod -aG docker $USER

# Instalar Docker Compose (já vem com Docker moderno)
docker compose version
```

> **Dica**: Se `docker compose` não funcionar, tente `docker-compose` (com hífen).  
> Se não tiver, instale: `sudo apt install docker-compose-plugin`

---

### PASSO 2 — Baixar o projeto

**Opção A** — Clonar do Git (se subiu pra um repositório):
```bash
git clone https://github.com/SEU_USUARIO/chathub.git
cd chathub
```

**Opção B** — Enviar via SCP (se tem o zip local):
```bash
# No seu computador local:
scp chathub.zip root@SEU_IP:~/

# No servidor:
unzip chathub.zip
cd chathub
```

**Opção C** — Criar os arquivos manualmente:
```bash
mkdir chathub && cd chathub
# Copie e cole os arquivos do projeto
```

---

### PASSO 3 — Subir com Docker

```bash
# Construir a imagem e rodar
docker compose up -d --build
```

Isso vai:
1. Instalar as dependências
2. Compilar o frontend React
3. Iniciar o servidor Express na porta 3000

Verifique se está rodando:

```bash
# Ver status do container
docker compose ps

# Ver logs em tempo real
docker compose logs -f

# Testar se responde
curl http://localhost:3000/api/health
```

✅ **Pronto!** O ChatHub já está acessível em `http://SEU_IP:3000`

---

### PASSO 4 — Compartilhar com outras pessoas

Agora qualquer pessoa pode acessar digitando `http://SEU_IP:3000` no navegador.

Cada pessoa vai:
1. **Criar uma conta** (usuário + senha)
2. Clicar em **⚙️ Configurações de API**
3. Colar suas próprias API keys dos providers que quiser usar
4. Clicar em **Testar** para validar
5. Começar a conversar!

> **Importante**: As API keys ficam salvas no navegador de cada usuário (localStorage), 
> não no servidor. Cada pessoa usa suas próprias keys.

---

## 🔒 (Opcional) Configurar HTTPS com domínio

Se você tem um domínio, pode ativar HTTPS:

### 4.1 — Apontar o domínio

No painel DNS do seu domínio, crie um registro **A**:

```
Tipo: A
Nome: chat (ou @ para raiz)
Valor: SEU_IP_DO_SERVIDOR
TTL: 300
```

### 4.2 — Configurar Nginx

```bash
# Copiar o exemplo
cp nginx.conf.example nginx.conf

# Editar com seu domínio
nano nginx.conf
# Troque "seu-dominio.com" pelo seu domínio real
```

### 4.3 — Ativar Nginx no docker-compose

Abra o `docker-compose.yml` e descomente as seções do `nginx` e `certbot`:

```bash
nano docker-compose.yml
# Remova os # das linhas do nginx e certbot
```

### 4.4 — Obter certificado SSL

```bash
# Primeiro, pare tudo
docker compose down

# Suba apenas o nginx para o desafio HTTP
docker compose up -d nginx

# Gere o certificado
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d seu-dominio.com \
  --email seu@email.com \
  --agree-tos \
  --no-eff-email

# Suba tudo
docker compose up -d
```

✅ Agora acesse `https://seu-dominio.com`

---

## 🛠️ Comandos úteis

```bash
# Ver status
docker compose ps

# Ver logs
docker compose logs -f chathub

# Reiniciar
docker compose restart

# Parar tudo
docker compose down

# Atualizar (depois de editar o código)
docker compose up -d --build

# Ver uso de recursos
docker stats chathub
```

---

## 🔧 Desenvolvimento local (sem Docker)

Se quiser desenvolver ou testar localmente:

```bash
cd chathub
npm install

# Terminal 1: servidor backend (porta 3000)
npm start

# Terminal 2: frontend com hot reload (porta 5173)
npm run dev
```

Acesse `http://localhost:5173` (o Vite faz proxy das chamadas `/api` para o Express).

---

## 📁 Estrutura do Projeto

```
chathub/
├── src/                    # Frontend React
│   ├── App.jsx             # Componente principal (auth + chat + settings)
│   ├── api.js              # Chamadas para /api/chat
│   ├── providers.js        # Configuração dos 5 providers
│   ├── storage.js          # localStorage helpers
│   ├── index.css           # Estilos e animações
│   └── main.jsx            # Entry point
├── server.js               # Servidor Express (proxy + serve frontend)
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Orquestração
├── nginx.conf.example      # Config Nginx para HTTPS
├── vite.config.js          # Config Vite (dev)
├── package.json
├── .dockerignore
└── .gitignore
```

---

## 🔌 Providers e onde obter as keys

| Provider | Modelo | Link para API Key | Preço |
|----------|--------|-------------------|-------|
| **Claude** | claude-sonnet-4-20250514 | [console.anthropic.com](https://console.anthropic.com/) | Pay-per-use |
| **GPT-4o** | gpt-4o | [platform.openai.com](https://platform.openai.com/api-keys) | Pay-per-use |
| **Gemini** | gemini-2.0-flash | [aistudio.google.com](https://aistudio.google.com/apikey) | **Grátis** (com limites) |
| **Mistral** | mistral-large-latest | [console.mistral.ai](https://console.mistral.ai/api-keys/) | Pay-per-use |
| **Llama 3** | llama-3.3-70b-versatile | [console.groq.com](https://console.groq.com/keys) | **Grátis** (com limites) |

> 💡 **Dica**: Gemini e Groq (Llama 3) têm planos gratuitos generosos. 
> Ótimo para testar sem gastar nada.

---

## ➕ Adicionar um novo provider

1. Adicione em `src/providers.js`:
```js
{ id: "novoai", name: "NovoAI", model: "novo-model", color: "#FF0000", ... }
```

2. Adicione o case em `server.js` (no switch do `/api/chat`):
```js
case "novoai": {
  // implementar chamada para a API do NovoAI
  break;
}
```

3. Pronto — o frontend já detecta automaticamente.

---

## ❓ FAQ

**P: As API keys ficam no servidor?**  
R: Não. As keys ficam no localStorage de cada navegador. O servidor apenas faz proxy das chamadas (recebe a key temporariamente, chama a API do provider, e retorna a resposta).

**P: Posso usar sem domínio?**  
R: Sim! Basta acessar `http://SEU_IP:3000`. Para HTTPS (recomendado), precisa de domínio.

**P: Quantos usuários suportam?**  
R: Muitos. O servidor só faz proxy (não armazena nada). O gargalo seria a banda da VPS, não o app.

**P: E se eu quiser um banco de dados?**  
R: Atualmente usa localStorage (dados ficam no navegador de cada usuário). Para dados centralizados, seria preciso adicionar MongoDB/PostgreSQL + autenticação via JWT.

**P: Como atualizo?**  
R: Edite os arquivos, depois: `docker compose up -d --build`

---

## 📄 Licença

MIT — use, modifique e distribua livremente.
