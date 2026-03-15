import { useState, useEffect, useRef } from "react"; // useRef kept for usePacketAnim

const LOGIN_USERNAME = "Tana training";
const LOGIN_PASSWORD = "Tanatraining@2026";

const MODULE_INFO = {
  1: {
    whatHappens: "When you click a link, your browser builds an HTTP request (Application). TCP breaks it into segments with port numbers (Transport). IP adds source & destination IPs (Network). Ethernet adds MAC addresses (Data Link). Your NIC converts everything to electrical signals or light pulses (Physical). The server reverses this process — called decapsulation.",
    realExample: "Right now, loading this page: your browser sent a GET request that was wrapped in a TCP segment → IP packet → Ethernet frame → electrical signals through your router — all in under 50ms.",
  },
  2: {
    whatHappens: "Devices on the same subnet (same /24 for example) communicate directly. To reach a different network, packets are sent to the default gateway (router). The router checks its routing table and forwards the packet toward the destination network.",
    realExample: "Your home devices (192.168.1.x) all share the same /24 subnet and talk to each other directly. When you visit Google (142.250.4.100), your router forwards the packet out to the internet — a completely different network range.",
  },
  3: {
    whatHappens: "Before any data is exchanged, TCP performs a 3-way handshake (SYN → SYN-ACK → ACK) to agree on sequence numbers and establish a reliable connection. The firewall checks the destination port — allowing known safe ports (443) and blocking dangerous ones (23, Telnet).",
    realExample: "Every HTTPS website visit triggers this exact handshake. Your browser connects to port 443 of the web server. If a company firewall blocks port 443, nobody in that office can browse secure websites.",
  },
  4: {
    whatHappens: "Before your browser can connect to google.com, it must find the IP address. It checks local cache first, then asks a DNS resolver, which queries root → TLD → authoritative servers. Meanwhile, DHCP automatically assigned your IP address when you connected to the network, and NAT on your router translates your private IP to a public one.",
    realExample: "Type 'google.com' for the first time today: 5 DNS hops happen in ~20ms to resolve it to 142.250.4.100. Tomorrow the same lookup takes 0ms — it's cached. Your router's NAT is why 10 devices at home all share one public IP address.",
  },
  5: {
    whatHappens: "Your WiFi router broadcasts two frequencies simultaneously. 5GHz carries more data (faster) but struggles through walls. 2.4GHz travels farther and penetrates walls better but has more interference. Your ISP modem bridges your home network to the wider internet via DSL, cable, fibre, or cellular.",
    realExample: "Streaming 4K video on your phone next to the router? Use 5GHz. Video calling from the bedroom two floors up? 2.4GHz is more reliable. When your neighbour's WiFi causes interference, switching your router's channel (1, 6, or 11 on 2.4GHz) fixes it.",
  },
  6: {
    whatHappens: "Always troubleshoot bottom-up: start at Physical (is there a link?) before blaming DNS. A 169.254.x.x IP means DHCP failed — the PC never got an address from the router. Ping tests Layer 3, nslookup tests Layer 5 (DNS), and traceroute shows exactly which hop in the path is slow or broken.",
    realExample: "User says 'I can't open any websites.' You run: (1) ipconfig — sees 169.254.x.x, DHCP failed. (2) Check cable — unplugged! Plug it in, DHCP runs, they get 192.168.1.45, websites load. Fixed in 30 seconds using bottom-up methodology.",
  },
};

const MODULES = [
  { id:1, title:"Intro to Networking", color:"#6366f1", bg:"#eef2ff", desc:"Layers, devices & cables" },
  { id:2, title:"Network Layer", color:"#0ea5e9", bg:"#e0f2fe", desc:"IP addressing & routing" },
  { id:3, title:"Transport Layer", color:"#10b981", bg:"#ecfdf5", desc:"TCP, UDP & ports" },
  { id:4, title:"Networking Services", color:"#f59e0b", bg:"#fffbeb", desc:"DNS, DHCP & NAT" },
  { id:5, title:"Connect to Internet", color:"#ec4899", bg:"#fdf2f8", desc:"WiFi & WAN types" },
  { id:6, title:"Troubleshooting", color:"#ef4444", bg:"#fef2f2", desc:"Diagnose & fix issues" },
];

const lerp = (a,b,t) => a+(b-a)*t;

function DeviceIcon({ type, size=48, color="#475569" }) {
  if (type==="pc") return <svg width={size} height={size} viewBox="0 0 48 48"><rect x="4" y="6" width="40" height="28" rx="3" fill={color} opacity="0.18" stroke={color} strokeWidth="2"/><rect x="8" y="10" width="32" height="20" rx="1" fill={color} opacity="0.35"/><rect x="18" y="34" width="12" height="5" fill={color} opacity="0.25"/><rect x="12" y="39" width="24" height="3" rx="1.5" fill={color} opacity="0.5"/></svg>;
  if (type==="laptop") return <svg width={size} height={size} viewBox="0 0 48 48"><rect x="6" y="8" width="36" height="24" rx="2" fill={color} opacity="0.18" stroke={color} strokeWidth="2"/><rect x="10" y="12" width="28" height="16" rx="1" fill={color} opacity="0.3"/><path d="M2 32 Q6 38 24 38 Q42 38 46 32 Z" fill={color} opacity="0.35" stroke={color} strokeWidth="1"/></svg>;
  if (type==="phone") return <svg width={size*0.65} height={size} viewBox="0 0 32 48"><rect x="2" y="2" width="28" height="44" rx="5" fill={color} opacity="0.18" stroke={color} strokeWidth="2"/><rect x="6" y="8" width="20" height="26" rx="1" fill={color} opacity="0.3"/><circle cx="16" cy="41" r="3" fill={color} opacity="0.5"/></svg>;
  if (type==="switch") return <svg width={size*1.2} height={size*0.7} viewBox="0 0 58 34"><rect x="2" y="6" width="54" height="22" rx="4" fill={color} opacity="0.18" stroke={color} strokeWidth="2"/>{[10,18,26,34,42].map((x,i)=><g key={i}><rect x={x} y="10" width="6" height="12" rx="1" fill={color} opacity="0.35"/><circle cx={x+3} cy="26" r="2" fill="#10b981" opacity="0.9"/></g>)}</svg>;
  if (type==="router") return <svg width={size*1.1} height={size} viewBox="0 0 52 48"><rect x="4" y="16" width="44" height="18" rx="4" fill={color} opacity="0.18" stroke={color} strokeWidth="2"/><line x1="14" y1="16" x2="10" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="26" y1="16" x2="26" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="38" y1="16" x2="42" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round"/><circle cx="10" cy="4" r="3" fill={color} opacity="0.7"/><circle cx="26" cy="2" r="3" fill={color} opacity="0.7"/><circle cx="42" cy="4" r="3" fill={color} opacity="0.7"/>{[14,24,34].map((x,i)=><circle key={i} cx={x} cy="25" r="3" fill="#10b981" opacity="0.9"/>)}<circle cx="44" cy="25" r="3" fill="#ef4444" opacity="0.9"/></svg>;
  if (type==="server") return <svg width={size*0.9} height={size} viewBox="0 0 44 48">{[2,17,32].map((y,i)=><g key={i}><rect x="2" y={y} width="40" height="13" rx="2" fill={color} opacity="0.18" stroke={color} strokeWidth="1.5"/><circle cx="10" cy={y+6.5} r="3" fill="#10b981" opacity="0.9"/><rect x="16" y={y+4} width="18" height="2" rx="1" fill={color} opacity="0.35"/></g>)}</svg>;
  if (type==="cloud") return <svg width={size*1.3} height={size} viewBox="0 0 62 48"><path d="M14 36 Q6 36 6 28 Q6 20 14 20 Q14 10 24 10 Q32 10 34 18 Q38 14 44 16 Q52 18 50 28 Q50 36 42 36 Z" fill={color} opacity="0.2" stroke={color} strokeWidth="1.5"/><text x="31" y="28" textAnchor="middle" fontSize="9" fill={color} fontWeight="700">Internet</text></svg>;
  return <svg width={size} height={size} viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill={color} opacity="0.3"/></svg>;
}

function usePacketAnim(devices, packets, running, speed) {
  const [positions, setPositions] = useState({});
  const animRef = useRef(null);
  const startRef = useRef(null);

  const devicesStr = JSON.stringify(devices);
  const packetsStr = JSON.stringify(packets);

  useEffect(() => {
    const devMap = {};
    JSON.parse(devicesStr).forEach(d => { devMap[d.id] = d; });
    const pkts = JSON.parse(packetsStr);

    const getCenter = (id) => {
      const d = devMap[id];
      if (!d) return {x:0,y:0};
      return { x: d.x+(d.w||30), y: d.y+(d.h||30) };
    };

    if (!running) { setPositions({}); return; }
    startRef.current = null;
    const duration = 3.0 / speed;
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      const pos = {};
      pkts.forEach((pkt, i) => {
        const delay = i * (duration / (pkts.length + 1));
        const t = Math.max(0, Math.min(1, (elapsed - delay) / duration));
        const path = [pkt.from, ...(pkt.via||[]), pkt.to];
        const segs = path.length - 1;
        if (segs < 1) return;
        const seg = Math.min(Math.floor(t * segs), segs - 1);
        const segT = (t * segs) - seg;
        const a = getCenter(path[seg]);
        const b = getCenter(path[seg+1]);
        pos[pkt.id] = { x: lerp(a.x,b.x,segT), y: lerp(a.y,b.y,segT), color: pkt.color, label: pkt.label, visible: t>0 && t<1 };
      });
      setPositions(pos);
      if (elapsed < duration + pkts.length*(duration/(pkts.length+1))+0.5) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = null;
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, speed, devicesStr, packetsStr]);

  return positions;
}

function NetSimCanvas({ devices, links, packets, label, desc, color="#6366f1" }) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState(null);
  const positions = usePacketAnim(devices, packets, running && !paused, speed);
  const devMap = {};
  devices.forEach(d => { devMap[d.id]=d; });
  const restart = () => { setRunning(false); setTimeout(()=>setRunning(true),50); setPaused(false); };

  return (
    <div style={{background:"#f8fafc",borderRadius:14,overflow:"hidden",border:"1px solid #e2e8f0",height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{background:"#1e293b",padding:"7px 12px",display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
        <button onClick={restart} style={{width:30,height:30,borderRadius:"50%",border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontSize:13}}>↺</button>
        <button onClick={()=>setPaused(p=>!p)} disabled={!running} style={{width:30,height:30,borderRadius:"50%",border:"none",background:"#64748b",color:"#fff",cursor:"pointer",fontSize:11,opacity:running?1:0.4}}>{paused?"▶":"⏸"}</button>
        <button onClick={restart} style={{width:30,height:30,borderRadius:"50%",border:"none",background:running&&!paused?"#10b981":"#475569",color:"#fff",cursor:"pointer",fontSize:11}}>▶</button>
        <button onClick={()=>setSpeed(s=>s===1?2:s===2?3:1)} style={{width:30,height:30,borderRadius:"50%",border:"none",background:color,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:10}}>{speed}x</button>
        <span style={{color:"#64748b",fontSize:10,marginLeft:4}}>{label}</span>
        <span style={{flex:1}}/>
        <span style={{color:"#475569",fontSize:9}}>Click device to inspect</span>
      </div>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div style={{flex:1,position:"relative",overflow:"hidden"}}>
          <svg width="100%" height="100%" viewBox="0 0 560 320" style={{position:"absolute",top:0,left:0}}>
            {Array.from({length:12},(_,r)=>Array.from({length:19},(_,c)=><circle key={`${r}-${c}`} cx={c*30+15} cy={r*28+14} r="1" fill="#e2e8f0" opacity="0.5"/>))}
            {links.map((lk,i)=>{
              const a=devMap[lk.from]; const b=devMap[lk.to];
              if(!a||!b) return null;
              return <line key={i} x1={a.x+(a.w||30)} y1={a.y+(a.h||30)} x2={b.x+(b.w||30)} y2={b.y+(b.h||30)} stroke="#94a3b8" strokeWidth="2" strokeDasharray={lk.dashed?"6 3":"none"} opacity="0.7"/>;
            })}
            {devices.map(dev=>{
              const isSel=selected?.id===dev.id;
              const dc=dev.color||color;
              return (
                <g key={dev.id} onClick={()=>setSelected(isSel?null:dev)} style={{cursor:"pointer"}}>
                  {isSel&&<circle cx={dev.x+(dev.w||30)} cy={dev.y+(dev.h||30)} r="30" fill={dc} opacity="0.12"/>}
                  <foreignObject x={dev.x} y={dev.y} width="60" height="60">
                    <div xmlns="http://www.w3.org/1999/xhtml" style={{transform:isSel?"scale(1.15)":"scale(1)",transition:"transform 0.15s",transformOrigin:"center"}}>
                      <DeviceIcon type={dev.type} size={44} color={isSel?dc:(dev.color||"#475569")}/>
                    </div>
                  </foreignObject>
                  <text x={dev.x+(dev.w||30)} y={dev.y+62} textAnchor="middle" fontSize="10" fontWeight={isSel?"700":"500"} fill={isSel?dc:"#475569"}>{dev.label}</text>
                </g>
              );
            })}
            {Object.entries(positions).map(([id,p])=>p.visible&&(
              <g key={id}>
                <circle cx={p.x} cy={p.y} r="10" fill={p.color} opacity="0.2"/>
                <circle cx={p.x} cy={p.y} r="6" fill={p.color}/>
                <text x={p.x} y={p.y-12} textAnchor="middle" fontSize="9" fontWeight="700" fill={p.color}>{p.label}</text>
              </g>
            ))}
          </svg>
          {!running&&(
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(248,250,252,0.88)"}}>
              <div style={{fontSize:12,color:"#64748b",marginBottom:10,textAlign:"center",padding:"0 16px"}}>{desc}</div>
              <button onClick={restart} style={{padding:"10px 22px",borderRadius:10,background:color,color:"#fff",fontWeight:700,fontSize:"0.9rem",border:"none",cursor:"pointer"}}>▶ Start Simulation</button>
            </div>
          )}
        </div>
        <div style={{width:170,background:"#fff",borderLeft:"1px solid #e2e8f0",padding:10,overflowY:"auto",fontSize:11}}>
          {selected ? (
            <div>
              <div style={{fontWeight:700,color:selected.color||color,marginBottom:7,fontSize:12}}>{selected.label}</div>
              {[["Type",selected.type],["IP",selected.ip||"N/A"],["Role",selected.role||"—"]].map(([k,v])=>(
                <div key={k} style={{background:"#f8fafc",borderRadius:6,padding:"4px 7px",marginBottom:5}}>
                  <div style={{color:"#94a3b8",fontSize:9}}>{k}</div>
                  <div style={{fontWeight:600,color:"#0f172a",fontFamily:k==="IP"?"monospace":"inherit",fontSize:10}}>{v}</div>
                </div>
              ))}
              {selected.info&&<div style={{marginTop:6,background:`${selected.color||color}12`,borderRadius:6,padding:"5px 7px",color:"#475569",lineHeight:1.5,fontSize:10}}>{selected.info}</div>}
            </div>
          ) : (
            <div>
              <div style={{fontWeight:700,color:"#0f172a",marginBottom:5,fontSize:12}}>{label}</div>
              <div style={{color:"#64748b",lineHeight:1.5,marginBottom:8,fontSize:10}}>{desc}</div>
              <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Packets</div>
              {packets.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                  <span style={{color:"#475569",fontSize:10}}><b>{p.label}</b> {devMap[p.from]?.label}→{devMap[p.to]?.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MODULE 1 ──
function Mod1Sim() {
  const [activeLayer, setActiveLayer] = useState(null);
  const [encapStep, setEncapStep] = useState(0);
  const layers = [
    {n:5,name:"Application",color:"#6366f1",proto:"HTTP, FTP, DNS, SMTP",ex:"Your browser making a web request",data:"DATA"},
    {n:4,name:"Transport",color:"#8b5cf6",proto:"TCP, UDP",ex:"Splits data into segments, adds port numbers",data:"SEGMENT"},
    {n:3,name:"Network",color:"#0ea5e9",proto:"IP, ICMP, ARP",ex:"Adds IP source & destination addresses",data:"PACKET"},
    {n:2,name:"Data Link",color:"#10b981",proto:"Ethernet, WiFi, PPP",ex:"Adds MAC addresses for local delivery",data:"FRAME"},
    {n:1,name:"Physical",color:"#f59e0b",proto:"Bits, electrical signals, light",ex:"Converts to actual bits sent over cable",data:"BITS"},
  ];
  const devices=[
    {id:"pc",type:"pc",label:"Your PC",x:40,y:120,ip:"192.168.1.10",role:"Sender",color:"#6366f1",info:"Originates data. Encapsulates through all 5 layers before sending."},
    {id:"sw",type:"switch",label:"Switch",x:180,y:180,ip:"N/A",role:"Layer 2 device",color:"#10b981",info:"Reads MAC addresses (Layer 2 only). Forwards frames within the LAN."},
    {id:"router",type:"router",label:"Router",x:310,y:120,ip:"192.168.1.1",role:"Layer 3 device",color:"#f59e0b",info:"Reads IP addresses (Layer 3). Routes packets between different networks."},
    {id:"srv",type:"server",label:"Server",x:430,y:180,ip:"93.184.216.34",role:"Receiver",color:"#8b5cf6",info:"Receives the frame and decapsulates through all layers back to the original data."},
  ];
  const links=[{from:"pc",to:"sw"},{from:"sw",to:"router"},{from:"router",to:"srv"}];
  const packets=[
    {id:"p1",from:"pc",to:"srv",via:["sw","router"],color:"#6366f1",label:"Frame"},
    {id:"p2",from:"srv",to:"pc",via:["router","sw"],color:"#f59e0b",label:"ACK"},
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,height:"100%"}}>
      <div style={{height:240,flexShrink:0}}>
        <NetSimCanvas devices={devices} links={links} packets={packets} label="Network Devices" desc="See how data flows through a switch and router." color="#6366f1"/>
      </div>
      <div style={{flex:1,display:"flex",gap:10,minHeight:0}}>
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:8}}>5-Layer Model — click each</div>
          {layers.map((l,i)=>(
            <div key={i} onClick={()=>setActiveLayer(activeLayer===i?null:i)} style={{marginBottom:5,borderRadius:8,overflow:"hidden",cursor:"pointer",border:`1px solid ${activeLayer===i?l.color:"#e2e8f0"}`,transition:"all 0.2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:activeLayer===i?l.color:"#f8fafc"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:activeLayer===i?"rgba(255,255,255,0.3)":l.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11}}>{l.n}</div>
                <span style={{fontWeight:700,fontSize:12,color:activeLayer===i?"#fff":"#1e293b",flex:1}}>{l.name}</span>
                <span style={{fontSize:9,color:activeLayer===i?"rgba(255,255,255,0.8)":"#94a3b8",fontFamily:"monospace"}}>{l.data}</span>
              </div>
              {activeLayer===i&&<div style={{padding:"6px 10px",background:`${l.color}12`,fontSize:10,color:"#334155"}}><b>Protocols:</b> {l.proto}<br/>{l.ex}</div>}
            </div>
          ))}
        </div>
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:6}}>Encapsulation — step through</div>
          <div style={{display:"flex",gap:5,marginBottom:10}}>
            <button onClick={()=>setEncapStep(Math.max(0,encapStep-1))} style={{flex:1,padding:"5px 0",borderRadius:7,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",fontSize:11}}>← Back</button>
            <button onClick={()=>setEncapStep(Math.min(4,encapStep+1))} style={{flex:1,padding:"5px 0",borderRadius:7,border:"none",background:"#6366f1",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:11}}>Next →</button>
          </div>
          {layers.slice(0,encapStep+1).reverse().map((l,i)=>(
            <div key={i} style={{marginBottom:5,borderRadius:7,overflow:"hidden",border:`1px solid ${l.color}40`}}>
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 9px",background:`${l.color}15`}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:l.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:9}}>{l.n}</div>
                <span style={{fontWeight:700,fontSize:11,color:"#1e293b"}}>{l.name}</span>
                <span style={{fontSize:10,fontFamily:"monospace",color:l.color,fontWeight:700,marginLeft:"auto"}}>{l.data}</span>
              </div>
            </div>
          ))}
          <div style={{marginTop:6,padding:"7px 9px",background:"#f8fafc",borderRadius:7,fontSize:10,color:"#64748b"}}>
            {["Start: raw application data (e.g. HTTP request)","Transport wraps in segment — adds port numbers","Network wraps in packet — adds source & dest IPs","Data Link wraps in frame — adds MAC addresses","Physical converts everything to 1s and 0s"][encapStep]}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MODULE 2 ──
function Mod2Sim() {
  const [ipInput, setIpInput] = useState("192.168.1.1");
  const [binaryResult, setBinaryResult] = useState(null);
  const [subnetVis, setSubnetVis] = useState(24);
  const convertIP = () => {
    const parts = ipInput.split(".").map(Number);
    if (parts.length!==4||parts.some(p=>isNaN(p)||p<0||p>255)) { setBinaryResult({error:true}); return; }
    const bins = parts.map(p=>p.toString(2).padStart(8,"0"));
    let cls=""; const priv=(parts[0]===10)||(parts[0]===172&&parts[1]>=16&&parts[1]<=31)||(parts[0]===192&&parts[1]===168);
    if(parts[0]<=126) cls="A"; else if(parts[0]<=191) cls="B"; else if(parts[0]<=223) cls="C"; else cls="D/E";
    setBinaryResult({bins,cls,priv,parts});
  };
  const devices=[
    {id:"pc1",type:"pc",label:"PC 1",x:30,y:100,ip:"10.0.0.10",role:"Host — Network A",color:"#6366f1",info:"In Network A (10.0.0.x /24). Can talk to PC2 directly. Needs router to reach Server."},
    {id:"pc2",type:"laptop",label:"PC 2",x:30,y:220,ip:"10.0.0.11",role:"Host — Network A",color:"#6366f1",info:"Same /24 subnet as PC1. Direct communication possible without a router."},
    {id:"router",type:"router",label:"Router",x:230,y:155,ip:"10.0.0.1 / 172.16.0.1",role:"Default Gateway",color:"#f59e0b",info:"Connects Network A to Network B. Maintains a routing table to forward packets."},
    {id:"srv1",type:"server",label:"Server",x:400,y:100,ip:"172.16.0.20",role:"Host — Network B",color:"#0ea5e9",info:"In Network B (172.16.0.x /24). Needs the router to receive packets from PC1."},
    {id:"srv2",type:"server",label:"PC 3",x:400,y:220,ip:"172.16.0.21",role:"Host — Network B",color:"#0ea5e9",info:"Same subnet as Server. Can communicate with Server directly."},
  ];
  const links=[{from:"pc1",to:"router"},{from:"pc2",to:"router"},{from:"router",to:"srv1"},{from:"router",to:"srv2"}];
  const packets=[
    {id:"p1",from:"pc1",to:"srv1",via:["router"],color:"#6366f1",label:"Packet"},
    {id:"p2",from:"srv1",to:"pc1",via:["router"],color:"#0ea5e9",label:"Reply"},
  ];
  const netBits=subnetVis; const hostBits=32-netBits; const hosts=Math.pow(2,hostBits)-2;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10,height:"100%"}}>
      <div style={{height:230,flexShrink:0}}>
        <NetSimCanvas devices={devices} links={links} packets={packets} label="Routing Between Networks" desc="Watch packets route between two IP networks via a router." color="#0ea5e9"/>
      </div>
      <div style={{flex:1,display:"flex",gap:10,minHeight:0}}>
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:8}}>IP → Binary Converter</div>
          <div style={{display:"flex",gap:5,marginBottom:8}}>
            <input value={ipInput} onChange={e=>setIpInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&convertIP()}
              style={{flex:1,padding:"7px 9px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"monospace",outline:"none"}} placeholder="e.g. 192.168.1.1"/>
            <button onClick={convertIP} style={{padding:"7px 12px",borderRadius:7,background:"#0ea5e9",color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontSize:11}}>Go</button>
          </div>
          {binaryResult&&!binaryResult.error&&(
            <div>
              <div style={{display:"flex",gap:3,marginBottom:7,flexWrap:"wrap"}}>
                {binaryResult.bins.map((b,i)=>(
                  <div key={i} style={{textAlign:"center"}}>
                    <div style={{fontFamily:"monospace",fontSize:10,background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:5,padding:"3px 5px",color:"#0369a1",letterSpacing:1}}>{b}</div>
                    <div style={{fontSize:9,color:"#64748b",marginTop:1}}>{binaryResult.parts[i]}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                <span style={{background:"#eef2ff",color:"#4338ca",borderRadius:5,padding:"2px 7px",fontSize:10,fontWeight:700}}>Class {binaryResult.cls}</span>
                <span style={{background:binaryResult.priv?"#ecfdf5":"#fef2f2",color:binaryResult.priv?"#065f46":"#991b1b",borderRadius:5,padding:"2px 7px",fontSize:10,fontWeight:700}}>{binaryResult.priv?"Private":"Public"}</span>
              </div>
            </div>
          )}
          {binaryResult?.error&&<div style={{color:"#ef4444",fontSize:11}}>Invalid IP. Use 0–255 for each octet.</div>}
        </div>
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:5}}>Subnet Visualiser — /{subnetVis}</div>
          <input type="range" min="8" max="30" value={subnetVis} onChange={e=>setSubnetVis(Number(e.target.value))} style={{width:"100%",marginBottom:6}}/>
          <div style={{display:"flex",height:26,borderRadius:6,overflow:"hidden",marginBottom:6}}>
            {Array.from({length:32},(_,i)=>(
              <div key={i} style={{flex:1,background:i<netBits?"#0ea5e9":"#10b981",opacity:0.55+(i%8===0?0.2:0),borderRight:i%8===7?"2px solid #fff":"1px solid rgba(255,255,255,0.2)"}}/>
            ))}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            {[["Network bits",netBits,"#e0f2fe","#0369a1"],["Host bits",hostBits,"#ecfdf5","#065f46"],["Usable hosts",hosts.toLocaleString(),"#fffbeb","#92400e"]].map(([label,val,bg,tc])=>(
              <div key={label} style={{flex:1,background:bg,borderRadius:5,padding:"4px 6px",textAlign:"center"}}>
                <div style={{fontSize:9,color:tc}}>{label}</div>
                <div style={{fontWeight:700,color:tc,fontSize:11}}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:"#64748b"}}>/{subnetVis} means first {netBits} bits = network, remaining {hostBits} bits = hosts.</div>
        </div>
      </div>
    </div>
  );
}

// ── MODULE 3 ──
function Mod3Sim() {
  const [hStep, setHStep] = useState(-1);
  const [hRunning, setHRunning] = useState(false);
  const hSteps=[
    {from:"client",msg:"SYN",color:"#6366f1",desc:"Client: 'I want to connect. My sequence number is X.'"},
    {from:"server",msg:"SYN-ACK",color:"#10b981",desc:"Server: 'OK! Got your SYN (ACK=X+1). My sequence number is Y.'"},
    {from:"client",msg:"ACK",color:"#0ea5e9",desc:"Client: 'Got your SYN (ACK=Y+1). Connection established!'"},
    {from:"both",msg:"DATA",color:"#f59e0b",desc:"Connection open! Data flows reliably in both directions."},
  ];
  useEffect(()=>{
    if(!hRunning) return;
    if(hStep<hSteps.length-1){const t=setTimeout(()=>setHStep(s=>s+1),900);return()=>clearTimeout(t);}
    else setHRunning(false);
  },[hRunning,hStep,hSteps.length]);
  const devices=[
    {id:"client",type:"pc",label:"Client",x:40,y:110,ip:"192.168.1.10",role:"Initiates TCP connection",color:"#6366f1",info:"Starts the handshake with SYN. Must complete 3-way handshake before data can flow."},
    {id:"fw",type:"router",label:"Firewall",x:200,y:155,ip:"10.0.0.1",role:"Packet filter",color:"#ef4444",info:"Inspects packets by port. Allows 443 (HTTPS), blocks 23 (Telnet)."},
    {id:"server",type:"server",label:"Web Server",x:360,y:110,ip:"93.184.216.34",role:"Listens on port 443",color:"#10b981",info:"LISTENING on port 443. Responds to SYN with SYN-ACK to accept the connection."},
  ];
  const links=[{from:"client",to:"fw"},{from:"fw",to:"server"}];
  const packets=[
    {id:"p1",from:"client",to:"server",via:["fw"],color:"#6366f1",label:"SYN"},
    {id:"p2",from:"server",to:"client",via:["fw"],color:"#10b981",label:"SYN-ACK"},
    {id:"p3",from:"client",to:"server",via:["fw"],color:"#0ea5e9",label:"ACK"},
    {id:"p4",from:"server",to:"client",via:["fw"],color:"#f59e0b",label:"Data"},
  ];
  const ports=[
    {port:80,proto:"HTTP",color:"#6366f1",use:"Web pages (unencrypted)"},
    {port:443,proto:"HTTPS",color:"#10b981",use:"Web pages (encrypted TLS)"},
    {port:22,proto:"SSH",color:"#0ea5e9",use:"Secure remote login"},
    {port:53,proto:"DNS",color:"#f59e0b",use:"Domain name resolution"},
    {port:25,proto:"SMTP",color:"#ec4899",use:"Sending email"},
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10,height:"100%"}}>
      <div style={{height:220,flexShrink:0}}>
        <NetSimCanvas devices={devices} links={links} packets={packets} label="TCP Connection Flow" desc="Watch a full TCP handshake then data transfer through a firewall." color="#10b981"/>
      </div>
      <div style={{flex:1,display:"flex",gap:10,minHeight:0}}>
        <div style={{flex:1.2,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:7}}>TCP 3-Way Handshake</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            {["Client","Server"].map(n=>(
              <div key={n} style={{width:74,textAlign:"center",padding:"6px 0",borderRadius:8,background:n==="Client"?"#eef2ff":"#ecfdf5",border:`1px solid ${n==="Client"?"#a5b4fc":"#6ee7b7"}`,fontWeight:700,fontSize:11,color:n==="Client"?"#4338ca":"#065f46"}}>{n}</div>
            ))}
          </div>
          {hSteps.slice(0,Math.max(0,hStep+1)).map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",marginBottom:9,transition:"all 0.3s"}}>
              <div style={{width:74,textAlign:"center"}}>{s.from==="client"&&<div style={{height:20,background:"#6366f1",borderRadius:4,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",width:60}}>{s.msg}</div>}</div>
              <div style={{flex:1,height:2,background:s.color,position:"relative",margin:"0 4px"}}>
                <div style={{position:"absolute",top:-7,left:"50%",transform:"translateX(-50%)",background:s.color,color:"#fff",borderRadius:3,padding:"1px 5px",fontSize:8,fontWeight:700,whiteSpace:"nowrap"}}>{s.from==="client"?"→":"←"}</div>
              </div>
              <div style={{width:74,textAlign:"center"}}>{s.from==="server"&&<div style={{height:20,background:"#10b981",borderRadius:4,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",width:60}}>{s.msg}</div>}</div>
            </div>
          ))}
          {hStep>=0&&hStep<hSteps.length&&<div style={{padding:"6px 9px",borderRadius:7,background:`${hSteps[hStep].color}15`,border:`1px solid ${hSteps[hStep].color}40`,fontSize:10,color:"#334155",marginBottom:7}}>{hSteps[hStep].desc}</div>}
          <button onClick={()=>{setHStep(-1);setHRunning(true);}} style={{width:"100%",padding:"6px 0",borderRadius:7,border:"none",background:"#10b981",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer"}}>{hRunning?"Animating...":hStep>=0?"Replay":"▶ Animate"}</button>
        </div>
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:7}}>Common Ports</div>
          {ports.map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 9px",borderRadius:8,marginBottom:5,background:`${p.color}0e`,border:`1px solid ${p.color}30`}}>
              <div style={{width:34,height:34,borderRadius:7,background:p.color,color:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:10,flexShrink:0}}>
                <span style={{fontSize:7,opacity:0.8}}>PORT</span>{p.port}
              </div>
              <div><div style={{fontWeight:700,fontSize:11,color:"#0f172a"}}>{p.proto}</div><div style={{fontSize:9,color:"#64748b"}}>{p.use}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MODULE 4 ──
function Mod4Sim() {
  const [dnsStep, setDnsStep] = useState(-1);
  const [dnsRunning, setDnsRunning] = useState(false);
  const dnsSteps=[
    {name:"Browser Cache",color:"#6366f1",a:"Not found — ask resolver"},
    {name:"DNS Resolver",color:"#0ea5e9",a:"Not cached — ask root server"},
    {name:"Root Server",color:"#10b981",a:"Ask the .com TLD server"},
    {name:"TLD Server",color:"#f59e0b",a:"Ask Google's auth server"},
    {name:"Auth Server",color:"#ec4899",a:"142.250.4.100 ← Found!"},
  ];
  useEffect(()=>{
    if(!dnsRunning) return;
    if(dnsStep<dnsSteps.length-1){const t=setTimeout(()=>setDnsStep(s=>s+1),700);return()=>clearTimeout(t);}
    else setDnsRunning(false);
  },[dnsRunning,dnsStep,dnsSteps.length]);
  const devices=[
    {id:"client",type:"pc",label:"Your PC",x:30,y:140,ip:"192.168.1.10",role:"DHCP Client",color:"#6366f1",info:"Gets IP via DHCP. Sends DNS queries to resolve domain names before connecting."},
    {id:"router",type:"router",label:"Home Router",x:170,y:140,ip:"192.168.1.1",role:"DHCP Server + NAT",color:"#f59e0b",info:"Assigns IPs to local devices (DHCP). Translates private IPs to public IP (NAT)."},
    {id:"isp",type:"server",label:"ISP Resolver",x:310,y:80,ip:"203.0.113.1",role:"DNS Resolver",color:"#0ea5e9",info:"Your ISP's DNS resolver. Caches frequently requested domains to speed up responses."},
    {id:"dns",type:"server",label:"Auth DNS",x:430,y:80,ip:"8.8.8.8",role:"Authoritative DNS",color:"#10b981",info:"Returns the definitive IP address for a domain name."},
    {id:"web",type:"server",label:"Web Server",x:430,y:220,ip:"142.250.4.100",role:"Destination",color:"#ec4899",info:"The server hosting the website. Responds to HTTP/HTTPS requests."},
  ];
  const links=[{from:"client",to:"router"},{from:"router",to:"isp"},{from:"isp",to:"dns"},{from:"router",to:"web"},{from:"isp",to:"web"},{from:"dns",to:"isp",dashed:true}];
  const packets=[
    {id:"p1",from:"client",to:"dns",via:["router","isp"],color:"#6366f1",label:"DNS?"},
    {id:"p2",from:"dns",to:"client",via:["isp","router"],color:"#10b981",label:"IP!"},
    {id:"p3",from:"client",to:"web",via:["router","isp"],color:"#f59e0b",label:"GET"},
    {id:"p4",from:"web",to:"client",via:["isp","router"],color:"#ec4899",label:"HTML"},
  ];
  const dhcp=[
    {step:"D",name:"Discover",color:"#6366f1",desc:"Client broadcasts: 'Any DHCP servers out there?'"},
    {step:"O",name:"Offer",color:"#0ea5e9",desc:"Server offers: 'You can have 192.168.1.10'"},
    {step:"R",name:"Request",color:"#10b981",desc:"Client says: 'I'll take 192.168.1.10 please!'"},
    {step:"A",name:"Acknowledge",color:"#f59e0b",desc:"Server confirms: 'It's yours for 24 hours'"},
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10,height:"100%"}}>
      <div style={{height:230,flexShrink:0}}>
        <NetSimCanvas devices={devices} links={links} packets={packets} label="DNS + DHCP + NAT" desc="Watch a full web request — DNS lookup, NAT translation, HTTP response." color="#f59e0b"/>
      </div>
      <div style={{flex:1,display:"flex",gap:10,minHeight:0}}>
        <div style={{flex:1.2,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:7}}>DNS Resolution — step by step</div>
          {dnsSteps.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:7,marginBottom:5,opacity:dnsStep>=i?1:0.3,transition:"opacity 0.4s"}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:dnsStep>=i?s.color:"#e2e8f0",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:10,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,background:dnsStep>=i?`${s.color}10`:"#f8fafc",borderRadius:7,padding:"4px 7px",border:`1px solid ${dnsStep>=i?s.color+"40":"#e2e8f0"}`}}>
                <div style={{fontWeight:700,fontSize:10,color:dnsStep>=i?s.color:"#94a3b8"}}>{s.name}</div>
                <div style={{fontSize:9,color:"#64748b"}}>{s.a}</div>
              </div>
            </div>
          ))}
          <button onClick={()=>{setDnsStep(-1);setDnsRunning(true);}} style={{marginTop:6,width:"100%",padding:"6px 0",borderRadius:7,border:"none",background:"#f59e0b",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer"}}>{dnsRunning?"Resolving...":dnsStep>=0?"Replay":"▶ Animate DNS"}</button>
        </div>
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:7}}>DHCP — DORA Process</div>
          {dhcp.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:7,marginBottom:7,padding:"7px 9px",borderRadius:8,background:`${s.color}0e`,border:`1px solid ${s.color}30`}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:s.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0}}>{s.step}</div>
              <div><div style={{fontWeight:700,fontSize:11,color:"#0f172a"}}>{s.name}</div><div style={{fontSize:9,color:"#64748b"}}>{s.desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MODULE 5 ──
function Mod5Sim() {
  const devices=[
    {id:"phone",type:"phone",label:"Phone",x:30,y:80,ip:"192.168.1.5",role:"WiFi 5GHz client",color:"#ec4899",info:"Connected on 5GHz. Fast speeds, shorter range. Uses 802.11ax (WiFi 6)."},
    {id:"laptop",type:"laptop",label:"Laptop",x:30,y:220,ip:"192.168.1.6",role:"WiFi 2.4GHz client",color:"#6366f1",info:"Connected on 2.4GHz. Slower but better range through walls."},
    {id:"router",type:"router",label:"WiFi Router",x:190,y:150,ip:"192.168.1.1",role:"Access Point + Router",color:"#f59e0b",info:"Broadcasts 2.4GHz and 5GHz simultaneously. Routes traffic to ISP."},
    {id:"modem",type:"server",label:"ISP Modem",x:340,y:150,ip:"203.0.113.1",role:"WAN Gateway",color:"#0ea5e9",info:"Connects your home network to your ISP. Handles WAN protocol translation."},
    {id:"isp",type:"cloud",label:"Internet",x:450,y:130,ip:"WAN",role:"The Internet",color:"#64748b",info:"The global internet. Your packets traverse multiple routers to reach servers worldwide."},
  ];
  const links=[{from:"phone",to:"router",dashed:true},{from:"laptop",to:"router",dashed:true},{from:"router",to:"modem"},{from:"modem",to:"isp"}];
  const packets=[
    {id:"p1",from:"phone",to:"isp",via:["router","modem"],color:"#ec4899",label:"5GHz"},
    {id:"p2",from:"laptop",to:"isp",via:["router","modem"],color:"#6366f1",label:"2.4GHz"},
    {id:"p3",from:"isp",to:"phone",via:["modem","router"],color:"#f59e0b",label:"Data"},
  ];
  const wanTypes=[
    {name:"Fibre",speed:"100Mbps–10Gbps",color:"#10b981",icon:"⚡",how:"Light pulses through glass fibre cable"},
    {name:"Cable",speed:"50–500 Mbps",color:"#6366f1",icon:"📡",how:"Uses TV cable infrastructure (coaxial)"},
    {name:"DSL",speed:"1–100 Mbps",color:"#f59e0b",icon:"📞",how:"Uses existing telephone copper lines"},
    {name:"Cellular",speed:"5–1000 Mbps",color:"#ec4899",icon:"📶",how:"4G/5G mobile towers over radio"},
  ];
  const wifiStds=[
    {std:"802.11n — WiFi 4",freq:"2.4/5GHz",speed:"600 Mbps",color:"#94a3b8"},
    {std:"802.11ac — WiFi 5",freq:"5GHz",speed:"3.5 Gbps",color:"#0ea5e9"},
    {std:"802.11ax — WiFi 6",freq:"2.4/5/6GHz",speed:"9.6 Gbps",color:"#6366f1"},
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10,height:"100%"}}>
      <div style={{height:230,flexShrink:0}}>
        <NetSimCanvas devices={devices} links={links} packets={packets} label="Home Network to Internet" desc="See how WiFi devices connect through your router and ISP to the internet." color="#ec4899"/>
      </div>
      <div style={{flex:1,display:"flex",gap:10,minHeight:0}}>
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:7}}>2.4 GHz vs 5 GHz</div>
          {[["Range","████████","█████"],["Speed","████","████████"],["Congestion","High","Low"],["Wall penetration","Better","Weaker"]].map(([label,v24,v5],i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:3,marginBottom:5,alignItems:"center"}}>
              <div style={{fontSize:10,fontWeight:600,color:"#475569"}}>{label}</div>
              <div style={{background:"#eff6ff",borderRadius:5,padding:"3px 5px",textAlign:"center",fontSize:9,color:"#1d4ed8",fontFamily:"monospace"}}>{v24}</div>
              <div style={{background:"#ecfdf5",borderRadius:5,padding:"3px 5px",textAlign:"center",fontSize:9,color:"#065f46",fontFamily:"monospace"}}>{v5}</div>
            </div>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:3,marginBottom:8}}>
            <div/><div style={{textAlign:"center",fontSize:9,fontWeight:700,color:"#1d4ed8"}}>2.4 GHz</div>
            <div style={{textAlign:"center",fontSize:9,fontWeight:700,color:"#065f46"}}>5 GHz</div>
          </div>
          {wifiStds.map((w,i)=>(
            <div key={i} style={{display:"flex",gap:5,marginBottom:4,padding:"4px 7px",borderRadius:6,background:`${w.color}10`,border:`1px solid ${w.color}30`}}>
              <div style={{fontSize:9,fontWeight:700,color:w.color,minWidth:90}}>{w.std}</div>
              <div style={{fontSize:9,color:"#64748b"}}>{w.freq} · {w.speed}</div>
            </div>
          ))}
        </div>
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:7}}>WAN / Broadband Types</div>
          {wanTypes.map((w,i)=>(
            <div key={i} style={{display:"flex",gap:8,padding:"8px 9px",borderRadius:9,marginBottom:7,background:`${w.color}0e`,border:`1px solid ${w.color}30`}}>
              <div style={{width:34,height:34,borderRadius:9,background:w.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{w.icon}</div>
              <div><div style={{fontWeight:700,fontSize:11,color:"#0f172a"}}>{w.name} <span style={{fontSize:9,color:w.color,fontWeight:700}}>{w.speed}</span></div><div style={{fontSize:9,color:"#64748b"}}>{w.how}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MODULE 6 ──
function Mod6Sim() {
  const [activeLayer, setActiveLayer] = useState(null);
  const [scenario, setScenario] = useState(0);
  const scenarios=[
    {title:"Can't load websites",clue:"User can ping 8.8.8.8 but websites won't open",answer:"DNS issue (Layer 5/App). Run: nslookup google.com to verify.",layer:4},
    {title:"APIPA address assigned",clue:"ipconfig shows 169.254.x.x",answer:"DHCP failed. The PC couldn't get an IP from the router. Check cable or restart router.",layer:0},
    {title:"Can't reach other network",clue:"Can ping local devices but not remote server",answer:"Default gateway wrong or router misconfigured. Check Layer 3 routing.",layer:2},
    {title:"Slow page loads",clue:"traceroute shows high latency at hop 6",answer:"Network congestion or faulty router at hop 6. Escalate to ISP if persistent.",layer:2},
  ];
  const layers=[
    {n:1,name:"Physical",color:"#f59e0b",check:"Check cables, LEDs, NIC. Run: ping 127.0.0.1",tools:"LED indicators, cable tester"},
    {n:2,name:"Data Link",color:"#10b981",check:"Check MAC address, run: ipconfig /all",tools:"ipconfig, arp -a"},
    {n:3,name:"Network",color:"#0ea5e9",check:"Ping default gateway. Check IP and subnet.",tools:"ping, ipconfig, traceroute"},
    {n:4,name:"Transport",color:"#8b5cf6",check:"Check if correct ports are open. Firewall rules?",tools:"netstat, telnet host port"},
    {n:5,name:"Application",color:"#6366f1",check:"Test DNS: nslookup google.com. Try different browser.",tools:"nslookup, browser dev tools"},
  ];
  const devices=[
    {id:"pc",type:"pc",label:"Your PC",x:40,y:140,ip:"169.254.x.x",role:"Troubleshooting target",color:"#ef4444",info:"APIPA address (169.254.x.x) detected. DHCP failed — the PC couldn't get an IP from the router."},
    {id:"sw",type:"switch",label:"Switch",x:190,y:190,ip:"N/A",role:"Layer 2",color:"#10b981",info:"Check all port LEDs. A dark LED = no physical link on that port."},
    {id:"router",type:"router",label:"Router",x:330,y:140,ip:"192.168.1.1",role:"Default Gateway + DHCP",color:"#f59e0b",info:"Is it powered on? Can other devices get IPs? Try rebooting it first."},
    {id:"isp",type:"server",label:"ISP",x:450,y:140,ip:"WAN",role:"Internet",color:"#64748b",info:"If router works but internet is down, the issue is with your ISP — call them."},
  ];
  const links=[{from:"pc",to:"sw"},{from:"sw",to:"router"},{from:"router",to:"isp"}];
  const packets=[
    {id:"p1",from:"pc",to:"router",via:["sw"],color:"#ef4444",label:"DHCP?"},
    {id:"p2",from:"router",to:"pc",via:["sw"],color:"#10b981",label:"IP!"},
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10,height:"100%"}}>
      <div style={{height:230,flexShrink:0}}>
        <NetSimCanvas devices={devices} links={links} packets={packets} label="Network Fault Scenario" desc="A PC has an APIPA address (169.254.x.x). Diagnose the fault bottom-up." color="#ef4444"/>
      </div>
      <div style={{flex:1,display:"flex",gap:10,minHeight:0}}>
        <div style={{flex:1.1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:6}}>Bottom-Up Methodology — click each layer</div>
          {layers.map((l,i)=>(
            <div key={i} onClick={()=>setActiveLayer(activeLayer===i?null:i)} style={{marginBottom:5,borderRadius:8,overflow:"hidden",cursor:"pointer",border:`1px solid ${activeLayer===i?l.color:"#e2e8f0"}`,transition:"all 0.2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"7px 9px",background:activeLayer===i?l.color:"#f8fafc"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:activeLayer===i?"rgba(255,255,255,0.3)":l.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:10}}>{l.n}</div>
                <span style={{fontWeight:700,fontSize:11,color:activeLayer===i?"#fff":"#1e293b",flex:1}}>{l.name}</span>
                <span style={{fontSize:9,color:activeLayer===i?"rgba(255,255,255,0.7)":"#94a3b8"}}>{l.tools}</span>
              </div>
              {activeLayer===i&&<div style={{padding:"6px 9px",background:`${l.color}10`,fontSize:10,color:"#334155"}}>{l.check}</div>}
            </div>
          ))}
        </div>
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:7}}>Fault Diagnosis Scenarios</div>
          <div style={{display:"flex",gap:4,marginBottom:9}}>
            {scenarios.map((s,i)=>(
              <button key={i} onClick={()=>setScenario(i)} style={{flex:1,padding:"4px 0",borderRadius:5,border:`1px solid ${scenario===i?"#ef4444":"#e2e8f0"}`,background:scenario===i?"#fef2f2":"transparent",color:scenario===i?"#ef4444":"#64748b",cursor:"pointer",fontSize:10,fontWeight:scenario===i?700:400}}>{i+1}</button>
            ))}
          </div>
          <div style={{padding:"9px 10px",borderRadius:9,background:"#fff7ed",border:"1px solid #fed7aa",marginBottom:8}}>
            <div style={{fontWeight:700,fontSize:11,color:"#c2410c",marginBottom:3}}>🔍 {scenarios[scenario].title}</div>
            <div style={{fontSize:10,color:"#64748b"}}>{scenarios[scenario].clue}</div>
          </div>
          <div style={{padding:"9px 10px",borderRadius:9,background:"#ecfdf5",border:"1px solid #a7f3d0",fontSize:10,color:"#065f46",lineHeight:1.6,marginBottom:6}}>
            {scenarios[scenario].answer}
          </div>
          <div style={{fontSize:9,color:"#94a3b8"}}>OSI Layer: {scenarios[scenario].layer+1} — {layers[scenarios[scenario].layer]?.name}</div>
        </div>
      </div>
    </div>
  );
}

function InfoPanel({ moduleId, color }) {
  const info = MODULE_INFO[moduleId];
  if (!info) return null;
  return (
    <div style={{display:"flex",gap:10,marginTop:10,flexShrink:0}}>
      <div style={{flex:1,background:"#fff",borderRadius:12,border:`1px solid ${color}30`,padding:"10px 14px"}}>
        <div style={{fontWeight:700,fontSize:11,color:color,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>⚙ What's happening</div>
        <div style={{fontSize:11,color:"#475569",lineHeight:1.65}}>{info.whatHappens}</div>
      </div>
      <div style={{flex:1,background:`${color}08`,borderRadius:12,border:`1px solid ${color}30`,padding:"10px 14px"}}>
        <div style={{fontWeight:700,fontSize:11,color:color,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>🌍 Real-world example</div>
        <div style={{fontSize:11,color:"#475569",lineHeight:1.65}}>{info.realExample}</div>
      </div>
    </div>
  );
}

const MODULE_SIMS = {1:Mod1Sim,2:Mod2Sim,3:Mod3Sim,4:Mod4Sim,5:Mod5Sim,6:Mod6Sim};

// ── LOGIN ──
function LoginScreen({ onLogin }) {
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [err,setErr]=useState(""); const [shake,setShake]=useState(false);
  const attempt=()=>{
    if(u===LOGIN_USERNAME&&p===LOGIN_PASSWORD) onLogin();
    else { setErr("Incorrect username or password."); setShake(true); setTimeout(()=>setShake(false),500); }
  };
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"system-ui,sans-serif"}}>
      <div style={{maxWidth:420,width:"100%",textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:20}}>
          {MODULES.map((m)=><div key={m.id} style={{width:34,height:34,borderRadius:9,background:m.color,opacity:0.85,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:10}}>M{m.id}</div>)}
        </div>
        <h1 style={{color:"#f1f5f9",fontSize:"1.7rem",fontWeight:800,margin:"0 0 6px"}}>Networking Learning Hub</h1>
        <p style={{color:"#64748b",fontSize:"0.85rem",marginBottom:28}}>Google Course · Bits and Bytes of Computer Networking</p>
        <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,padding:28,animation:shake?"shake 0.4s":"none"}}>
          <div style={{color:"#94a3b8",fontSize:13,marginBottom:18}}>Sign in to access your learning hub</div>
          {[["Username",u,setU,"text","Enter username"],["Password",p,setP,"password","Enter password"]].map(([label,val,setter,type,ph])=>(
            <div key={label} style={{marginBottom:14,textAlign:"left"}}>
              <label style={{fontSize:12,color:"#64748b",fontWeight:600,display:"block",marginBottom:5}}>{label}</label>
              <input type={type} value={val} onChange={e=>{setter(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder={ph}
                style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1px solid ${err?"#ef4444":"rgba(255,255,255,0.15)"}`,background:"rgba(255,255,255,0.07)",color:"#e2e8f0",fontSize:"0.95rem",outline:"none",boxSizing:"border-box"}}/>
            </div>
          ))}
          {err&&<div style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"8px 12px",color:"#fca5a5",fontSize:13,marginBottom:14}}>{err}</div>}
          <button onClick={attempt} style={{width:"100%",padding:13,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontWeight:700,fontSize:"1rem",border:"none",cursor:"pointer"}}>Sign In →</button>
        </div>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>
    </div>
  );
}

function PacketFlow() {
  const [pos,setPos]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setPos(p=>(p+1)%100),40);return()=>clearInterval(t);},[]);
  const nodes=[{x:8,label:"PC",color:"#6366f1"},{x:30,label:"Switch",color:"#0ea5e9"},{x:54,label:"Router",color:"#10b981"},{x:76,label:"Server",color:"#f59e0b"}];
  return (
    <div style={{position:"relative",height:60,marginBottom:8}}>
      <svg width="100%" height="60">
        <line x1="8%" y1="30" x2="86%" y2="30" stroke="#e2e8f0" strokeWidth="2"/>
        {nodes.map((n,i)=><g key={i}><circle cx={`${n.x}%`} cy="30" r="14" fill={n.color} opacity="0.12"/><circle cx={`${n.x}%`} cy="30" r="9" fill={n.color}/><text x={`${n.x}%`} y="52" textAnchor="middle" fontSize="8" fill="#94a3b8">{n.label}</text></g>)}
        <circle cx={`${8+(pos/100)*78}%`} cy="30" r="5" fill="#fff" stroke="#6366f1" strokeWidth="2"/>
      </svg>
    </div>
  );
}

// ── MAIN APP ──
export default function App() {
  const [loggedIn,setLoggedIn]=useState(false);
  const [screen,setScreen]=useState("name");
  const [name,setName]=useState("");
  const [nameInput,setNameInput]=useState("");
  const [activeModule,setActiveModule]=useState(null);

  if(!loggedIn) return <LoginScreen onLogin={()=>setLoggedIn(true)}/>;

  const openModule=(mod)=>{ setActiveModule(mod.id); setScreen("module"); };

  const mod=MODULES.find(m=>m.id===activeModule);
  const SimComponent=activeModule?MODULE_SIMS[activeModule]:null;

  if(screen==="name") return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"system-ui,sans-serif"}}>
      <div style={{maxWidth:420,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:"2.5rem",marginBottom:12}}>👋</div>
        <h2 style={{color:"#f1f5f9",fontSize:"1.5rem",fontWeight:700,marginBottom:8}}>Welcome! What's your name?</h2>
        <p style={{color:"#94a3b8",marginBottom:28,fontSize:"0.9rem"}}>Your tutor will personalise your learning journey</p>
        <input placeholder="Enter your first name..." value={nameInput} onChange={e=>setNameInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&nameInput.trim()&&(setName(nameInput.trim()),setScreen("hub"))}
          style={{width:"100%",padding:"13px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)",color:"#e2e8f0",fontSize:"1.1rem",outline:"none",boxSizing:"border-box",marginBottom:12,textAlign:"center"}} autoFocus/>
        <button onClick={()=>nameInput.trim()&&(setName(nameInput.trim()),setScreen("hub"))} style={{width:"100%",padding:13,borderRadius:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontWeight:700,fontSize:"1rem",border:"none",cursor:"pointer"}}>Enter the Hub →</button>
        <button onClick={()=>setLoggedIn(false)} style={{marginTop:10,background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:"0.85rem"}}>← Sign out</button>
      </div>
    </div>
  );

  if(screen==="hub") return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e1b4b)",padding:"14px 20px",display:"flex",alignItems:"center",gap:12}}>
        <div><div style={{color:"#f1f5f9",fontWeight:700}}>Networking Learning Hub</div><div style={{color:"#64748b",fontSize:"0.75rem"}}>Welcome, {name}</div></div>
        <button onClick={()=>setScreen("name")} style={{marginLeft:"auto",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"#94a3b8",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:"0.75rem"}}>Switch User</button>
        <button onClick={()=>{setLoggedIn(false);setScreen("name");setName("");}} style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:"0.75rem"}}>Sign Out</button>
      </div>
      <div style={{maxWidth:740,margin:"0 auto",padding:"24px 16px"}}>
        <PacketFlow/>
        <h2 style={{fontSize:"1.3rem",fontWeight:700,color:"#0f172a",margin:"0 0 5px"}}>Choose a Module, {name}</h2>
        <p style={{color:"#64748b",fontSize:"0.9rem",marginBottom:20}}>Each module has a live network simulator with real-world explanations.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>
          {MODULES.map(m=>(
            <div key={m.id} onClick={()=>openModule(m)}
              style={{background:"#fff",borderRadius:16,padding:"18px 16px",cursor:"pointer",border:`1px solid #e2e8f0`,transition:"all 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 20px ${m.color}30`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)";}}>
              <div style={{width:40,height:40,borderRadius:12,background:`${m.color}18`,border:`1px solid ${m.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:m.color,marginBottom:10}}>M{m.id}</div>
              <div style={{fontWeight:700,fontSize:"0.9rem",color:"#0f172a",marginBottom:3}}>{m.title}</div>
              <div style={{fontSize:"0.78rem",color:"#64748b",marginBottom:10}}>{m.desc}</div>
              <span style={{fontSize:9,background:`${m.color}15`,color:m.color,borderRadius:4,padding:"2px 6px",fontWeight:600}}>SIMULATOR</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── MODULE SCREEN ──
  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",background:"#f8fafc"}}>
      <div style={{background:mod?`linear-gradient(135deg,${mod.color}e0,${mod.color}90)`:"linear-gradient(135deg,#0f172a,#1e1b4b)",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={()=>setScreen("hub")} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:"0.8rem"}}>← Hub</button>
        {mod&&<div style={{fontWeight:700,color:"#fff",fontSize:"0.95rem"}}>Module {mod.id}: {mod.title}</div>}
      </div>
      <div style={{flex:1,overflow:"auto",padding:14,display:"flex",flexDirection:"column"}}>
        {SimComponent&&<SimComponent/>}
        {activeModule&&<InfoPanel moduleId={activeModule} color={mod?.color||"#6366f1"}/>}
      </div>
    </div>
  );
}
