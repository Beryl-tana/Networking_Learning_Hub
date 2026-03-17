import { useState, useEffect, useRef } from "react";

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

const FAULT_SCENARIOS = {
  1: [
    {
      title: "PC has no network access — nothing loads",
      symptom: "A user calls: 'My PC can't get online at all. Was fine yesterday.' The network icon shows no connection.",
      clues: [
        "Layer 1: Run ping 127.0.0.1 → succeeds (NIC is alive). Check the switch port LED for the PC — it is OFF. No link light.",
        "Layer 2: Run ipconfig → IP is 169.254.x.x (APIPA). DHCP never ran because there was no physical link to run it on.",
        "Physical inspection: the RJ45 cable is half-pulled out of the PC's NIC port. No cable seated = no electrical signal = no bits."
      ],
      answer: "Physical layer fault (Layer 1). The cable is unseated. Without a physical connection, DHCP can't run, ARP can't run — nothing can. Fix: Reseat or replace the patch cable until the clip clicks. The LED comes on, DHCP auto-assigns an IP, connectivity restored in seconds.",
      layer: "Physical (Layer 1)",
      brokenLinkIdx: 0
    },
    {
      title: "Frames reach the switch but the server is unreachable",
      symptom: "PC can ping the switch and other LAN devices. But the server (93.184.216.34) is completely unreachable — requests just time out.",
      clues: [
        "Run: ping 192.168.1.1 (the router) → Request timed out. Yet ipconfig shows correct gateway. Something between router and server is broken.",
        "Run: traceroute 93.184.216.34 → first hop (the router) is unreachable from the server side. Layer 1/2 between PC and switch is fine.",
        "Inspect the network diagram — the link between router and server is broken (red). The router has no physical path to forward packets onward."
      ],
      answer: "Network layer fault (Layer 3). The link between router and server is severed. PC→Switch is fine (Layer 1/2 OK). Router has nowhere to forward packets destined for 93.184.216.34. Fix: Restore the physical link between router and server, then verify the routing table has the correct route.",
      layer: "Network (Layer 3)",
      brokenLinkIdx: 2
    }
  ],
  2: [
    {
      title: "PC1 can reach local devices but not the server",
      symptom: "PC1 can ping PC2 (10.0.0.11) successfully. But all attempts to reach the Server (172.16.0.20) time out completely.",
      clues: [
        "Run ipconfig on PC1 → IP: 10.0.0.10/24, Default Gateway: 10.0.0.99. The router's actual IP is 10.0.0.1.",
        "Run: ping 10.0.0.1 (the actual router) → succeeds! But PC1 is configured to route inter-network traffic via 10.0.0.99 — an IP that doesn't exist.",
        "PC1 sends packets for 172.16.0.20 to gateway 10.0.0.99. No device claims that IP. ARP gets no reply. Packets dropped silently."
      ],
      answer: "Wrong default gateway (Layer 3). PC1's gateway is misconfigured as 10.0.0.99 instead of 10.0.0.1. Same-subnet traffic (PC2) works via direct ARP. Cross-network traffic fails because the gateway is unreachable. Fix: Correct the default gateway to 10.0.0.1 on PC1, or fix the DHCP server to hand out the correct gateway.",
      layer: "Network (Layer 3)",
      brokenLinkIdx: 0
    },
    {
      title: "Server is intermittently unreachable from both PCs",
      symptom: "Both PC1 and PC2 randomly lose connectivity to the server every few minutes. The server itself logs no errors.",
      clues: [
        "Run: arp -a on the router → the server's IP (172.16.0.20) shows TWO different MAC addresses, alternating every few minutes.",
        "A new device was recently connected to Network B and given static IP 172.16.0.20 — the same as the server.",
        "When the new device ARP-broadcasts, the router updates its table to the new device's MAC. All traffic goes to the wrong host until the server broadcasts again."
      ],
      answer: "IP address conflict (Layer 3). Two devices share IP 172.16.0.20. The ARP table oscillates between their MACs causing intermittent packet delivery to the wrong host. Fix: Change the new device to an unused IP. Configure DHCP exclusions for any statically-assigned addresses to prevent future conflicts.",
      layer: "Network (Layer 3)",
      brokenLinkIdx: 2
    }
  ],
  3: [
    {
      title: "HTTP sites fail but HTTPS sites load fine",
      symptom: "https://google.com loads perfectly. But the internal intranet at http://intranet.local returns 'Connection refused' every time.",
      clues: [
        "Run: telnet intranet.local 443 → connects. Run: telnet intranet.local 80 → Connection refused immediately.",
        "Review firewall rules → TCP port 443 (HTTPS): ALLOW. TCP port 80 (HTTP): BLOCK.",
        "The firewall between client and server is dropping all TCP port 80 traffic. Port 443 passes freely."
      ],
      answer: "Firewall blocking TCP port 80 (Layer 4 — Transport). The firewall has an explicit BLOCK rule for HTTP. The intranet only serves HTTP on port 80. Fix: Add a firewall rule to ALLOW TCP port 80, or reconfigure the intranet server to use HTTPS on port 443.",
      layer: "Transport (Layer 4) — Firewall",
      brokenLinkIdx: 1
    },
    {
      title: "Browser spins forever — no error, no response",
      symptom: "Client tries to open a connection to the web server. The browser just spins indefinitely. No error message, no timeout for 2 minutes.",
      clues: [
        "Run: ping 93.184.216.34 → replies successfully. ICMP is allowed, network path exists.",
        "Packet capture: TCP SYN leaves the client, passes the firewall, arrives at the server — but zero SYN-ACK ever returns.",
        "Check the server's host firewall: rule 'DROP all inbound TCP' was added by an admin last week with no exceptions."
      ],
      answer: "Server host firewall dropping inbound TCP (Layer 4). Ping works (ICMP allowed) so the network path is fine. But TCP's 3-way handshake can never complete — the server silently drops the SYN. The client waits indefinitely for a SYN-ACK. Fix: Add an inbound host firewall rule: ALLOW TCP [required port] inbound on the server.",
      layer: "Transport (Layer 4) — Host Firewall",
      brokenLinkIdx: 1
    }
  ],
  4: [
    {
      title: "Can ping IPs directly but domain names don't resolve",
      symptom: "ping 8.8.8.8 works fine. But ping google.com returns 'could not find host google.com'. All web browsing is broken.",
      clues: [
        "Run: nslookup google.com → 'DNS request timed out'. The DNS server is not responding to queries.",
        "Check router DNS config → DNS server is set to 192.168.1.50, a device removed from the network last week.",
        "Run: nslookup google.com 8.8.8.8 → returns 142.250.4.100 immediately. Internet works, only the configured DNS is broken."
      ],
      answer: "DNS server unreachable (Application Layer — DNS). The configured DNS server (192.168.1.50) no longer exists on the network. Raw IP connectivity is fine but name resolution fails completely. Fix: Update the DNS setting to a working resolver — 8.8.8.8, 1.1.1.1, or the router's own IP if it forwards DNS.",
      layer: "Application (Layer 5 — DNS)",
      brokenLinkIdx: 1
    },
    {
      title: "New laptop gets 169.254.x.x and can't access anything",
      symptom: "A new laptop joins the office WiFi. It shows IP 169.254.x.x and cannot reach any resource. Every other device works perfectly.",
      clues: [
        "Run: ipconfig /release then /renew → DHCP Discover is broadcast but times out every single attempt. No offer arrives.",
        "Other devices have valid 192.168.1.x addresses and full connectivity — the network itself is fine.",
        "Check router DHCP status → Scope 192.168.1.2–254 (253 addresses). All leases show ACTIVE. Pool is 100% exhausted."
      ],
      answer: "DHCP pool exhausted (Application Layer — DHCP). All available IP addresses are leased. Many belong to laptops that left the office but still hold 24-hour leases. New device gets no offer and falls back to APIPA (169.254.x.x). Fix: Reduce lease time to 8 hours so addresses reclaim faster, expand the subnet, or add a DHCP exclusion cleanup for stale leases.",
      layer: "Application (Layer 5 — DHCP)",
      brokenLinkIdx: 0
    }
  ],
  5: [
    {
      title: "WiFi drops for ~10 seconds every few minutes",
      symptom: "The whole office WiFi disconnects briefly at irregular intervals. Wired ethernet connections are completely unaffected.",
      clues: [
        "All office devices are on 2.4GHz. The kitchen 5 metres away has a commercial microwave used frequently through the day.",
        "WiFi analyser during a drop: signal strength unchanged, but signal-to-noise ratio (SNR) spikes sharply during microwave cooking cycles.",
        "2.4GHz WiFi and microwave ovens both operate at 2.4–2.5 GHz. Microwave shielding is imperfect and bleeds RF energy onto the band."
      ],
      answer: "RF interference from microwave oven (Physical Layer — Wireless). Microwaves operate at 2.45 GHz and emit broadband RF interference that overwhelms 2.4GHz WiFi signals. 5GHz is completely immune. Fix: Move devices to 5GHz. For 2.4GHz-only devices, switch to channel 1 or 11 to reduce overlap with the interference peak.",
      layer: "Physical (Layer 1 — RF/Wireless)",
      brokenLinkIdx: 1
    },
    {
      title: "Great signal strength but internet is nearly unusable",
      symptom: "Laptop is 1 metre from the router showing 5 bars, but pages take 20+ seconds to load and video calls drop constantly.",
      clues: [
        "WiFi scan (inSSIDer): 9 neighbouring networks visible. 7 of them are on 2.4GHz channel 6 — same channel as your router.",
        "Switch the laptop to 5GHz manually → speeds jump from ~2 Mbps to 180 Mbps instantly on the same router.",
        "2.4GHz channel 6 is saturated with competing traffic. All devices on the same channel must share airtime and retry collisions."
      ],
      answer: "2.4GHz channel congestion (Physical Layer — Wireless). Strong signal means nothing if the channel is saturated. Every nearby network on the same channel competes for airtime. Fix: Switch to 5GHz (far less congested). If 2.4GHz is required, change to channel 1 or 11 (non-overlapping). WiFi 6 (802.11ax) handles congestion far better with OFDMA.",
      layer: "Physical (Layer 1 — Wireless)",
      brokenLinkIdx: 1
    }
  ],
  6: [
    {
      title: "'I can't get online at all' — helpdesk call",
      symptom: "First call of the day: 'My PC was working fine yesterday, now nothing works. No websites, no shared drive, nothing at all.'",
      clues: [
        "Layer 1: ping 127.0.0.1 → succeeds (NIC alive). Look at the switch port LED for the PC → LED is completely OFF. No physical link.",
        "Layer 2: ipconfig → IP is 169.254.43.21 (APIPA). DHCP never ran because there was no physical layer to run it on.",
        "Physical check: ethernet cable behind the user's desk was knocked loose when they moved their monitor this morning. Cable is half-unplugged."
      ],
      answer: "Physical layer failure (Layer 1). Dislodged cable — no electrical signal on the wire, switch and NIC both report no link. Without Layer 1, every other layer fails. Fix: Reseat the cable firmly until the clip clicks. Switch LED lights up, DHCP runs automatically, IP assigned within seconds. Key lesson: always start at the bottom (Physical) and work up.",
      layer: "Physical (Layer 1)",
      brokenLinkIdx: 0
    },
    {
      title: "Some websites load — internal systems all fail",
      symptom: "User can access google.com and youtube.com. But the company intranet, ticketing system, and file server all return 'Server not found'.",
      clues: [
        "Run: ping intranet.company.com → 'could not find host'. Run: ping 10.5.0.1 (intranet IP directly) → replies! Server is up, name resolution is failing.",
        "Run: nslookup intranet.company.com → query goes to 8.8.8.8 (Google DNS). Response: NXDOMAIN — Google has no record for this internal name.",
        "Check PC DNS: primary DNS is 8.8.8.8. The internal DNS server at 10.0.0.2 holds all company domain records but is never being queried."
      ],
      answer: "DNS misconfiguration (Application Layer). PC uses public DNS (8.8.8.8) which has no knowledge of internal domain names. Public internet resolves fine. Internal names fail. Fix: Set primary DNS to the internal server (10.0.0.2). The internal DNS server handles company domains and conditionally forwards public queries to 8.8.8.8.",
      layer: "Application (Layer 5 — DNS)",
      brokenLinkIdx: 2
    }
  ]
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
      return { x: d.x+(d.w||40), y: d.y+(d.h||40) };
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

function NetSimCanvas({ devices: initialDevices, links: initialLinks, packets, label, desc, color="#6366f1", faultScenarios=[] }) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState(null);
  const [devPositions, setDevPositions] = useState(() => {
    const map = {};
    initialDevices.forEach(d => { map[d.id] = { x: d.x, y: d.y }; });
    return map;
  });
  const [addedDevices, setAddedDevices] = useState([]);
  const [troubleshootMode, setTroubleshootMode] = useState(false);
  const [brokenLink, setBrokenLink] = useState(null);
  const [fixedLinks, setFixedLinks] = useState([]);
  const [faultScenarioIdx, setFaultScenarioIdx] = useState(0);
  const [revealedClues, setRevealedClues] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const dragRef = useRef(null);
  const didDragRef = useRef(false);
  const svgRef = useRef(null);

  const devices = [
    ...initialDevices.map(d => ({ ...d, x: devPositions[d.id]?.x ?? d.x, y: devPositions[d.id]?.y ?? d.y })),
    ...addedDevices.map(d => ({ ...d, x: devPositions[d.id]?.x ?? d.x, y: devPositions[d.id]?.y ?? d.y })),
  ];
  const devMap = {};
  devices.forEach(d => { devMap[d.id] = d; });

  const activeLinks = initialLinks.map((lk, i) => ({
    ...lk,
    broken: troubleshootMode && i === brokenLink && !fixedLinks.includes(i),
  }));

  const handleSvgMouseMove = (e) => {
    if (!dragRef.current) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = 700 / rect.width;
    const scaleY = 380 / rect.height;
    const dx = (e.clientX - dragRef.current.startX) * scaleX;
    const dy = (e.clientY - dragRef.current.startY) * scaleY;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    didDragRef.current = true;
    const id = dragRef.current.id;
    setDevPositions(prev => {
      const old = prev[id] ?? { x: 0, y: 0 };
      return { ...prev, [id]: { x: Math.max(0, Math.min(610, old.x + dx)), y: Math.max(0, Math.min(290, old.y + dy)) } };
    });
  };

  const handleSvgMouseUp = () => { dragRef.current = null; };

  const addDevice = (type) => {
    const id = `added_${type}_${Date.now()}`;
    const clrs = { router:"#f59e0b", pc:"#6366f1", switch:"#10b981", server:"#0ea5e9" };
    const newDev = { id, type, label: type.charAt(0).toUpperCase()+type.slice(1), x: 300, y: 150, ip: "0.0.0.0", role: "Added device", color: clrs[type]||"#64748b" };
    setAddedDevices(prev => [...prev, newDev]);
    setDevPositions(prev => ({ ...prev, [id]: { x: 300, y: 150 } }));
  };

  const activateTroubleshoot = () => {
    if (faultScenarios.length > 0) {
      const idx = Math.floor(Math.random() * faultScenarios.length);
      setFaultScenarioIdx(idx);
      setBrokenLink(faultScenarios[idx].brokenLinkIdx);
    } else if (initialLinks.length > 0) {
      setBrokenLink(Math.floor(Math.random() * initialLinks.length));
    } else { return; }
    setFixedLinks([]);
    setRevealedClues([]);
    setShowAnswer(false);
    setTroubleshootMode(true);
    setRunning(false);
  };

  const positions = usePacketAnim(devices, packets, running && !paused, speed);
  const restart = () => { setRunning(false); setTimeout(() => setRunning(true), 50); setPaused(false); };

  return (
    <div style={{background:"#e8edf2",borderRadius:14,overflow:"hidden",border:"1px solid #d1d9e0",height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{background:"#1e293b",padding:"7px 12px",display:"flex",alignItems:"center",gap:6,flexShrink:0,flexWrap:"wrap"}}>
        <button onClick={restart} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700}}>↺</button>
        <button onClick={()=>setPaused(p=>!p)} disabled={!running} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#64748b",color:"#fff",cursor:"pointer",fontSize:11,opacity:running?1:0.4}}>{paused?"▶":"⏸"}</button>
        <button onClick={restart} style={{width:28,height:28,borderRadius:"50%",border:"none",background:running&&!paused?"#10b981":"#475569",color:"#fff",cursor:"pointer",fontSize:11}}>▶</button>
        <button onClick={()=>setSpeed(s=>s===1?2:s===2?3:1)} style={{width:28,height:28,borderRadius:"50%",border:"none",background:color,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:10}}>{speed}x</button>
        <div style={{width:1,height:18,background:"rgba(255,255,255,0.15)",margin:"0 2px"}}/>
        {["router","pc","switch"].map(t=>(
          <button key={t} onClick={()=>addDevice(t)}
            style={{height:24,padding:"0 8px",borderRadius:6,border:"none",background:"#334155",color:"#94a3b8",cursor:"pointer",fontSize:10,fontWeight:600}}>
            + {t}
          </button>
        ))}
        <div style={{width:1,height:18,background:"rgba(255,255,255,0.15)",margin:"0 2px"}}/>
        <button
          onClick={troubleshootMode ? ()=>{setTroubleshootMode(false);setBrokenLink(null);setFixedLinks([]);setRevealedClues([]);setShowAnswer(false);} : activateTroubleshoot}
          style={{height:24,padding:"0 9px",borderRadius:6,border:"none",background:troubleshootMode?"#f59e0b":"#7c3aed",color:"#fff",cursor:"pointer",fontSize:10,fontWeight:600}}>
          {troubleshootMode ? "Exit Fault" : "🔧 Fault Mode"}
        </button>
        <span style={{color:"#475569",fontSize:9,marginLeft:"auto"}}>Drag devices · Click to inspect</span>
      </div>
      {troubleshootMode && (
        <div style={{background:"rgba(124,58,237,0.12)",borderBottom:"1px solid rgba(124,58,237,0.2)",padding:"4px 14px",fontSize:10,color:"#c4b5fd",display:"flex",alignItems:"center",gap:8}}>
          <span>🔧 <b>Fault Mode active.</b> Investigate using the panel → then click the red ✕ to fix it.</span>
          {fixedLinks.length > 0 && <span style={{color:"#86efac",fontWeight:700}}>✅ Network restored!</span>}
        </div>
      )}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div style={{flex:1,position:"relative",overflow:"hidden"}}>
          <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 700 380"
            style={{position:"absolute",top:0,left:0}}
            onMouseMove={handleSvgMouseMove} onMouseUp={handleSvgMouseUp} onMouseLeave={handleSvgMouseUp}>
            {Array.from({length:13},(_,r)=>Array.from({length:24},(_,c)=>(
              <circle key={`${r}-${c}`} cx={c*30+15} cy={r*30+15} r="1.5" fill="#c8d3dc" opacity="0.6"/>
            )))}
            {activeLinks.map((lk,i)=>{
              const a=devMap[lk.from]; const b=devMap[lk.to];
              if(!a||!b) return null;
              const ax=a.x+40, ay=a.y+40, bx=b.x+40, by=b.y+40;
              return (
                <g key={i} onClick={()=>{ if(troubleshootMode && lk.broken) setFixedLinks(prev=>[...prev,i]); }} style={{cursor:lk.broken?"pointer":"default"}}>
                  <line x1={ax} y1={ay} x2={bx} y2={by}
                    stroke={lk.broken?"#ef4444":"#94a3b8"} strokeWidth={lk.broken?3:2.5}
                    strokeDasharray={lk.broken?"8 4":lk.dashed?"6 3":"none"} opacity="0.9"/>
                  {lk.broken && <text x={(ax+bx)/2} y={(ay+by)/2-10} textAnchor="middle" fontSize="18" fill="#ef4444">✕</text>}
                </g>
              );
            })}
            {devices.map(dev=>{
              const isSel = selected?.id === dev.id;
              const dc = dev.color || color;
              return (
                <g key={dev.id}
                  onMouseDown={(e)=>{ e.preventDefault(); didDragRef.current=false; dragRef.current={id:dev.id,startX:e.clientX,startY:e.clientY}; }}
                  onClick={()=>{ if(didDragRef.current){didDragRef.current=false;return;} setSelected(isSel?null:dev); }}
                  style={{cursor:"grab"}}>
                  {isSel && <circle cx={dev.x+40} cy={dev.y+40} r="50" fill={dc} opacity="0.1"/>}
                  <foreignObject x={dev.x} y={dev.y} width="80" height="80">
                    <div xmlns="http://www.w3.org/1999/xhtml" style={{transform:isSel?"scale(1.1)":"scale(1)",transition:"transform 0.15s",transformOrigin:"center",pointerEvents:"none",userSelect:"none"}}>
                      <DeviceIcon type={dev.type} size={72} color={isSel ? dc : (dev.color||"#475569")}/>
                    </div>
                  </foreignObject>
                  <text x={dev.x+40} y={dev.y+92} textAnchor="middle" fontSize="12" fontWeight={isSel?"700":"500"} fill={isSel?dc:"#334155"} style={{pointerEvents:"none",userSelect:"none"}}>{dev.label}</text>
                </g>
              );
            })}
            {Object.entries(positions).map(([id,p])=>p.visible&&(
              <g key={id}>
                <circle cx={p.x} cy={p.y} r="12" fill={p.color} opacity="0.2"/>
                <circle cx={p.x} cy={p.y} r="7" fill={p.color}/>
                <text x={p.x} y={p.y-14} textAnchor="middle" fontSize="9" fontWeight="700" fill={p.color}>{p.label}</text>
              </g>
            ))}
          </svg>
          {!running && (
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(232,237,242,0.88)"}}>
              <div style={{fontSize:12,color:"#64748b",marginBottom:10,textAlign:"center",padding:"0 20px"}}>{desc}</div>
              <button onClick={restart} style={{padding:"10px 24px",borderRadius:10,background:color,color:"#fff",fontWeight:700,fontSize:"0.9rem",border:"none",cursor:"pointer"}}>▶ Start Simulation</button>
            </div>
          )}
        </div>
        <div style={{width: troubleshootMode && faultScenarios.length > 0 ? 210 : 155, background:"#fff",borderLeft:"1px solid #e2e8f0",overflowY:"auto",fontSize:11,flexShrink:0}}>
          {troubleshootMode && faultScenarios.length > 0 ? (() => {
            const sc = faultScenarios[faultScenarioIdx];
            if (!sc) return null;
            return (
              <div style={{padding:"8px 9px",height:"100%",boxSizing:"border-box",display:"flex",flexDirection:"column",gap:6}}>
                <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:7,padding:"6px 8px"}}>
                  <div style={{fontSize:8,fontWeight:700,color:"#dc2626",textTransform:"uppercase",marginBottom:2}}>🔴 Fault Report</div>
                  <div style={{fontSize:10,fontWeight:700,color:"#1e293b",lineHeight:1.3,marginBottom:4}}>{sc.title}</div>
                  <div style={{fontSize:9,color:"#64748b",lineHeight:1.5}}>{sc.symptom}</div>
                </div>
                <div style={{fontSize:8,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.07em"}}>🔍 Investigate</div>
                {sc.clues.map((clue,i)=>(
                  <div key={i}>
                    {revealedClues.includes(i) ? (
                      <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:6,padding:"5px 7px",fontSize:9,color:"#0369a1",lineHeight:1.5}}>
                        <b>Clue {i+1}:</b> {clue}
                      </div>
                    ) : (
                      <button onClick={()=>setRevealedClues(prev=>[...prev,i])}
                        style={{width:"100%",padding:"4px 7px",borderRadius:6,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#475569",cursor:"pointer",fontSize:9,textAlign:"left",fontWeight:600}}>
                        🔍 Reveal Clue {i+1}
                      </button>
                    )}
                  </div>
                ))}
                <div style={{marginTop:"auto",display:"flex",flexDirection:"column",gap:4}}>
                  {!showAnswer ? (
                    <button onClick={()=>setShowAnswer(true)}
                      style={{width:"100%",padding:"5px 0",borderRadius:6,border:"none",background:"#7c3aed",color:"#fff",fontWeight:700,fontSize:9,cursor:"pointer"}}>
                      Reveal Answer
                    </button>
                  ) : (
                    <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:7,padding:"6px 8px"}}>
                      <div style={{fontSize:8,fontWeight:700,color:"#065f46",marginBottom:3}}>✅ Root Cause & Fix</div>
                      <div style={{fontSize:9,color:"#064e3b",lineHeight:1.5,marginBottom:4}}>{sc.answer}</div>
                      <div style={{fontSize:8,color:"#10b981",fontWeight:700}}>{sc.layer}</div>
                    </div>
                  )}
                  {fixedLinks.length>0&&<div style={{background:"#ecfdf5",border:"1px solid #86efac",borderRadius:6,padding:"4px 7px",fontSize:9,color:"#166534",fontWeight:700,textAlign:"center"}}>✅ Network restored!</div>}
                  <button onClick={()=>{
                    const next=(faultScenarioIdx+1)%faultScenarios.length;
                    setFaultScenarioIdx(next);
                    setBrokenLink(faultScenarios[next].brokenLinkIdx);
                    setFixedLinks([]);setRevealedClues([]);setShowAnswer(false);setRunning(false);
                  }} style={{width:"100%",padding:"4px 0",borderRadius:6,border:"1px solid #e2e8f0",background:"transparent",color:"#64748b",fontSize:9,cursor:"pointer",fontWeight:600}}>
                    Next Scenario ({faultScenarioIdx+1}/{faultScenarios.length})
                  </button>
                </div>
              </div>
            );
          })() : selected ? (
            <div style={{padding:10}}>
              <button onClick={()=>setSelected(null)} style={{fontSize:10,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",marginBottom:6,padding:0}}>← back</button>
              <div style={{fontWeight:700,color:selected.color||color,marginBottom:7,fontSize:12}}>{selected.label}</div>
              {[["Type",selected.type],["IP",selected.ip||"N/A"],["Role",selected.role||"—"]].map(([k,v])=>(
                <div key={k} style={{background:"#f8fafc",borderRadius:6,padding:"4px 7px",marginBottom:5}}>
                  <div style={{color:"#94a3b8",fontSize:9}}>{k}</div>
                  <div style={{fontWeight:600,color:"#0f172a",fontFamily:k==="IP"?"monospace":"inherit",fontSize:10}}>{v}</div>
                </div>
              ))}
              {selected.info && <div style={{marginTop:6,background:`${selected.color||color}12`,borderRadius:6,padding:"5px 7px",color:"#475569",lineHeight:1.5,fontSize:10}}>{selected.info}</div>}
            </div>
          ) : (
            <div style={{padding:10}}>
              <div style={{fontWeight:700,color:"#0f172a",marginBottom:5,fontSize:12}}>{label}</div>
              <div style={{color:"#64748b",lineHeight:1.5,marginBottom:8,fontSize:10}}>{desc}</div>
              <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Packets</div>
              {packets.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                  <span style={{color:"#475569",fontSize:10}}><b>{p.label}</b> {devMap[p.from]?.label}→{devMap[p.to]?.label}</span>
                </div>
              ))}
              <div style={{marginTop:10,padding:"7px 8px",background:"#f8fafc",borderRadius:7,fontSize:9,color:"#94a3b8",lineHeight:1.5}}>
                Drag devices to rearrange. Add devices with the toolbar above.
              </div>
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
    {id:"pc",type:"pc",label:"Your PC",x:40,y:150,ip:"192.168.1.10",role:"Sender",color:"#6366f1",info:"Originates data. Encapsulates through all 5 layers before sending."},
    {id:"sw",type:"switch",label:"Switch",x:205,y:225,ip:"N/A",role:"Layer 2 device",color:"#10b981",info:"Reads MAC addresses (Layer 2 only). Forwards frames within the LAN."},
    {id:"router",type:"router",label:"Router",x:385,y:150,ip:"192.168.1.1",role:"Layer 3 device",color:"#f59e0b",info:"Reads IP addresses (Layer 3). Routes packets between different networks."},
    {id:"srv",type:"server",label:"Server",x:545,y:225,ip:"93.184.216.34",role:"Receiver",color:"#8b5cf6",info:"Receives the frame and decapsulates through all layers back to the original data."},
  ];
  const links=[{from:"pc",to:"sw"},{from:"sw",to:"router"},{from:"router",to:"srv"}];
  const packets=[
    {id:"p1",from:"pc",to:"srv",via:["sw","router"],color:"#6366f1",label:"Frame"},
    {id:"p2",from:"srv",to:"pc",via:["router","sw"],color:"#f59e0b",label:"ACK"},
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,height:"100%"}}>
      <div style={{height:340,flexShrink:0}}>
        <NetSimCanvas devices={devices} links={links} packets={packets} label="Network Devices" desc="See how data flows through a switch and router." color="#6366f1" faultScenarios={FAULT_SCENARIOS[1]}/>
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
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:8}}>Physical & Data Link Layers</div>
          <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Cable Types (Physical Layer)</div>
          {[
            {name:"Cat5e",speed:"1 Gbps",color:"#6366f1",note:"Standard twisted pair — home & office"},
            {name:"Cat6",speed:"10 Gbps",color:"#8b5cf6",note:"Better shielding, shorter 10G range"},
            {name:"Fibre",speed:"100 Gbps+",color:"#0ea5e9",note:"Light pulses through glass — long distance"},
            {name:"Coaxial",speed:"Legacy",color:"#94a3b8",note:"Used in older cable TV/broadband"},
          ].map((c,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 8px",borderRadius:7,marginBottom:4,background:`${c.color}0d`,border:`1px solid ${c.color}30`}}>
              <div style={{width:44,textAlign:"center",fontWeight:800,fontSize:9,color:c.color}}>{c.name}</div>
              <div style={{width:44,textAlign:"center",fontSize:9,fontWeight:700,color:"#0f172a"}}>{c.speed}</div>
              <div style={{fontSize:9,color:"#64748b",flex:1}}>{c.note}</div>
            </div>
          ))}
          <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",margin:"10px 0 6px"}}>Hub vs Switch</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
            {[["Hub","Broadcasts to ALL ports. Creates one big collision domain. Obsolete.","#f59e0b"],["Switch","Learns MAC table. Sends only to the correct port. Modern standard.","#10b981"]].map(([name,desc,clr])=>(
              <div key={name} style={{background:`${clr}0d`,border:`1px solid ${clr}30`,borderRadius:8,padding:"7px 8px"}}>
                <div style={{fontWeight:700,fontSize:11,color:clr,marginBottom:3}}>{name}</div>
                <div style={{fontSize:9,color:"#64748b",lineHeight:1.5}}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>ARP — Address Resolution Protocol</div>
          {[
            {step:"1",text:"PC wants to send to 192.168.1.1 but needs its MAC address"},
            {step:"2",text:"Broadcasts: 'Who has 192.168.1.1? Tell 192.168.1.10'"},
            {step:"3",text:"Router replies: '192.168.1.1 is at AA:BB:CC:DD:EE:FF'"},
            {step:"4",text:"PC caches the result and sends the Ethernet frame"},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:6,marginBottom:4,alignItems:"flex-start"}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:"#6366f1",color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{s.step}</div>
              <div style={{fontSize:10,color:"#475569",lineHeight:1.5}}>{s.text}</div>
            </div>
          ))}
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
    {id:"pc2",type:"laptop",label:"PC 2",x:30,y:265,ip:"10.0.0.11",role:"Host — Network A",color:"#6366f1",info:"Same /24 subnet as PC1. Direct communication possible without a router."},
    {id:"router",type:"router",label:"Router",x:270,y:175,ip:"10.0.0.1 / 172.16.0.1",role:"Default Gateway",color:"#f59e0b",info:"Connects Network A to Network B. Maintains a routing table to forward packets."},
    {id:"srv1",type:"server",label:"Server",x:500,y:100,ip:"172.16.0.20",role:"Host — Network B",color:"#0ea5e9",info:"In Network B (172.16.0.x /24). Needs the router to receive packets from PC1."},
    {id:"srv2",type:"server",label:"PC 3",x:500,y:265,ip:"172.16.0.21",role:"Host — Network B",color:"#0ea5e9",info:"Same subnet as Server. Can communicate with Server directly."},
  ];
  const links=[{from:"pc1",to:"router"},{from:"pc2",to:"router"},{from:"router",to:"srv1"},{from:"router",to:"srv2"}];
  const packets=[
    {id:"p1",from:"pc1",to:"srv1",via:["router"],color:"#6366f1",label:"Packet"},
    {id:"p2",from:"srv1",to:"pc1",via:["router"],color:"#0ea5e9",label:"Reply"},
  ];
  const netBits=subnetVis; const hostBits=32-netBits; const hosts=Math.pow(2,hostBits)-2;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10,height:"100%"}}>
      <div style={{height:340,flexShrink:0}}>
        <NetSimCanvas devices={devices} links={links} packets={packets} label="Routing Between Networks" desc="Watch packets route between two IP networks via a router." color="#0ea5e9" faultScenarios={FAULT_SCENARIOS[2]}/>
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
            {[["Network bits",netBits,"#e0f2fe","#0369a1"],["Host bits",hostBits,"#ecfdf5","#065f46"],["Usable hosts",hosts.toLocaleString(),"#fffbeb","#92400e"]].map(([lbl,val,bg,tc])=>(
              <div key={lbl} style={{flex:1,background:bg,borderRadius:5,padding:"4px 6px",textAlign:"center"}}>
                <div style={{fontSize:9,color:tc}}>{lbl}</div>
                <div style={{fontWeight:700,color:tc,fontSize:11}}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:"#64748b"}}>/{subnetVis} means first {netBits} bits = network, remaining {hostBits} bits = hosts.</div>
        </div>
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:8}}>Routing Table</div>
          <div style={{fontSize:10,color:"#64748b",marginBottom:8}}>Routers forward packets by matching destination IP against the routing table (most specific match wins).</div>
          <div style={{overflowX:"auto",marginBottom:10}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}>
              <thead>
                <tr style={{background:"#f8fafc"}}>
                  {["Destination","Mask","Next Hop","Interface"].map(h=>(
                    <th key={h} style={{padding:"4px 6px",textAlign:"left",color:"#64748b",fontWeight:700,borderBottom:"1px solid #e2e8f0",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["10.0.0.0","/24","Direct","eth0","#6366f1"],
                  ["172.16.0.0","/24","Direct","eth1","#0ea5e9"],
                  ["192.168.5.0","/24","10.0.0.254","eth0","#10b981"],
                  ["0.0.0.0","/0","203.0.113.1","eth1","#f59e0b"],
                ].map(([dest,mask,hop,iface,clr],i)=>(
                  <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                    <td style={{padding:"4px 6px",fontFamily:"monospace",color:clr,fontWeight:700}}>{dest}</td>
                    <td style={{padding:"4px 6px",fontFamily:"monospace",color:"#475569"}}>{mask}</td>
                    <td style={{padding:"4px 6px",fontFamily:"monospace",color:"#334155"}}>{hop}</td>
                    <td style={{padding:"4px 6px",fontFamily:"monospace",color:"#64748b"}}>{iface}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{fontSize:9,color:"#64748b",marginBottom:10}}>0.0.0.0/0 = <b>default route</b> — catch-all when no specific match exists.</div>
          <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Static vs Dynamic Routing</div>
          {[
            {name:"Static",color:"#6366f1",desc:"Manually configured by admin. Simple, predictable, no overhead. Used for small/stub networks."},
            {name:"Dynamic (RIP/OSPF/BGP)",color:"#10b981",desc:"Routers share routes automatically. Adapts to failures. OSPF = enterprise LAN, BGP = internet backbone."},
          ].map((r,i)=>(
            <div key={i} style={{padding:"7px 9px",borderRadius:8,background:`${r.color}0d`,border:`1px solid ${r.color}30`,marginBottom:6}}>
              <div style={{fontWeight:700,fontSize:10,color:r.color,marginBottom:3}}>{r.name}</div>
              <div style={{fontSize:9,color:"#64748b",lineHeight:1.5}}>{r.desc}</div>
            </div>
          ))}
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
    {id:"client",type:"pc",label:"Client",x:40,y:140,ip:"192.168.1.10",role:"Initiates TCP connection",color:"#6366f1",info:"Starts the handshake with SYN. Must complete 3-way handshake before data can flow."},
    {id:"fw",type:"router",label:"Firewall",x:295,y:180,ip:"10.0.0.1",role:"Packet filter",color:"#ef4444",info:"Inspects packets by port. Allows 443 (HTTPS), blocks 23 (Telnet)."},
    {id:"server",type:"server",label:"Web Server",x:545,y:140,ip:"93.184.216.34",role:"Listens on port 443",color:"#10b981",info:"LISTENING on port 443. Responds to SYN with SYN-ACK to accept the connection."},
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
      <div style={{height:320,flexShrink:0}}>
        <NetSimCanvas devices={devices} links={links} packets={packets} label="TCP Connection Flow" desc="Watch a full TCP handshake then data transfer through a firewall." color="#10b981" faultScenarios={FAULT_SCENARIOS[3]}/>
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
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:8}}>UDP & Application Layer</div>
          <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>TCP vs UDP</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:10}}>
            {[
              ["TCP","#10b981",["Connection-oriented","3-way handshake","Guaranteed delivery","In-order packets","Slower overhead","HTTP, FTP, SSH, SMTP"]],
              ["UDP","#f59e0b",["Connectionless","No handshake","Best-effort delivery","No ordering guarantee","Low overhead","DNS, DHCP, VoIP, video"]],
            ].map(([name,clr,pts])=>(
              <div key={name} style={{background:`${clr}0d`,border:`1px solid ${clr}30`,borderRadius:8,padding:"7px 8px"}}>
                <div style={{fontWeight:800,fontSize:12,color:clr,marginBottom:5,textAlign:"center"}}>{name}</div>
                {pts.map((pt,i)=><div key={i} style={{fontSize:9,color:"#475569",marginBottom:2,display:"flex",alignItems:"flex-start",gap:4}}><span style={{color:clr,flexShrink:0}}>•</span>{pt}</div>)}
              </div>
            ))}
          </div>
          <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Application Layer Protocols</div>
          {[
            {proto:"HTTP / HTTPS",port:"80 / 443",color:"#6366f1",use:"Web pages. HTTPS = encrypted with TLS/SSL."},
            {proto:"DNS",port:"53 UDP",color:"#f59e0b",use:"Resolves domain names to IP addresses."},
            {proto:"SMTP",port:"25 / 587",color:"#ec4899",use:"Sending email between servers."},
            {proto:"IMAP / POP3",port:"993 / 995",color:"#0ea5e9",use:"Reading email from a mail server."},
            {proto:"FTP / SFTP",port:"21 / 22",color:"#10b981",use:"File transfer. SFTP uses SSH encryption."},
            {proto:"SSH",port:"22",color:"#8b5cf6",use:"Encrypted remote terminal access."},
          ].map((p,i)=>(
            <div key={i} style={{display:"flex",gap:7,padding:"5px 8px",borderRadius:7,marginBottom:4,background:`${p.color}0d`,border:`1px solid ${p.color}25`}}>
              <div style={{width:70,fontWeight:700,fontSize:9,color:p.color,flexShrink:0}}>{p.proto}</div>
              <div style={{width:42,fontFamily:"monospace",fontSize:9,color:"#94a3b8",flexShrink:0}}>{p.port}</div>
              <div style={{fontSize:9,color:"#64748b"}}>{p.use}</div>
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
    {id:"client",type:"pc",label:"Your PC",x:30,y:170,ip:"192.168.1.10",role:"DHCP Client",color:"#6366f1",info:"Gets IP via DHCP. Sends DNS queries to resolve domain names before connecting."},
    {id:"router",type:"router",label:"Home Router",x:185,y:170,ip:"192.168.1.1",role:"DHCP Server + NAT",color:"#f59e0b",info:"Assigns IPs to local devices (DHCP). Translates private IPs to public IP (NAT)."},
    {id:"isp",type:"server",label:"ISP Resolver",x:365,y:90,ip:"203.0.113.1",role:"DNS Resolver",color:"#0ea5e9",info:"Your ISP's DNS resolver. Caches frequently requested domains to speed up responses."},
    {id:"dns",type:"server",label:"Auth DNS",x:535,y:90,ip:"8.8.8.8",role:"Authoritative DNS",color:"#10b981",info:"Returns the definitive IP address for a domain name."},
    {id:"web",type:"server",label:"Web Server",x:535,y:260,ip:"142.250.4.100",role:"Destination",color:"#ec4899",info:"The server hosting the website. Responds to HTTP/HTTPS requests."},
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
      <div style={{height:340,flexShrink:0}}>
        <NetSimCanvas devices={devices} links={links} packets={packets} label="DNS + DHCP + NAT" desc="Watch a full web request — DNS lookup, NAT translation, HTTP response." color="#f59e0b" faultScenarios={FAULT_SCENARIOS[4]}/>
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
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:8}}>VPNs & Proxies</div>
          <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>VPN — Virtual Private Network</div>
          <div style={{fontSize:10,color:"#64748b",marginBottom:7,lineHeight:1.5}}>Creates an <b>encrypted tunnel</b> over the public internet so traffic looks like it comes from the VPN server, not your device.</div>
          {[
            {type:"Site-to-Site VPN",color:"#6366f1",desc:"Connects two office networks permanently over the internet. Employees in Branch A can access servers in HQ as if they were local."},
            {type:"Client VPN (Remote Access)",color:"#8b5cf6",desc:"Individual user connects their device to the company network. Used by remote workers. Common protocols: OpenVPN, WireGuard, IPSec."},
            {type:"Split Tunneling",color:"#0ea5e9",desc:"Only traffic for the corporate network goes through the VPN. Regular browsing goes direct — saves bandwidth."},
          ].map((v,i)=>(
            <div key={i} style={{padding:"7px 9px",borderRadius:8,background:`${v.color}0d`,border:`1px solid ${v.color}30`,marginBottom:6}}>
              <div style={{fontWeight:700,fontSize:10,color:v.color,marginBottom:3}}>{v.type}</div>
              <div style={{fontSize:9,color:"#64748b",lineHeight:1.5}}>{v.desc}</div>
            </div>
          ))}
          <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",margin:"10px 0 6px"}}>Proxies</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {[
              ["Forward Proxy","#f59e0b","Client → Proxy → Internet","Sits in front of clients. Used for web filtering, caching, anonymity. Your school or company likely uses one."],
              ["Reverse Proxy","#10b981","Internet → Proxy → Servers","Sits in front of servers. Used for load balancing, SSL termination, CDN. Nginx & HAProxy are examples."],
            ].map(([name,clr,flow,desc])=>(
              <div key={name} style={{background:`${clr}0d`,border:`1px solid ${clr}30`,borderRadius:8,padding:"7px 8px"}}>
                <div style={{fontWeight:700,fontSize:10,color:clr,marginBottom:2}}>{name}</div>
                <div style={{fontFamily:"monospace",fontSize:8,color:"#94a3b8",marginBottom:4}}>{flow}</div>
                <div style={{fontSize:9,color:"#64748b",lineHeight:1.5}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MODULE 5 ──
function Mod5Sim() {
  const devices=[
    {id:"phone",type:"phone",label:"Phone",x:30,y:80,ip:"192.168.1.5",role:"WiFi 5GHz client",color:"#ec4899",info:"Connected on 5GHz. Fast speeds, shorter range. Uses 802.11ax (WiFi 6)."},
    {id:"laptop",type:"laptop",label:"Laptop",x:30,y:260,ip:"192.168.1.6",role:"WiFi 2.4GHz client",color:"#6366f1",info:"Connected on 2.4GHz. Slower but better range through walls."},
    {id:"router",type:"router",label:"WiFi Router",x:210,y:165,ip:"192.168.1.1",role:"Access Point + Router",color:"#f59e0b",info:"Broadcasts 2.4GHz and 5GHz simultaneously. Routes traffic to ISP."},
    {id:"modem",type:"server",label:"ISP Modem",x:400,y:165,ip:"203.0.113.1",role:"WAN Gateway",color:"#0ea5e9",info:"Connects your home network to your ISP. Handles WAN protocol translation."},
    {id:"isp",type:"cloud",label:"Internet",x:545,y:145,ip:"WAN",role:"The Internet",color:"#64748b",info:"The global internet. Your packets traverse multiple routers to reach servers worldwide."},
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
      <div style={{height:340,flexShrink:0}}>
        <NetSimCanvas devices={devices} links={links} packets={packets} label="Home Network to Internet" desc="See how WiFi devices connect through your router and ISP to the internet." color="#ec4899" faultScenarios={FAULT_SCENARIOS[5]}/>
      </div>
      <div style={{flex:1,display:"flex",gap:10,minHeight:0}}>
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:7}}>2.4 GHz vs 5 GHz</div>
          {[["Range","████████","█████"],["Speed","████","████████"],["Congestion","High","Low"],["Wall penetration","Better","Weaker"]].map(([lbl,v24,v5],i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:3,marginBottom:5,alignItems:"center"}}>
              <div style={{fontSize:10,fontWeight:600,color:"#475569"}}>{lbl}</div>
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
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:4}}>WAN / Broadband Types</div>
          <div style={{padding:"6px 9px",borderRadius:8,background:"#fef3c7",border:"1px solid #fcd34d",marginBottom:7}}>
            <div style={{fontWeight:700,fontSize:10,color:"#92400e",marginBottom:2}}>📞 POTS & Dial-up (Historical)</div>
            <div style={{fontSize:9,color:"#78350f",lineHeight:1.5}}>Plain Old Telephone System — analog copper lines. Dial-up modems reached max <b>56 Kbps</b>. Required a phone call to connect; you couldn't use the phone while online. Dominated the 1990s ("You've Got Mail" era). Now obsolete, replaced by always-on broadband.</div>
          </div>
          {wanTypes.map((w,i)=>(
            <div key={i} style={{display:"flex",gap:8,padding:"7px 9px",borderRadius:9,marginBottom:6,background:`${w.color}0e`,border:`1px solid ${w.color}30`}}>
              <div style={{width:32,height:32,borderRadius:8,background:w.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{w.icon}</div>
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
    {id:"pc",type:"pc",label:"Your PC",x:40,y:165,ip:"169.254.x.x",role:"Troubleshooting target",color:"#ef4444",info:"APIPA address (169.254.x.x) detected. DHCP failed — the PC couldn't get an IP from the router."},
    {id:"sw",type:"switch",label:"Switch",x:210,y:240,ip:"N/A",role:"Layer 2",color:"#10b981",info:"Check all port LEDs. A dark LED = no physical link on that port."},
    {id:"router",type:"router",label:"Router",x:390,y:165,ip:"192.168.1.1",role:"Default Gateway + DHCP",color:"#f59e0b",info:"Is it powered on? Can other devices get IPs? Try rebooting it first."},
    {id:"isp",type:"server",label:"ISP",x:560,y:165,ip:"WAN",role:"Internet",color:"#64748b",info:"If router works but internet is down, the issue is with your ISP — call them."},
  ];
  const links=[{from:"pc",to:"sw"},{from:"sw",to:"router"},{from:"router",to:"isp"}];
  const packets=[
    {id:"p1",from:"pc",to:"router",via:["sw"],color:"#ef4444",label:"DHCP?"},
    {id:"p2",from:"router",to:"pc",via:["sw"],color:"#10b981",label:"IP!"},
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10,height:"100%"}}>
      <div style={{height:340,flexShrink:0}}>
        <NetSimCanvas devices={devices} links={links} packets={packets} label="Network Fault Scenario" desc="A PC has an APIPA address (169.254.x.x). Diagnose the fault bottom-up." color="#ef4444" faultScenarios={FAULT_SCENARIOS[6]}/>
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
        <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:12,overflowY:"auto"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0f172a",marginBottom:8}}>The Cloud & IPv6</div>
          <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Cloud Service Models</div>
          {[
            {name:"IaaS",full:"Infrastructure as a Service",color:"#6366f1",ex:"AWS EC2, Azure VMs, Google Compute",desc:"Rent raw compute, storage, networking. You manage the OS and everything above."},
            {name:"PaaS",full:"Platform as a Service",color:"#f59e0b",ex:"Heroku, Google App Engine, Azure App Service",desc:"Rent a managed platform. Deploy code without managing servers or OS."},
            {name:"SaaS",full:"Software as a Service",color:"#10b981",ex:"Gmail, Office 365, Salesforce, Zoom",desc:"Use software over the internet. No installation, no servers — just a browser."},
          ].map((c,i)=>(
            <div key={i} style={{padding:"7px 9px",borderRadius:8,background:`${c.color}0d`,border:`1px solid ${c.color}30`,marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <div style={{width:32,height:20,borderRadius:4,background:c.color,color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{c.name}</div>
                <div style={{fontWeight:700,fontSize:10,color:"#0f172a"}}>{c.full}</div>
              </div>
              <div style={{fontSize:9,color:"#64748b",marginBottom:2}}>{c.desc}</div>
              <div style={{fontSize:9,fontFamily:"monospace",color:c.color}}>e.g. {c.ex}</div>
            </div>
          ))}
          <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",margin:"10px 0 6px"}}>IPv6</div>
          <div style={{padding:"7px 9px",borderRadius:8,background:"#f0f9ff",border:"1px solid #bae6fd",marginBottom:6}}>
            <div style={{fontFamily:"monospace",fontSize:10,color:"#0369a1",fontWeight:700,marginBottom:3}}>2001:0db8:85a3::8a2e:0370:7334</div>
            <div style={{fontSize:9,color:"#64748b"}}>128-bit address (vs IPv4's 32-bit). Written as 8 groups of 4 hex digits. <b>::</b> compresses consecutive zeros.</div>
          </div>
          {[
            ["Why IPv6?","IPv4 only has ~4.3 billion addresses. With billions of devices, we ran out. IPv6 has 340 undecillion addresses."],
            ["::1","Loopback address (same as 127.0.0.1 in IPv4)"],
            ["Dual-Stack","Devices run IPv4 and IPv6 simultaneously during the transition period — most networks today."],
            ["DNS tools","nslookup google.com · dig google.com · ipconfig /flushdns (clear cache)"],
          ].map(([k,v],i)=>(
            <div key={i} style={{display:"flex",gap:6,marginBottom:5}}>
              <div style={{fontWeight:700,fontSize:9,color:"#0ea5e9",minWidth:70,flexShrink:0}}>{k}</div>
              <div style={{fontSize:9,color:"#475569",lineHeight:1.5}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoPanel({ moduleId, color }) {
  const info = MODULE_INFO[moduleId];
  if (!info) return null;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div>
        <div style={{fontWeight:700,fontSize:11,color:color,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.07em",display:"flex",alignItems:"center",gap:5}}>
          <span>⚙</span> What's Happening
        </div>
        <div style={{fontSize:12,color:"#475569",lineHeight:1.7,background:"#f8fafc",borderRadius:10,padding:"10px 12px",border:`1px solid ${color}25`}}>{info.whatHappens}</div>
      </div>
      <div>
        <div style={{fontWeight:700,fontSize:11,color:color,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.07em",display:"flex",alignItems:"center",gap:5}}>
          <span>🌍</span> Real-World Example
        </div>
        <div style={{fontSize:12,color:"#475569",lineHeight:1.7,background:`${color}08`,borderRadius:10,padding:"10px 12px",border:`1px solid ${color}30`}}>{info.realExample}</div>
      </div>
    </div>
  );
}

const MODULE_SIMS = {1:Mod1Sim,2:Mod2Sim,3:Mod3Sim,4:Mod4Sim,5:Mod5Sim,6:Mod6Sim};

// ── LOGIN ──
function LoginScreen({ onLogin }) {
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [err,setErr]=useState(""); const [shake,setShake]=useState(false);
  const attempt=()=>{
    if(u.trim().toLowerCase()===LOGIN_USERNAME.toLowerCase()&&p.trim()===LOGIN_PASSWORD) onLogin();
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
  const [loggedIn,setLoggedIn]=useState(()=>localStorage.getItem("nh_auth")==="1");
  const [screen,setScreen]=useState(()=>localStorage.getItem("nh_name")?"hub":"name");
  const [name,setName]=useState(()=>localStorage.getItem("nh_name")||"");
  const [nameInput,setNameInput]=useState("");
  const [activeModule,setActiveModule]=useState(null);

  if(!loggedIn) return <LoginScreen onLogin={()=>{localStorage.setItem("nh_auth","1");setLoggedIn(true);}}/>;

  const openModule=(mod)=>{ setActiveModule(mod.id); setScreen("module"); };
  const mod=MODULES.find(m=>m.id===activeModule);
  const SimComponent=activeModule?MODULE_SIMS[activeModule]:null;

  if(screen==="name") return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"system-ui,sans-serif"}}>
      <div style={{maxWidth:420,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:"2.5rem",marginBottom:12}}>👋</div>
        <h2 style={{color:"#f1f5f9",fontSize:"1.5rem",fontWeight:700,marginBottom:8}}>Welcome! What's your name?</h2>
        <p style={{color:"#94a3b8",marginBottom:28,fontSize:"0.9rem"}}>Personalise your learning journey</p>
        <input placeholder="Enter your first name..." value={nameInput} onChange={e=>setNameInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&nameInput.trim()&&(localStorage.setItem("nh_name",nameInput.trim()),setName(nameInput.trim()),setScreen("hub"))}
          style={{width:"100%",padding:"13px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)",color:"#e2e8f0",fontSize:"1.1rem",outline:"none",boxSizing:"border-box",marginBottom:12,textAlign:"center"}} autoFocus/>
        <button onClick={()=>nameInput.trim()&&(localStorage.setItem("nh_name",nameInput.trim()),setName(nameInput.trim()),setScreen("hub"))} style={{width:"100%",padding:13,borderRadius:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontWeight:700,fontSize:"1rem",border:"none",cursor:"pointer"}}>Enter the Hub →</button>
        <button onClick={()=>{localStorage.removeItem("nh_auth");localStorage.removeItem("nh_name");setLoggedIn(false);}} style={{marginTop:10,background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:"0.85rem"}}>← Sign out</button>
      </div>
    </div>
  );

  if(screen==="hub") return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e1b4b)",padding:"14px 20px",display:"flex",alignItems:"center",gap:12}}>
        <div><div style={{color:"#f1f5f9",fontWeight:700}}>Networking Learning Hub</div><div style={{color:"#64748b",fontSize:"0.75rem"}}>Welcome, {name}</div></div>
        <button onClick={()=>setScreen("name")} style={{marginLeft:"auto",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"#94a3b8",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:"0.75rem"}}>Switch User</button>
        <button onClick={()=>{localStorage.removeItem("nh_auth");localStorage.removeItem("nh_name");setLoggedIn(false);setScreen("name");setName("");}} style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:"0.75rem"}}>Sign Out</button>
      </div>
      <div style={{maxWidth:740,margin:"0 auto",padding:"24px 16px"}}>
        <PacketFlow/>
        <h2 style={{fontSize:"1.3rem",fontWeight:700,color:"#0f172a",margin:"0 0 5px"}}>Choose a Module, {name}</h2>
        <p style={{color:"#64748b",fontSize:"0.9rem",marginBottom:20}}>Each module has a live network simulator with real-world explanations.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>
          {MODULES.map(m=>(
            <div key={m.id} onClick={()=>openModule(m)}
              style={{background:"#fff",borderRadius:16,padding:"18px 16px",cursor:"pointer",border:"1px solid #e2e8f0",transition:"all 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}
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

  // ── MODULE SCREEN — two-column layout ──
  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",background:"#f8fafc"}}>
      <div style={{background:mod?`linear-gradient(135deg,${mod.color}e0,${mod.color}90)`:"linear-gradient(135deg,#0f172a,#1e1b4b)",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={()=>setScreen("hub")} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:"0.8rem"}}>← Hub</button>
        {mod&&<div style={{fontWeight:700,color:"#fff",fontSize:"0.95rem"}}>Module {mod.id}: {mod.title}</div>}
      </div>
      <div style={{flex:1,overflow:"hidden",display:"flex"}}>
        <div style={{flex:1,overflow:"auto",padding:14,display:"flex",flexDirection:"column"}}>
          {SimComponent&&<SimComponent/>}
        </div>
        <div style={{width:290,background:"#fff",borderLeft:"1px solid #e2e8f0",overflow:"auto",padding:18,flexShrink:0}}>
          {mod&&(
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:mod.color,flexShrink:0}}/>
              <div style={{fontWeight:700,color:"#0f172a",fontSize:13}}>{mod.title}</div>
            </div>
          )}
          {activeModule&&<InfoPanel moduleId={activeModule} color={mod?.color||"#6366f1"}/>}
        </div>
      </div>
    </div>
  );
}
