import { useState, useRef, useEffect, useCallback } from "react";
import { PROVIDERS } from "./providers";
import { getResponse, testApiKey } from "./api";
import { storageGet, storageSet, storageDelete, hashPassword } from "./storage";

const timeNow = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dateNow = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// ═══════════════════════════
// AUTH SCREEN
// ═══════════════════════════
function AuthScreen({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!username.trim() || !password.trim()) return setError("Preencha todos os campos.");
    if (username.trim().length < 3) return setError("Usuário: mínimo 3 caracteres.");
    if (password.length < 4) return setError("Senha: mínimo 4 caracteres.");
    if (isSignup && password !== confirmPw) return setError("As senhas não coincidem.");
    setLoading(true);
    const hashed = await hashPassword(password);
    const ukey = `user:${username.trim().toLowerCase()}`;
    if (isSignup) {
      const ex = storageGet(ukey);
      if (ex) { setLoading(false); return setError("Usuário já existe."); }
      const ud = { username: username.trim().toLowerCase(), passwordHash: hashed };
      storageSet(ukey, ud);
      storageSet(`chats:${ud.username}`, []);
      storageSet(`apikeys:${ud.username}`, {});
      onLogin(ud.username);
    } else {
      const ex = storageGet(ukey);
      if (!ex || ex.passwordHash !== hashed) { setLoading(false); return setError("Usuário ou senha incorretos."); }
      onLogin(ex.username);
    }
    setLoading(false);
  };

  const inp = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #2A2A30", background: "#131316", color: "#E8E6E3", fontSize: 14, fontFamily: "inherit", outline: "none" };
  const lbl = { fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at 30% 20%, #1A1915 0%, #131316 60%)" }}>
      <div style={{ width: 400, animation: "fadeUp 0.5s ease-out", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #E8D5B7, #C9A96E)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 16, animation: "float 3s ease-in-out infinite", boxShadow: "0 8px 32px rgba(201,169,110,0.2)" }}>⚡</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#F0EDE8", letterSpacing: "-0.03em" }}>ChatHub</h1>
          <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Multi-Provider AI Chat</p>
        </div>
        <div style={{ background: "#1A1A1F", border: "1px solid #2A2A30", borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#E8E6E3", marginBottom: 4 }}>{isSignup ? "Criar conta" : "Entrar"}</h2>
          <p style={{ fontSize: 12, color: "#777", marginBottom: 24 }}>{isSignup ? "Crie sua conta para começar" : "Bem-vindo de volta"}</p>
          {error && <div style={{ background: "#FF4D4F15", border: "1px solid #FF4D4F30", color: "#FF6B6B", padding: "10px 14px", borderRadius: 10, fontSize: 12, marginBottom: 16 }}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={lbl}>Usuário</label><input value={username} onChange={e => setUsername(e.target.value)} placeholder="seu_usuario" onKeyDown={e => e.key==="Enter"&&submit()} style={inp} /></div>
            <div><label style={lbl}>Senha</label><input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••" onKeyDown={e => e.key==="Enter"&&submit()} style={inp} /></div>
            {isSignup && <div><label style={lbl}>Confirmar Senha</label><input value={confirmPw} onChange={e => setConfirmPw(e.target.value)} type="password" placeholder="••••••" onKeyDown={e => e.key==="Enter"&&submit()} style={inp} /></div>}
            <button onClick={submit} disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: loading?"#444":"linear-gradient(135deg, #E8D5B7, #C9A96E)", color: "#1A1A1E", fontSize: 14, fontWeight: 600, cursor: loading?"wait":"pointer", fontFamily: "inherit", marginTop: 4 }}>{loading ? "Aguarde..." : isSignup ? "Criar conta" : "Entrar"}</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}><button onClick={() => { setIsSignup(!isSignup); setError(""); }} style={{ background: "none", border: "none", color: "#C9A96E", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{isSignup ? "Já tem conta? Entrar" : "Não tem conta? Criar"}</button></div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>{PROVIDERS.map(p => <div key={p.id} title={p.name} style={{ width: 32, height: 32, borderRadius: 8, background: p.color+"15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: p.accent, border: `1px solid ${p.color}25` }}>{p.icon}</div>)}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════
// API SETTINGS MODAL
// ═══════════════════════════
function ApiSettingsModal({ apiKeys, onSave, onClose }) {
  const [keys, setKeys] = useState({ ...apiKeys });
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});
  const [showKey, setShowKey] = useState({});

  const doTest = async (pid) => {
    if (!keys[pid]) return;
    setTesting(p => ({ ...p, [pid]: true }));
    setTestResults(p => ({ ...p, [pid]: null }));
    try {
      await testApiKey(pid, keys[pid]);
      setTestResults(p => ({ ...p, [pid]: "success" }));
    } catch (err) {
      setTestResults(p => ({ ...p, [pid]: err.message }));
    }
    setTesting(p => ({ ...p, [pid]: false }));
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, animation: "fadeUp 0.25s ease-out" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 540, maxHeight: "85vh", background: "#1A1A1F", border: "1px solid #2A2A30", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #2A2A30", display: "flex", justifyContent: "space-between" }}>
          <div><h2 style={{ fontSize: 18, fontWeight: 700, color: "#F0EDE8", margin: 0 }}>⚙️ Configurações de API</h2><p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>Conecte seus providers</p></div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid #2A2A30", color: "#888", cursor: "pointer", width: 32, height: 32, borderRadius: 8, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {PROVIDERS.map(p => {
              const hasKey = !!keys[p.id]; const result = testResults[p.id]; const ok = result === "success"; const isTesting = testing[p.id]; const vis = showKey[p.id];
              return (
                <div key={p.id} style={{ background: "#131316", border: `1px solid ${hasKey?p.color+"30":"#2A2A30"}`, borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: p.color+"20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: p.accent, border: `1px solid ${p.color}30` }}>{p.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#F0EDE8", display: "flex", alignItems: "center", gap: 8 }}>{p.name}{hasKey && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "#10A37F20", color: "#1ED99C", fontWeight: 600 }}>CONECTADO</span>}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{p.tagline} · {p.model}</div>
                    </div>
                    <a href={p.docsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: p.accent, textDecoration: "none", padding: "4px 10px", borderRadius: 6, border: `1px solid ${p.color}30` }}>Obter key →</a>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <input value={keys[p.id]||""} onChange={e => setKeys(prev => ({...prev,[p.id]:e.target.value}))} type={vis?"text":"password"} placeholder={p.placeholder}
                        style={{ width: "100%", padding: "9px 36px 9px 12px", borderRadius: 8, border: `1px solid ${ok?"#10A37F40":result&&!ok?"#FF4D4F40":"#2A2A30"}`, background: "#1A1A1F", color: "#E8E6E3", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", outline: "none" }} />
                      <button onClick={() => setShowKey(p2 => ({...p2,[p.id]:!p2[p.id]}))} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 13 }}>{vis?"🙈":"👁"}</button>
                    </div>
                    <button onClick={() => doTest(p.id)} disabled={isTesting||!keys[p.id]} style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: isTesting?"#333":p.color+"25", color: isTesting?"#666":p.accent, cursor: isTesting||!keys[p.id]?"not-allowed":"pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}>{isTesting?"...":"Testar"}</button>
                    {keys[p.id] && <button onClick={() => { setKeys(prev => ({...prev,[p.id]:""})); setTestResults(prev => ({...prev,[p.id]:null})); }} style={{ padding: "9px 10px", borderRadius: 8, border: "1px solid #FF4D4F30", background: "transparent", color: "#FF6B6B", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✕</button>}
                  </div>
                  {result && <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6, fontSize: 11, background: ok?"#10A37F12":"#FF4D4F12", color: ok?"#1ED99C":"#FF6B6B", border: `1px solid ${ok?"#10A37F25":"#FF4D4F25"}` }}>{ok?"✓ Conexão OK!":"✗ "+result}</div>}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 10, background: "#C9A96E08", border: "1px solid #C9A96E20" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#C9A96E", marginBottom: 4 }}>🔒 Segurança</div>
            <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>Suas API keys ficam salvas no navegador. As chamadas passam pelo servidor backend, que faz proxy para os providers — suas keys nunca ficam expostas no código-fonte do front.</div>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #2A2A30", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #2A2A30", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Cancelar</button>
          <button onClick={() => onSave(keys)} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #E8D5B7, #C9A96E)", color: "#1A1A1E", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════
// UI COMPONENTS
// ═══════════════════════════
function TypingIndicator({ color }) {
  return <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: color, opacity: 0.6, animation: `typingBounce 1.2s ease-in-out ${i*0.15}s infinite` }} />)}</div>;
}

function ProviderBadge({ provider, small }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: small?4:6, background: provider.color+"18", color: provider.accent, padding: small?"2px 8px":"3px 10px", borderRadius: 20, fontSize: small?10:11, fontWeight: 600, border: `1px solid ${provider.color}30` }}><span style={{ fontSize: small?10:12 }}>{provider.icon}</span>{provider.name}</span>;
}

function MessageBubble({ msg, isUser }) {
  const provider = PROVIDERS.find(p => p.id === msg.providerId);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser?"flex-end":"flex-start", gap: 4, animation: "fadeSlideIn 0.3s ease-out" }}>
      {!isUser && provider && <ProviderBadge provider={provider} small />}
      <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: isUser?"18px 18px 4px 18px":"18px 18px 18px 4px", background: isUser?"linear-gradient(135deg, #E8D5B7, #D4B896)":"#1E1E22", color: isUser?"#1A1A1E":"#E8E6E3", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", border: isUser?"none":"1px solid #2A2A30" }}>{msg.content}</div>
      <span style={{ fontSize: 10, color: "#555", padding: "0 4px" }}>{msg.time}</span>
    </div>
  );
}

function ChatListItem({ chat, prov, isAct, onClick, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 8px", borderRadius: 10, background: isAct?prov.color+"12":"transparent", cursor: "pointer", border: isAct?`1px solid ${prov.color}25`:"1px solid transparent" }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: chat.broadcastMode?"#E8D5B715":prov.color+"20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: chat.broadcastMode?"#C9A96E":prov.accent, flexShrink: 0 }}>{chat.broadcastMode?"📡":prov.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input value={title} onChange={e => setTitle(e.target.value)} autoFocus onClick={e => e.stopPropagation()}
            onKeyDown={e => { if (e.key==="Enter"){onRename(title);setEditing(false);} if (e.key==="Escape")setEditing(false); }}
            onBlur={() => {onRename(title);setEditing(false);}}
            style={{ width: "100%", padding: "2px 4px", borderRadius: 4, border: "1px solid #C9A96E50", background: "#131316", color: "#E8E6E3", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
        ) : (
          <div onDoubleClick={e => {e.stopPropagation();setEditing(true);}} style={{ fontSize: 12, fontWeight: isAct?600:500, color: isAct?"#F0EDE8":"#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chat.title}</div>
        )}
        <div style={{ fontSize: 10, color: "#4A4A4A", marginTop: 1 }}>{chat.messages.length} msg · {chat.updatedAt}</div>
      </div>
      <button onClick={e => {e.stopPropagation();onDelete();}} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 13, padding: "2px 4px", opacity: 0, transition: "opacity 0.2s" }}
        onMouseEnter={e => e.target.style.opacity=1} onMouseLeave={e => e.target.style.opacity=0}>×</button>
    </div>
  );
}

// ═══════════════════════════
// MAIN CHAT APP
// ═══════════════════════════
function ChatApp({ username, onLogout }) {
  const [chatList, setChatList] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeProvider, setActiveProvider] = useState("claude");
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState({});
  const [sidebarTab, setSidebarTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiKeys, setApiKeys] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const saveTimer = useRef(null);

  const chatsKey = `chats:${username}`;
  const keysKey = `apikeys:${username}`;

  useEffect(() => {
    const saved = storageGet(chatsKey);
    const keys = storageGet(keysKey);
    if (saved?.length) { setChatList(saved); setActiveChatId(saved[0].id); }
    if (keys) setApiKeys(keys);
  }, []);

  const saveChatList = useCallback((list) => { clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => storageSet(chatsKey, list), 300); }, [chatsKey]);
  useEffect(() => { saveChatList(chatList); }, [chatList, saveChatList]);

  const saveApiKeys = (keys) => { setApiKeys(keys); storageSet(keysKey, keys); setShowSettings(false); };

  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, []);
  const activeChat = chatList.find(c => c.id === activeChatId);
  const displayMessages = activeChat?.messages || [];
  useEffect(scrollToBottom, [displayMessages.length, loading, scrollToBottom]);

  const filteredChats = searchQuery.trim() ? chatList.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())) : chatList;
  const isConnected = (pid) => !!apiKeys[pid];
  const connectedCount = PROVIDERS.filter(p => isConnected(p.id)).length;
  const ap = PROVIDERS.find(p => p.id === activeProvider);

  const createNewChat = (provOverride) => {
    const pid = provOverride || activeProvider;
    const nc = { id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), title: "Novo chat", providerId: pid, broadcastMode, messages: [], createdAt: dateNow(), updatedAt: dateNow() };
    setChatList(prev => [nc,...prev]); setActiveChatId(nc.id); setActiveProvider(pid); setSidebarTab("chats");
    setTimeout(() => inputRef.current?.focus(), 100);
    return nc.id;
  };

  const deleteChat = (cid) => { setChatList(prev => { const f = prev.filter(c => c.id !== cid); if (activeChatId === cid) setActiveChatId(f[0]?.id||null); return f; }); };
  const renameChat = (cid, t) => { if (!t.trim()) return; setChatList(prev => prev.map(c => c.id===cid?{...c,title:t.trim()}:c)); };

  const sendMessage = async () => {
    const text = input.trim(); if (!text) return;
    setInput(""); if (inputRef.current) inputRef.current.style.height = "auto";
    let chatId = activeChatId; if (!chatId) chatId = createNewChat();

    const userMsg = { role: "user", content: text, time: timeNow(), providerId: null };
    const chat = chatList.find(c => c.id === chatId);
    const autoTitle = chat?.messages.length === 0 ? text.slice(0,50)+(text.length>50?"...":"") : null;
    setChatList(prev => prev.map(c => c.id!==chatId?c:{...c, messages:[...c.messages,userMsg], updatedAt:dateNow(), title:autoTitle||c.title}));

    const isBroadcast = broadcastMode || chat?.broadcastMode;
    if (isBroadcast) {
      const nl = {}; PROVIDERS.forEach(p => nl[p.id]=true); setLoading(nl);
      setChatList(prev => prev.map(c => c.id===chatId?{...c,broadcastMode:true}:c));
      PROVIDERS.forEach(async (provider) => {
        try {
          const hist = [...(chat?.messages||[]).filter(m => m.role==="user"||m.providerId===provider.id), userMsg];
          const reply = await getResponse(provider.id, hist, text, apiKeys);
          setChatList(prev => prev.map(c => c.id===chatId?{...c, messages:[...c.messages,{role:"assistant",content:reply,time:timeNow(),providerId:provider.id}], updatedAt:dateNow()}:c));
        } catch(err) {
          setChatList(prev => prev.map(c => c.id===chatId?{...c, messages:[...c.messages,{role:"assistant",content:`[${provider.name}] ${err.message}`,time:timeNow(),providerId:provider.id}]}:c));
        } finally { setLoading(prev => ({...prev,[provider.id]:false})); }
      });
    } else {
      setLoading({[activeProvider]:true});
      try {
        const hist = [...(chat?.messages||[]), userMsg];
        const reply = await getResponse(activeProvider, hist, text, apiKeys);
        setChatList(prev => prev.map(c => c.id===chatId?{...c, messages:[...c.messages,{role:"assistant",content:reply,time:timeNow(),providerId:activeProvider}], updatedAt:dateNow(), providerId:activeProvider}:c));
      } catch(err) {
        setChatList(prev => prev.map(c => c.id===chatId?{...c, messages:[...c.messages,{role:"assistant",content:`Erro: ${err.message}`,time:timeNow(),providerId:activeProvider}]}:c));
      } finally { setLoading({}); }
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: "#131316", color: "#E8E6E3", overflow: "hidden" }}>
      {showSettings && <ApiSettingsModal apiKeys={apiKeys} onSave={saveApiKeys} onClose={() => setShowSettings(false)} />}

      {/* SIDEBAR */}
      <div style={{ width: 280, minWidth: 280, background: "#18181C", borderRight: "1px solid #2A2A30", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid #2A2A30" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #E8D5B7, #C9A96E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#1A1A1E" }}>⚡</div>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: "#F0EDE8" }}>ChatHub</div><div style={{ fontSize: 10, color: "#666" }}>@{username}</div></div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setShowSettings(true)} title="APIs" style={{ background: "none", border: "1px solid #2A2A30", color: "#888", cursor: "pointer", padding: "4px 8px", borderRadius: 6, fontSize: 13, position: "relative" }}>⚙️{connectedCount>0&&<span style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: "#10A37F", color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{connectedCount}</span>}</button>
              <button onClick={onLogout} style={{ background: "none", border: "1px solid #2A2A30", color: "#666", cursor: "pointer", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: "inherit" }}>Sair</button>
            </div>
          </div>
        </div>
        <div style={{ padding: "10px 10px 2px" }}>
          <button onClick={() => createNewChat()} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px dashed #3A3A42", background: "transparent", color: "#C9A96E", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 17, lineHeight: 1 }}>+</span> Novo Chat</button>
        </div>
        <div style={{ display: "flex", padding: "8px 10px 0", gap: 4 }}>
          {[{id:"chats",label:"💬 Meus Chats"},{id:"providers",label:"🤖 Modelos"}].map(t => (
            <button key={t.id} onClick={() => setSidebarTab(t.id)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: sidebarTab===t.id?"#2A2A30":"transparent", color: sidebarTab===t.id?"#E8E6E3":"#666", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>{t.label}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }}>
          {sidebarTab==="chats" ? (<>
            <div style={{ padding: "6px 0 4px" }}><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar chats..." style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #2A2A30", background: "#131316", color: "#E8E6E3", fontSize: 12, fontFamily: "inherit", outline: "none" }} /></div>
            {filteredChats.length===0 ? <div style={{ textAlign: "center", padding: "36px 10px", color: "#555", fontSize: 12, lineHeight: 1.7 }}>{searchQuery?"Nenhum chat encontrado.":"Nenhum chat ainda."}</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>{filteredChats.map(chat => { const prov = PROVIDERS.find(p => p.id===chat.providerId)||PROVIDERS[0]; return <ChatListItem key={chat.id} chat={chat} prov={prov} isAct={activeChatId===chat.id} onClick={() => {setActiveChatId(chat.id);setActiveProvider(chat.providerId||"claude");setBroadcastMode(!!chat.broadcastMode);}} onDelete={() => deleteChat(chat.id)} onRename={t => renameChat(chat.id,t)} />; })}</div>}
          </>) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
              <button onClick={() => setBroadcastMode(!broadcastMode)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px", borderRadius: 10, border: broadcastMode?"1px solid #E8D5B730":"1px solid transparent", background: broadcastMode?"#E8D5B710":"transparent", color: broadcastMode?"#E8D5B7":"#888", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", width: "100%", textAlign: "left" }}><span>📡</span> Broadcast<span style={{ marginLeft: "auto", fontSize: 9, padding: "2px 7px", borderRadius: 10, background: broadcastMode?"#E8D5B730":"#2A2A30", color: broadcastMode?"#E8D5B7":"#666" }}>{broadcastMode?"ON":"OFF"}</span></button>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", padding: "10px 4px 6px" }}>Selecionar Modelo</div>
              {PROVIDERS.map(pr => { const isA = !broadcastMode&&activeProvider===pr.id; const conn = isConnected(pr.id); return (
                <button key={pr.id} onClick={() => {if(!broadcastMode)setActiveProvider(pr.id);}} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, border: "none", background: isA?pr.color+"15":"transparent", cursor: broadcastMode?"default":"pointer", opacity: broadcastMode?0.4:1, fontFamily: "inherit", width: "100%", textAlign: "left" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: isA?pr.color+"25":"#222228", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: isA?pr.accent:"#666", border: `1px solid ${isA?pr.color+"40":"#2A2A30"}` }}>{pr.icon}</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: isA?600:500, color: isA?"#F0EDE8":"#999", display: "flex", alignItems: "center", gap: 6 }}>{pr.name}<span style={{ width: 5, height: 5, borderRadius: "50%", background: conn?"#1ED99C":"#555" }} /></div><div style={{ fontSize: 10, color: "#555" }}>{pr.tagline}{conn?"":" · sem key"}</div></div>
                </button>); })}
              <button onClick={() => setShowSettings(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px", borderRadius: 10, border: "1px dashed #3A3A42", background: "transparent", color: "#888", cursor: "pointer", fontSize: 11, fontFamily: "inherit", width: "100%", textAlign: "left", marginTop: 4 }}>⚙️ Configurar API Keys</button>
            </div>
          )}
        </div>
        <div style={{ padding: "8px 12px", borderTop: "1px solid #2A2A30", fontSize: 10, color: "#444" }}>{connectedCount}/{PROVIDERS.length} conectados</div>
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "11px 20px", borderBottom: "1px solid #2A2A30", display: "flex", alignItems: "center", gap: 12, background: "#18181C" }}>
          {broadcastMode ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 16 }}>📡</span><div><div style={{ fontSize: 14, fontWeight: 600 }}>Broadcast</div><div style={{ fontSize: 11, color: "#777" }}>{connectedCount} conectados</div></div></div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: ap.color+"20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: ap.accent, border: `1px solid ${ap.color}30` }}>{ap.icon}</div>
              <div><div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>{ap.name}<span style={{ width: 6, height: 6, borderRadius: "50%", background: isConnected(ap.id)?"#1ED99C":"#666" }} /></div><div style={{ fontSize: 11, color: "#777" }}>{ap.tagline} · {ap.model}</div></div>
            </div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {!isConnected(activeProvider)&&!broadcastMode&&<button onClick={() => setShowSettings(true)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${ap.color}40`, background: ap.color+"10", color: ap.accent, cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "inherit" }}>🔑 Conectar</button>}
            {activeChat&&<button onClick={() => deleteChat(activeChatId)} style={{ background: "none", border: "1px solid #2A2A30", color: "#888", cursor: "pointer", padding: "5px 10px", borderRadius: 8, fontSize: 11 }}>🗑</button>}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {!activeChat ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, opacity: 0.4 }}>
              <div style={{ fontSize: 48 }}>⚡</div><div style={{ fontSize: 20, fontWeight: 600 }}>ChatHub</div>
              <div style={{ fontSize: 13, color: "#777", textAlign: "center", maxWidth: 340, lineHeight: 1.6 }}>Crie um novo chat ou selecione um existente.</div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => createNewChat()} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #E8D5B7, #C9A96E)", color: "#1A1A1E", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Novo Chat</button>
                <button onClick={() => setShowSettings(true)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #2A2A30", background: "transparent", color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>⚙️ APIs</button>
              </div>
            </div>
          ) : displayMessages.length===0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, opacity: 0.4 }}>
              <div style={{ fontSize: 42 }}>{broadcastMode?"📡":ap.icon}</div><div style={{ fontSize: 16, fontWeight: 600 }}>{broadcastMode?"Broadcast":ap.name}</div>
              <div style={{ fontSize: 12, color: "#777" }}>{broadcastMode?"Envie para todos.":"Envie sua primeira mensagem."}</div>
            </div>
          ) : displayMessages.map((msg, i) => <MessageBubble key={i} msg={msg} isUser={msg.role==="user"} />)}

          {Object.entries(loading).filter(([,v]) => v).map(([id]) => { const p = PROVIDERS.find(pr => pr.id===id); if (!p) return null; return (
            <div key={id+"-t"} style={{ display: "flex", flexDirection: "column", gap: 4, animation: "fadeSlideIn 0.3s ease-out" }}>
              <ProviderBadge provider={p} small />
              <div style={{ padding: "14px 18px", borderRadius: "18px 18px 18px 4px", background: "#1E1E22", border: "1px solid #2A2A30", display: "inline-flex", alignSelf: "flex-start" }}><TypingIndicator color={p.accent} /></div>
            </div>); })}
          <div ref={messagesEndRef} />
        </div>

        {activeChat && (
          <div style={{ padding: "10px 20px 16px", borderTop: "1px solid #2A2A30", background: "#18181C" }}>
            {!broadcastMode && <div style={{ display: "flex", gap: 4, marginBottom: 8, overflowX: "auto" }}>
              {PROVIDERS.map(p => <button key={p.id} onClick={() => setActiveProvider(p.id)} style={{ padding: "4px 10px", borderRadius: 20, border: activeProvider===p.id?`1px solid ${p.color}50`:"1px solid #2A2A30", background: activeProvider===p.id?p.color+"15":"transparent", color: activeProvider===p.id?p.accent:"#555", cursor: "pointer", fontSize: 10, fontWeight: 500, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}><span style={{ fontSize: 9 }}>{p.icon}</span>{p.name}<span style={{ width: 4, height: 4, borderRadius: "50%", background: isConnected(p.id)?"#1ED99C":"#555" }} /></button>)}
            </div>}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1, background: "#1E1E22", borderRadius: 14, border: "1px solid #2A2A30", display: "flex", alignItems: "flex-end", padding: "4px 4px 4px 16px" }}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
                  placeholder={broadcastMode?"Enviar para todos...":`Mensagem para ${ap.name}...`} rows={1}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#E8E6E3", fontSize: 14, fontFamily: "inherit", resize: "none", padding: "8px 0", maxHeight: 120, lineHeight: 1.5 }}
                  onInput={e => {e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}} />
                <button onClick={sendMessage} disabled={!input.trim()||Object.values(loading).some(Boolean)}
                  style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: input.trim()&&!Object.values(loading).some(Boolean)?(broadcastMode?"linear-gradient(135deg, #E8D5B7, #C9A96E)":`linear-gradient(135deg, ${ap.color}, ${ap.accent})`):"#2A2A30", color: input.trim()&&!Object.values(loading).some(Boolean)?"#1A1A1E":"#555", cursor: input.trim()&&!Object.values(loading).some(Boolean)?"pointer":"not-allowed", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: "#444", marginTop: 6 }}>Enter enviar · Shift+Enter nova linha</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════
// ROOT
// ═══════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => { const s = storageGet("session:current"); if (s?.username) setUser(s.username); setChecking(false); }, []);

  if (checking) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#131316" }}><div style={{ textAlign: "center", color: "#888" }}><div style={{ fontSize: 36, marginBottom: 12, animation: "float 2s ease-in-out infinite" }}>⚡</div>Carregando...</div></div>;
  if (!user) return <AuthScreen onLogin={u => { storageSet("session:current", { username: u }); setUser(u); }} />;
  return <ChatApp username={user} onLogout={() => { storageDelete("session:current"); setUser(null); }} />;
}
