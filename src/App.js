import { useState, useEffect, useRef } from "react";

const API_KEY = "YOUR_API_KEY_HERE";
const LOGIN_USERNAME = "Tana training";
const LOGIN_PASSWORD = "Tanatraining@2026";

const SYSTEM_PROMPT = `You are a dedicated networking tutor for the Google course "Bits and Bytes of Computer Networking."

Always greet the student by their chosen name. Be encouraging, patient, and clear. If they struggle, try a different analogy.

STRICT SCOPE: Only teach topics from these 6 modules. If asked about anything outside (BGP internals, OSPF config, VLANs, SDN), acknowledge briefly and redirect.

MODULE 1 — Introduction to Networking: 5-layer model (Physical, Data Link, Network, Transport, Application), encapsulation, network devices (hub/switch/router), cable types.

MODULE 2 — The Network Layer: IP addressing, binary conversion, IP classes (A/B/C), private vs public ranges, CIDR notation (/8 /16 /24), subnetting, routing tables, default gateway.

MODULE 3 — Transport & Application Layers: TCP three-way handshake (SYN/SYN-ACK/ACK), TCP vs UDP, common ports (80/443/22/53/25), TCP flags, socket states, firewalls.

MODULE 4 — Networking Services: DNS resolution (cache→resolver→root→TLD→authoritative), DNS record types (A/AAAA/MX/CNAME), DHCP DORA, NAT, VPN concept.

MODULE 5 — Connecting to the Internet: 2.4GHz vs 5GHz, wireless standards (802.11n/ac/ax), WAN types (DSL/cable/fibre/cellular), broadband.

MODULE 6 — Troubleshooting: Bottom-up OSI methodology, ping/traceroute/nslookup/ipconfig commands, APIPA (169.254.x.x), interpreting outputs.

TONE: Encouraging, clear, never make them feel bad for wrong answers. Always explain why the correct answer is right. Be concise. When giving a quiz, number the questions clearly. When someone completes a quiz with a score, include the phrase "Score: X/Y" in your response.`;

const MODULES = [
  { id: 1, title: "Intro to Networking", icon: "M1", color: "#6366f1", bg: "#eef2ff", desc: "Layers, devices & cables" },
  { id: 2, title: "Network Layer", icon: "M2", color: "#0ea5e9", bg: "#e0f2fe", desc: "IP addressing & routing" },
  { id: 3, title: "Transport Layer", icon: "M3", color: "#10b981", bg: "#ecfdf5", desc: "TCP, UDP & ports" },
  { id: 4, title: "Networking Services", icon: "M4", color: "#f59e0b", bg: "#fffbeb", desc: "DNS, DHCP & NAT" },
  { id: 5, title: "Connecting to Internet", icon: "M5", color: "#ec4899", bg: "#fdf2f8", desc: "WiFi & WAN types" },
  { id: 6, title: "Troubleshooting", icon: "M6", color: "#ef4444", bg: "#fef2f2", desc: "Diagnose & fix issues" },
];

const QUICK_ACTIONS = [
  { label: "Explain this module", prompt: (m) => `Give me a clear overview of Module ${m}: what I'll learn and why it matters.` },
  { label: "Visual walkthrough", prompt: (m) => `Walk me through the key concepts in Module ${m} with visual examples and analogies.` },
  { label: "Quiz me (3 questions)", prompt: (m) => `Give me a 3-question quiz on Module ${m}. Wait for my answers before revealing which are correct.` },
  { label: "Real-world scenarios", prompt: (m) => `Give me 2 real-world scenarios from Module ${m} that a network engineer would face.` },
];

const VISUALIZATIONS = {
  1: {
    title: "5-Layer Network Model",
    layers: [
      { n: 5, name: "Application", color: "#6366f1", proto: "HTTP, DNS, SMTP", ex: "Your browser" },
      { n: 4, name: "Transport", color: "#8b5cf6", proto: "TCP, UDP", ex: "Port numbers" },
      { n: 3, name: "Network", color: "#0ea5e9", proto: "IP, ICMP", ex: "Routers" },
      { n: 2, name: "Data Link", color: "#10b981", proto: "Ethernet, WiFi", ex: "Switches, MACs" },
      { n: 1, name: "Physical", color: "#f59e0b", proto: "Bits, signals", ex: "Cables, NICs" },
    ]
  },
  2: {
    title: "IP Address Classes",
    classes: [
      { cls: "A", range: "1–126.x.x.x", hosts: "16M hosts", color: "#6366f1" },
      { cls: "B", range: "128–191.x.x.x", hosts: "65K hosts", color: "#0ea5e9" },
      { cls: "C", range: "192–223.x.x.x", hosts: "254 hosts", color: "#10b981" },
      { cls: "Private", range: "10.x / 172.16–31.x / 192.168.x", hosts: "Internal only", color: "#f59e0b" },
    ]
  },
  3: {
    title: "TCP Three-Way Handshake",
    steps: [
      { from: "Client", to: "Server", msg: "SYN", color: "#6366f1", desc: "I want to connect" },
      { from: "Server", to: "Client", msg: "SYN-ACK", color: "#10b981", desc: "OK, I'm ready" },
      { from: "Client", to: "Server", msg: "ACK", color: "#0ea5e9", desc: "Connection established!" },
    ]
  },
  4: {
    title: "DNS Resolution Steps",
    steps: [
      { step: 1, name: "Local Cache", color: "#6366f1", desc: "Check browser/OS cache first" },
      { step: 2, name: "Resolver", color: "#0ea5e9", desc: "Ask ISP's resolver" },
      { step: 3, name: "Root Server", color: "#10b981", desc: "Who handles .com?" },
      { step: 4, name: "TLD Server", color: "#f59e0b", desc: "Who handles google.com?" },
      { step: 5, name: "Authoritative", color: "#ec4899", desc: "Here's the IP!" },
    ]
  },
  5: {
    title: "2.4GHz vs 5GHz WiFi",
    comparison: [
      { label: "Range", val24: "★★★★★", val5: "★★★" },
      { label: "Speed", val24: "★★★", val5: "★★★★★" },
      { label: "Congestion", val24: "High", val5: "Low" },
      { label: "Wall penetration", val24: "Better", val5: "Weaker" },
      { label: "Standard", val24: "802.11n", val5: "802.11ac/ax" },
    ]
  },
  6: {
    title: "Troubleshooting Bottom-Up",
    layers: [
      { n: 1, name: "Physical", check: "Is the cable plugged in? Light blinking?", color: "#f59e0b" },
      { n: 2, name: "Data Link", check: "Run: ipconfig /all — is there a MAC?", color: "#10b981" },
      { n: 3, name: "Network", check: "Ping default gateway — can you reach router?", color: "#0ea5e9" },
      { n: 4, name: "Transport", check: "Is the right port open? Firewall blocking?", color: "#8b5cf6" },
      { n: 5, name: "Application", check: "Can you ping 8.8.8.8 but not open websites?", color: "#6366f1" },
    ]
  }
};

function LayerModel({ data }) {
  const [active, setActive] = useState(null);
  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: "#64748b", marginBottom: 10 }}>{data.title}</div>
      {data.layers.map((l, i) => (
        <div key={i} onClick={() => setActive(active === i ? null : i)}
          style={{ marginBottom: 6, borderRadius: 10, overflow: "hidden", cursor: "pointer",
            border: `1px solid ${active === i ? l.color : "rgba(0,0,0,0.06)"}`, transition: "all 0.2s",
            transform: active === i ? "scale(1.01)" : "scale(1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
            background: active === i ? l.color : "rgba(255,255,255,0.7)" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: active === i ? "rgba(255,255,255,0.3)" : l.color,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 }}>{l.n}</div>
            <span style={{ fontWeight: 600, fontSize: 13, color: active === i ? "#fff" : "#1e293b" }}>{l.name}</span>
            <span style={{ fontSize: 11, color: active === i ? "rgba(255,255,255,0.8)" : "#64748b", marginLeft: "auto" }}>{l.proto}</span>
          </div>
          {active === i && <div style={{ padding: "8px 12px", background: `${l.color}15`, fontSize: 12, color: "#334155" }}>Example: {l.ex}</div>}
        </div>
      ))}
    </div>
  );
}

function HandshakeViz({ data }) {
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const run = () => { setStep(-1); setRunning(true); };
  useEffect(() => {
    if (!running) return;
    if (step < data.steps.length - 1) { const t = setTimeout(() => setStep(s => s + 1), 700); return () => clearTimeout(t); }
    else setRunning(false);
  }, [running, step]);
  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: "#64748b", marginBottom: 10 }}>{data.title}</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        {["Client", "Server"].map(n => (
          <div key={n} style={{ width: 80, textAlign: "center", padding: "8px 0", borderRadius: 10,
            background: n === "Client" ? "#eef2ff" : "#ecfdf5", border: `1px solid ${n === "Client" ? "#a5b4fc" : "#6ee7b7"}`,
            fontWeight: 600, fontSize: 12, color: n === "Client" ? "#4338ca" : "#065f46" }}>{n}</div>
        ))}
      </div>
      {data.steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
          opacity: step >= i ? 1 : 0.2, transition: "all 0.4s" }}>
          <div style={{ width: 80 }} />
          <div style={{ flex: 1, height: 2, background: s.color, position: "relative" }}>
            {s.from === "Client"
              ? <div style={{ position: "absolute", right: -6, top: -4, fontSize: 10, color: s.color }}>▶</div>
              : <div style={{ position: "absolute", left: -6, top: -4, fontSize: 10, color: s.color }}>◀</div>}
            <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
              background: s.color, color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{s.msg}</div>
          </div>
          <div style={{ width: 80 }} />
        </div>
      ))}
      {step >= 0 && step < data.steps.length && (
        <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 8, background: `${data.steps[step].color}15`,
          border: `1px solid ${data.steps[step].color}40`, fontSize: 12, color: "#334155" }}>{data.steps[step].desc}</div>
      )}
      <button onClick={run} style={{ marginTop: 12, padding: "6px 16px", borderRadius: 8, border: "none",
        background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
        {running ? "Running..." : step >= 0 ? "Replay" : "Animate"}
      </button>
    </div>
  );
}

function DNSViz({ data }) {
  const [active, setActive] = useState(null);
  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: "#64748b", marginBottom: 10 }}>{data.title}</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {data.steps.map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 60 }}>
            <div onClick={() => setActive(active === i ? null : i)}
              style={{ width: "100%", padding: "8px 4px", borderRadius: 8, textAlign: "center", cursor: "pointer",
                background: active === i ? s.color : `${s.color}20`, border: `1px solid ${active === i ? s.color : `${s.color}40`}`, transition: "all 0.2s" }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: active === i ? "#fff" : s.color }}>{s.step}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: active === i ? "#fff" : "#1e293b", marginTop: 2 }}>{s.name}</div>
            </div>
          </div>
        ))}
      </div>
      {active !== null && (
        <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8,
          background: `${data.steps[active].color}15`, border: `1px solid ${data.steps[active].color}40`,
          fontSize: 12, color: "#334155" }}>{data.steps[active].desc}</div>
      )}
    </div>
  );
}

function ComparisonViz({ data }) {
  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: "#64748b", marginBottom: 10 }}>{data.title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
        {["Feature", "2.4 GHz", "5 GHz"].map((h, i) => (
          <div key={i} style={{ padding: "8px 10px", fontWeight: 700, fontSize: 11, textAlign: "center",
            background: i === 0 ? "#f8fafc" : i === 1 ? "#eff6ff" : "#ecfdf5",
            color: i === 0 ? "#64748b" : i === 1 ? "#1d4ed8" : "#065f46" }}>{h}</div>
        ))}
        {data.comparison.map((row, i) => (
          <>
            <div key={`a${i}`} style={{ padding: "7px 10px", fontSize: 11, fontWeight: 600, color: "#475569", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>{row.label}</div>
            <div key={`b${i}`} style={{ padding: "7px 10px", fontSize: 11, textAlign: "center", color: "#1d4ed8", background: i % 2 === 0 ? "#f0f9ff" : "#e0f2fe" }}>{row.val24}</div>
            <div key={`c${i}`} style={{ padding: "7px 10px", fontSize: 11, textAlign: "center", color: "#065f46", background: i % 2 === 0 ? "#f0fdf4" : "#dcfce7" }}>{row.val5}</div>
          </>
        ))}
      </div>
    </div>
  );
}

function TroubleshootViz({ data }) {
  const [current, setCurrent] = useState(0);
  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: "#64748b", marginBottom: 10 }}>{data.title}</div>
      {data.layers.map((l, i) => (
        <div key={i} onClick={() => setCurrent(i)}
          style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6, cursor: "pointer",
            padding: "8px 12px", borderRadius: 10, transition: "all 0.2s",
            background: current === i ? `${l.color}18` : "transparent",
            border: `1px solid ${current === i ? l.color : "transparent"}` }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: l.color, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, flexShrink: 0 }}>{l.n}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12, color: "#1e293b" }}>{l.name}</div>
            {current === i && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{l.check}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function IPClassViz({ data }) {
  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: "#64748b", marginBottom: 10 }}>{data.title}</div>
      {data.classes.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, padding: "8px 12px",
          borderRadius: 10, background: `${c.color}12`, border: `1px solid ${c.color}40` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{c.cls}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b" }}>{c.range}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{c.hosts}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModuleViz({ moduleId }) {
  const data = VISUALIZATIONS[moduleId];
  if (!data) return null;
  if (moduleId === 1) return <LayerModel data={data} />;
  if (moduleId === 2) return <IPClassViz data={data} />;
  if (moduleId === 3) return <HandshakeViz data={data} />;
  if (moduleId === 4) return <DNSViz data={data} />;
  if (moduleId === 5) return <ComparisonViz data={data} />;
  if (moduleId === 6) return <TroubleshootViz data={data} />;
}

function PacketFlow() {
  const [pos, setPos] = useState(0);
  useEffect(() => { const t = setInterval(() => setPos(p => (p + 1) % 100), 40); return () => clearInterval(t); }, []);
  const nodes = [
    { x: 10, label: "PC", color: "#6366f1" },
    { x: 32, label: "Switch", color: "#0ea5e9" },
    { x: 54, label: "Router", color: "#10b981" },
    { x: 76, label: "Server", color: "#f59e0b" },
  ];
  return (
    <div style={{ position: "relative", height: 64, marginBottom: 8 }}>
      <svg width="100%" height="64" style={{ position: "absolute", top: 0, left: 0 }}>
        <line x1="10%" y1="32" x2="86%" y2="32" stroke="#e2e8f0" strokeWidth="2" />
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={`${n.x}%`} cy="32" r="16" fill={n.color} opacity="0.12" />
            <circle cx={`${n.x}%`} cy="32" r="10" fill={n.color} />
            <text x={`${n.x}%`} y="58" textAnchor="middle" fontSize="9" fill="#94a3b8">{n.label}</text>
          </g>
        ))}
        <circle cx={`${10 + (pos / 100) * 76}%`} cy="32" r="5" fill="#fff" stroke="#6366f1" strokeWidth="2" />
      </svg>
    </div>
  );
}

// ── LOGIN SCREEN ──
function LoginScreen({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (u === LOGIN_USERNAME && p === LOGIN_PASSWORD) {
      onLogin();
    } else {
      setErr("Incorrect username or password. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {MODULES.map((m, i) => (
            <div key={i} style={{ width: 34, height: 34, borderRadius: 9, background: m.color, opacity: 0.85,
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 10 }}>{m.icon}</div>
          ))}
        </div>
        <h1 style={{ color: "#f1f5f9", fontSize: "1.7rem", fontWeight: 800, margin: "0 0 6px" }}>Networking Learning Hub</h1>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: 28 }}>Google Course · Bits and Bytes of Computer Networking</p>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18,
          padding: 28, animation: shake ? "shake 0.4s" : "none" }}>
          <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>Sign in to access your learning hub</div>

          <div style={{ marginBottom: 14, textAlign: "left" }}>
            <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>Username</label>
            <input value={u} onChange={e => { setU(e.target.value); setErr(""); }}
              onKeyDown={e => e.key === "Enter" && attempt()}
              placeholder="Enter username"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${err ? "#ef4444" : "rgba(255,255,255,0.15)"}`,
                background: "rgba(255,255,255,0.07)", color: "#e2e8f0", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
              autoFocus />
          </div>

          <div style={{ marginBottom: 18, textAlign: "left" }}>
            <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>Password</label>
            <input type="password" value={p} onChange={e => { setP(e.target.value); setErr(""); }}
              onKeyDown={e => e.key === "Enter" && attempt()}
              placeholder="Enter password"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${err ? "#ef4444" : "rgba(255,255,255,0.15)"}`,
                background: "rgba(255,255,255,0.07)", color: "#e2e8f0", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }} />
          </div>

          {err && <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8,
            padding: "8px 12px", color: "#fca5a5", fontSize: 13, marginBottom: 14 }}>{err}</div>}

          <button onClick={attempt}
            style={{ width: "100%", padding: 13, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", fontWeight: 700, fontSize: "1rem", border: "none", cursor: "pointer" }}>
            Sign In →
          </button>
        </div>

        <p style={{ color: "#334155", fontSize: "0.72rem", marginTop: 16 }}>
          Shared access for Tana Training students
        </p>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }`}</style>
    </div>
  );
}

// ── MAIN APP ──
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState("name");
  const [name, setName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [activeModule, setActiveModule] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({});
  const [showViz, setShowViz] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  const callClaude = async (msgs) => {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: SYSTEM_PROMPT, messages: msgs }),
      });
      const data = await res.json();
      if (data.error) return `Error: ${data.error.message}`;
      return data.content?.[0]?.text || "No response.";
    } catch { return "Connection error. Please try again."; }
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setLoading(true);
    const reply = await callClaude(next);
    const updated = [...next, { role: "assistant", content: reply }];
    setMessages(updated);
    const match = reply.match(/Score:\s*(\d+)\/(\d+)/i);
    if (match && activeModule) {
      setScores(s => ({ ...s, [activeModule]: { got: parseInt(match[1]), total: parseInt(match[2]) } }));
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const openModule = async (mod) => {
    setActiveModule(mod.id);
    setMessages([]);
    setShowViz(true);
    setScreen("module");
    setLoading(true);
    const greeting = [{ role: "user", content: `Hi, I'm ${name}. I'm starting Module ${mod.id}: ${mod.title}. Give me a warm welcome, a 2-sentence overview of what I'll learn, then ask if I want an explanation, visual walkthrough, or a quiz.` }];
    const reply = await callClaude(greeting);
    setMessages([{ role: "assistant", content: reply }]);
    setLoading(false);
  };

  const fmt = (text) => text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:0.85em;color:#0f172a">$1</code>')
    .replace(/\n/g, "<br/>");

  const mod = MODULES.find(m => m.id === activeModule);

  // NAME SCREEN
  if (screen === "name") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>👋</div>
        <h2 style={{ color: "#f1f5f9", fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>Welcome! What's your name?</h2>
        <p style={{ color: "#94a3b8", marginBottom: 28, fontSize: "0.9rem" }}>Your tutor will greet you personally and track your progress through all 6 modules</p>
        <input placeholder="Enter your first name..." value={nameInput} onChange={e => setNameInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && nameInput.trim() && (setName(nameInput.trim()), setScreen("hub"))}
          style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: "1.1rem", outline: "none",
            boxSizing: "border-box", marginBottom: 12, textAlign: "center" }} autoFocus />
        <button onClick={() => nameInput.trim() && (setName(nameInput.trim()), setScreen("hub"))}
          style={{ width: "100%", padding: 13, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", fontWeight: 700, fontSize: "1rem", border: "none", cursor: "pointer" }}>
          Enter the Hub →
        </button>
        <button onClick={() => setLoggedIn(false)} style={{ marginTop: 10, background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "0.85rem" }}>← Sign out</button>
      </div>
    </div>
  );

  // HUB
  if (screen === "hub") return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e1b4b)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ color: "#f1f5f9", fontWeight: 700 }}>Networking Learning Hub</div>
          <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Welcome, {name}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(scores).map(([k, v]) => (
            <div key={k} style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)",
              color: "#6ee7b7", borderRadius: 20, padding: "2px 10px", fontSize: "0.7rem" }}>M{k}: {v.got}/{v.total}</div>
          ))}
        </div>
        <button onClick={() => setScreen("name")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#94a3b8", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: "0.75rem" }}>Switch User</button>
        <button onClick={() => { setLoggedIn(false); setScreen("name"); setName(""); setNameInput(""); }}
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: "0.75rem" }}>Sign Out</button>
      </div>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
        <PacketFlow />
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>Choose a Module, {name}</h2>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: 20 }}>Click any module to start learning with your AI tutor</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {MODULES.map(m => (
            <div key={m.id} onClick={() => openModule(m)}
              style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", cursor: "pointer",
                border: `1px solid ${scores[m.id] ? m.color : "#e2e8f0"}`, transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 20px ${m.color}30`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${m.color}18`, border: `1px solid ${m.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: m.color }}>{m.icon}</div>
                {scores[m.id] && <div style={{ background: "#ecfdf5", color: "#065f46", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>✓ {scores[m.id].got}/{scores[m.id].total}</div>}
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: 4 }}>{m.title}</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{m.desc}</div>
              <div style={{ marginTop: 12, height: 3, borderRadius: 99, background: scores[m.id] ? m.color : "#e2e8f0",
                width: scores[m.id] ? `${Math.round((scores[m.id].got / scores[m.id].total) * 100)}%` : "0%", transition: "width 0.5s" }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, background: "#fff", borderRadius: 16, padding: 18, border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: 8 }}>Ask anything about the course</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && input.trim()) { setActiveModule(null); setScreen("module"); setMessages([]); send(input); }}}
              placeholder="e.g. What's the difference between TCP and UDP?"
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.9rem", outline: "none" }} />
            <button onClick={() => { if (input.trim()) { setActiveModule(null); setScreen("module"); setMessages([]); send(input); }}}
              style={{ padding: "10px 18px", borderRadius: 10, background: "#6366f1", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>Ask →</button>
          </div>
        </div>
      </div>
    </div>
  );

  // MODULE / CHAT
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: mod ? `linear-gradient(135deg, ${mod.color}e0, ${mod.color}90)` : "linear-gradient(135deg, #0f172a, #1e1b4b)",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setScreen("hub")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
          padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>← Hub</button>
        {mod && <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{mod.icon}: {mod.title}</div>}
        {scores[activeModule] && <div style={{ marginLeft: "auto", background: "rgba(255,255,255,0.25)", color: "#fff",
          borderRadius: 20, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700 }}>Score: {scores[activeModule].got}/{scores[activeModule].total}</div>}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 52px)" }}>
        {mod && (
          <div style={{ width: 200, minWidth: 200, background: "#fff", borderRight: "1px solid #e2e8f0", overflowY: "auto" }}>
            <div style={{ padding: "12px 10px" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Quick Actions</div>
              {QUICK_ACTIONS.map((a, i) => (
                <button key={i} onClick={() => send(a.prompt(activeModule))}
                  style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none",
                    background: "transparent", color: "#475569", cursor: "pointer", fontSize: "0.78rem", marginBottom: 3 }}
                  onMouseEnter={e => { e.target.style.background = mod.bg; e.target.style.color = mod.color; }}
                  onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#475569"; }}>
                  {a.label}
                </button>
              ))}
              <div style={{ marginTop: 10, borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                <div style={{ color: "#94a3b8", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Visual Aid</div>
                <button onClick={() => setShowViz(v => !v)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${mod.color}40`,
                    background: showViz ? `${mod.color}15` : "transparent", color: mod.color, fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>
                  {showViz ? "Hide Visual" : "Show Visual"}
                </button>
                {showViz && <div style={{ marginTop: 8, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", padding: 8 }}><ModuleViz moduleId={activeModule} /></div>}
              </div>
            </div>
          </div>
        )}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {messages.length === 0 && loading && <div style={{ textAlign: "center", color: "#94a3b8", marginTop: 40 }}>Loading your session...</div>}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 14 }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: mod ? mod.color : "#6366f1",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", marginRight: 8, flexShrink: 0, marginTop: 2, color: "#fff", fontWeight: 700 }}>T</div>
                )}
                <div style={{ maxWidth: "78%", padding: "11px 15px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                  background: msg.role === "user" ? (mod ? mod.color : "#6366f1") : "#fff",
                  border: msg.role === "assistant" ? "1px solid #e2e8f0" : "none",
                  color: msg.role === "user" ? "#fff" : "#1e293b", fontSize: "0.88rem", lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: fmt(msg.content) }} />
                {msg.role === "user" && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, marginLeft: 8, flexShrink: 0, marginTop: 2, color: "#475569" }}>{name[0]?.toUpperCase()}</div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: mod ? mod.color : "#6366f1",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.75rem" }}>T</div>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px 18px 18px 18px", padding: "11px 15px", display: "flex", gap: 5 }}>
                  {[0,1,2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: mod ? mod.color : "#6366f1", opacity: 0.7,
                    animation: "pulse 1.2s infinite", animationDelay: `${j * 0.2}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}}
                placeholder="Ask a question or type your quiz answer..." rows={1}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0",
                  fontSize: "0.88rem", outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                style={{ padding: "10px 18px", borderRadius: 10, border: "none",
                  background: loading || !input.trim() ? "#e2e8f0" : (mod ? mod.color : "#6366f1"),
                  color: loading || !input.trim() ? "#94a3b8" : "#fff",
                  fontWeight: 700, cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontSize: "0.88rem" }}>
                {loading ? "..." : "Send →"}
              </button>
            </div>
            <div style={{ color: "#cbd5e1", fontSize: "0.68rem", marginTop: 5 }}>Enter to send · Shift+Enter for new line</div>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}
