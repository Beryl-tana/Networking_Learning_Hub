import { useState, useEffect, useRef } from "react";

const LOGIN_USERNAME = "Tana training";
const LOGIN_PASSWORD = "Tanatraining@2026";

const IT_LOGIN_USERNAME = "IT Support";
const IT_LOGIN_PASSWORD = "ITSupport@2026";

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
        "Physical inspection: the RJ45 cable is half-pulled out of the PC's NIC port. No cable seated = no electrical signal = no bits."
      ],
      answer: "Physical layer fault (Layer 1). The cable is unseated. Without a physical connection, DHCP can't run, ARP can't run — nothing can. Fix: Reseat or replace the patch cable until the clip clicks. The LED comes on, DHCP auto-assigns an IP, connectivity restored in seconds.",
      layer: "Physical (Layer 1)",
      keywords: ["cable", "physical", "layer 1", "unplugged", "led", "apipa"],
      brokenLinkIdx: 0
    },
    {
      title: "Frames reach the switch but the server is unreachable",
      symptom: "PC can ping the switch and other LAN devices. But the server (93.184.216.34) is completely unreachable — requests just time out.",
      clues: [
        "Inspect the network diagram — the link between router and server is broken (red). The router has no physical path to forward packets onward."
      ],
      answer: "Network layer fault (Layer 3). The link between router and server is severed. PC→Switch is fine (Layer 1/2 OK). Router has nowhere to forward packets destined for 93.184.216.34. Fix: Restore the physical link between router and server, then verify the routing table has the correct route.",
      layer: "Network (Layer 3)",
      keywords: ["layer 3", "routing", "route", "network", "link", "router"],
      brokenLinkIdx: 2
    },
    {
      title: "All devices on the LAN lose packets randomly",
      symptom: "Multiple users report their connections are slow and unstable at the same time. Video calls drop, file transfers stall. The problem affects everyone simultaneously.",
      clues: ["Run: ping 192.168.1.1 -n 20 → shows 40% packet loss on all devices at the same time. Check the network diagram — a hub is being used instead of a switch."],
      answer: "Hub causing collision domain saturation (Layer 2). A hub broadcasts every frame to all ports — every device sees every packet. As traffic increases, collisions multiply and throughput collapses. Fix: Replace the hub with a switch. A switch learns MAC addresses and forwards frames only to the correct port, eliminating collisions entirely.",
      layer: "Data Link (Layer 2)",
      keywords: ["hub", "switch", "collision", "layer 2", "broadcast"],
      brokenLinkIdx: 1
    },
    {
      title: "PC can reach some LAN devices but not others on the same subnet",
      symptom: "PC A can ping the router and PC B. But PC C on the exact same /24 subnet gets 'Request timed out' even though its cable LED is green.",
      clues: ["Run: arp -a on PC A → PC C's IP does not appear. Run: arp -a on PC C → PC A does not appear either. The two PCs have never exchanged an ARP frame."],
      answer: "ARP failure (Layer 2). Before any IP communication, ARP must resolve the destination IP to a MAC address. If ARP is blocked (by a VLAN, port security, or misconfigured switch ACL), devices can never communicate even with correct IPs and cables. Fix: Check switch port security settings and VLAN assignments — PC A and PC C must be on the same VLAN for direct Layer 2 communication.",
      layer: "Data Link (Layer 2)",
      keywords: ["arp", "mac", "layer 2", "vlan", "address"],
      brokenLinkIdx: 0
    }
  ],
  2: [
    {
      title: "PC1 can reach local devices but not the server",
      symptom: "PC1 can ping PC2 (10.0.0.11) successfully. But all attempts to reach the Server (172.16.0.20) time out completely.",
      clues: [
        "PC1 sends packets for 172.16.0.20 to gateway 10.0.0.99. No device claims that IP. ARP gets no reply. Packets dropped silently."
      ],
      answer: "Wrong default gateway (Layer 3). PC1's gateway is misconfigured as 10.0.0.99 instead of 10.0.0.1. Same-subnet traffic (PC2) works via direct ARP. Cross-network traffic fails because the gateway is unreachable. Fix: Correct the default gateway to 10.0.0.1 on PC1, or fix the DHCP server to hand out the correct gateway.",
      layer: "Network (Layer 3)",
      keywords: ["gateway", "default gateway", "misconfigured", "wrong", "10.0.0.1"],
      brokenLinkIdx: 0
    },
    {
      title: "Server is intermittently unreachable from both PCs",
      symptom: "Both PC1 and PC2 randomly lose connectivity to the server every few minutes. The server itself logs no errors.",
      clues: [
        "When the new device ARP-broadcasts, the router updates its table to the new device's MAC. All traffic goes to the wrong host until the server broadcasts again."
      ],
      answer: "IP address conflict (Layer 3). Two devices share IP 172.16.0.20. The ARP table oscillates between their MACs causing intermittent packet delivery to the wrong host. Fix: Change the new device to an unused IP. Configure DHCP exclusions for any statically-assigned addresses to prevent future conflicts.",
      layer: "Network (Layer 3)",
      keywords: ["conflict", "duplicate", "same ip", "arp", "ip address"],
      brokenLinkIdx: 2
    },
    {
      title: "Device reaches local LAN but internet is completely unreachable",
      symptom: "A PC can ping all local devices (192.168.1.x) without any issues. But every attempt to reach the internet — any external IP or website — fails completely.",
      clues: ["Run: ipconfig → Default Gateway shows 0.0.0.0 (blank). The DHCP server handed out an IP and subnet but did not include a gateway option."],
      answer: "Missing default gateway (Layer 3). Without a default gateway the device has no path to send packets destined for external networks. Local (same-subnet) traffic works because it doesn't need a gateway. Fix: Configure the DHCP server to include the correct gateway option (option 3), or set the gateway manually on the device.",
      layer: "Network (Layer 3)",
      keywords: ["gateway", "default gateway", "missing", "dhcp", "external"],
      brokenLinkIdx: 0
    },
    {
      title: "Traceroute shows packets looping between two routers forever",
      symptom: "Users can't reach a remote server. Running traceroute shows the same two hop IPs repeating over and over until TTL expires.",
      clues: ["Run: traceroute to destination → hop 5 and hop 6 keep alternating (10.0.0.1 → 10.0.1.1 → 10.0.0.1 → 10.0.1.1...). Both routers have a route pointing to each other for the destination network."],
      answer: "Routing loop (Layer 3). Both routers believe the destination is reachable via the other router, creating a loop. Packets bounce between them until their TTL reaches 0 and they are dropped. Fix: Correct the routing tables so only one router has the correct next-hop for the destination. Use a routing protocol like OSPF to prevent manual misconfiguration, or add a null route as a last resort.",
      layer: "Network (Layer 3)",
      keywords: ["routing loop", "loop", "traceroute", "ttl", "routing table"],
      brokenLinkIdx: 2
    }
  ],
  3: [
    {
      title: "HTTP sites fail but HTTPS sites load fine",
      symptom: "https://google.com loads perfectly. But the internal intranet at http://intranet.local returns 'Connection refused' every time.",
      clues: [
        "Review firewall rules → TCP port 443 (HTTPS): ALLOW. TCP port 80 (HTTP): BLOCK."
      ],
      answer: "Firewall blocking TCP port 80 (Layer 4 — Transport). The firewall has an explicit BLOCK rule for HTTP. The intranet only serves HTTP on port 80. Fix: Add a firewall rule to ALLOW TCP port 80, or reconfigure the intranet server to use HTTPS on port 443.",
      layer: "Transport (Layer 4) — Firewall",
      keywords: ["port 80", "http", "firewall", "blocked", "rule", "allow"],
      brokenLinkIdx: 1
    },
    {
      title: "Browser spins forever — no error, no response",
      symptom: "Client tries to open a connection to the web server. The browser just spins indefinitely. No error message, no timeout for 2 minutes.",
      clues: [
        "Check the server's host firewall: rule 'DROP all inbound TCP' was added by an admin last week with no exceptions."
      ],
      answer: "Server host firewall dropping inbound TCP (Layer 4). Ping works (ICMP allowed) so the network path is fine. But TCP's 3-way handshake can never complete — the server silently drops the SYN. The client waits indefinitely for a SYN-ACK. Fix: Add an inbound host firewall rule: ALLOW TCP [required port] inbound on the server.",
      layer: "Transport (Layer 4) — Host Firewall",
      keywords: ["firewall", "server", "inbound", "tcp", "syn", "drop"],
      brokenLinkIdx: 1
    },
    {
      title: "Video calls drop constantly but file downloads work fine",
      symptom: "Every video and voice call drops or breaks up badly. Meanwhile, downloading files and browsing websites works without any issues.",
      clues: ["Run: ping -n 50 8.8.8.8 → shows 0% packet loss but jitter varies from 2ms to 380ms. Video uses UDP — UDP has no retransmission, so jitter directly causes call quality degradation."],
      answer: "Network jitter affecting UDP traffic (Layer 4). TCP (used for downloads) handles jitter by buffering and retransmitting — so downloads appear fine. UDP (used for VoIP/video) has no recovery mechanism — jitter directly corrupts the call. Fix: Enable QoS (Quality of Service) on the router to prioritise UDP voice/video traffic. Investigate the source of jitter (often congested WAN link or misconfigured switch buffer).",
      layer: "Transport (Layer 4) — UDP/QoS",
      keywords: ["udp", "jitter", "tcp", "qos", "video", "voice"],
      brokenLinkIdx: 0
    },
    {
      title: "Connection succeeds but data transfer is extremely slow",
      symptom: "TCP connections establish instantly (handshake completes). But actual data transfer is painfully slow — 10KB/s on a 100Mbps link.",
      clues: ["Packet capture: TCP window size advertised by the receiver is 8192 bytes. The sender sends 8KB, then waits for ACK before sending more. The round-trip time is 80ms — so throughput is capped at ~100KB/s."],
      answer: "TCP receive window too small (Layer 4). TCP throughput = Window Size ÷ RTT. With an 8KB window and 80ms RTT, max throughput is only ~100KB/s regardless of link speed. Modern systems use TCP window scaling to advertise larger windows. Fix: Enable TCP window scaling (RFC 1323) on both endpoints, or increase the socket receive buffer size in the OS network stack.",
      layer: "Transport (Layer 4) — TCP Window",
      keywords: ["tcp", "window", "buffer", "throughput", "slow", "rtt"],
      brokenLinkIdx: 1
    }
  ],
  4: [
    {
      title: "Can ping IPs directly but domain names don't resolve",
      symptom: "ping 8.8.8.8 works fine. But ping google.com returns 'could not find host google.com'. All web browsing is broken.",
      clues: [
        "Run: nslookup google.com 8.8.8.8 → returns 142.250.4.100 immediately. Internet works, only the configured DNS is broken."
      ],
      answer: "DNS server unreachable (Application Layer — DNS). The configured DNS server (192.168.1.50) no longer exists on the network. Raw IP connectivity is fine but name resolution fails completely. Fix: Update the DNS setting to a working resolver — 8.8.8.8, 1.1.1.1, or the router's own IP if it forwards DNS.",
      layer: "Application (Layer 5 — DNS)",
      keywords: ["dns", "resolver", "name resolution", "nameserver", "domain"],
      brokenLinkIdx: 1
    },
    {
      title: "New laptop gets 169.254.x.x and can't access anything",
      symptom: "A new laptop joins the office WiFi. It shows IP 169.254.x.x and cannot reach any resource. Every other device works perfectly.",
      clues: [
        "Check router DHCP status → Scope 192.168.1.2–254 (253 addresses). All leases show ACTIVE. Pool is 100% exhausted."
      ],
      answer: "DHCP pool exhausted (Application Layer — DHCP). All available IP addresses are leased. Many belong to laptops that left the office but still hold 24-hour leases. New device gets no offer and falls back to APIPA (169.254.x.x). Fix: Reduce lease time to 8 hours so addresses reclaim faster, expand the subnet, or add a DHCP exclusion cleanup for stale leases.",
      layer: "Application (Layer 5 — DHCP)",
      keywords: ["dhcp", "pool", "exhausted", "lease", "apipa", "addresses"],
      brokenLinkIdx: 0
    },
    {
      title: "One specific device always gets the wrong IP address",
      symptom: "Every time a specific laptop connects to the network it receives IP 192.168.1.200 instead of a normal address from the pool. This IP conflicts with a printer.",
      clues: ["Check DHCP server reservations → the laptop's MAC address has a static reservation configured for 192.168.1.200, which is also the printer's static IP. The reservation was set up by a previous admin."],
      answer: "DHCP reservation conflict (Application Layer — DHCP). A DHCP reservation ties a specific MAC address to a specific IP permanently. The reserved IP was not excluded from the general pool and matches the printer's static address. Fix: Change the reservation to a different unused IP, or remove it and assign the laptop a unique static IP outside the DHCP pool range. Always exclude statically-assigned IPs from the DHCP scope.",
      layer: "Application (Layer 5 — DHCP)",
      keywords: ["dhcp", "reservation", "static", "conflict", "mac address"],
      brokenLinkIdx: 0
    },
    {
      title: "VPN connects successfully but internal resources are unreachable",
      symptom: "The VPN client connects and shows 'Connected'. But the user still cannot access the internal file server (10.5.0.10) or the company intranet.",
      clues: ["Run: ipconfig while VPN is connected → VPN adapter shows IP 10.8.0.5 but the default route still points to the local gateway (192.168.1.1), not the VPN tunnel. Split tunneling is routing only some traffic through VPN."],
      answer: "VPN split tunneling misconfiguration (Application/Network Layer). Split tunneling routes only specific subnets through the VPN. If the internal server subnet (10.5.0.0/24) is not included in the VPN routing policy, traffic to it bypasses the tunnel and goes to the internet — where it's unreachable. Fix: Add the corporate subnets to the VPN split tunnel include list, or disable split tunneling entirely to route all traffic through VPN.",
      layer: "Network (Layer 3) — VPN Routing",
      keywords: ["vpn", "split tunnel", "routing", "tunnel", "subnet"],
      brokenLinkIdx: 1
    }
  ],
  5: [
    {
      title: "WiFi drops for ~10 seconds every few minutes",
      symptom: "The whole office WiFi disconnects briefly at irregular intervals. Wired ethernet connections are completely unaffected.",
      clues: [
        "2.4GHz WiFi and microwave ovens both operate at 2.4–2.5 GHz. Microwave shielding is imperfect and bleeds RF energy onto the band."
      ],
      answer: "RF interference from microwave oven (Physical Layer — Wireless). Microwaves operate at 2.45 GHz and emit broadband RF interference that overwhelms 2.4GHz WiFi signals. 5GHz is completely immune. Fix: Move devices to 5GHz. For 2.4GHz-only devices, switch to channel 1 or 11 to reduce overlap with the interference peak.",
      layer: "Physical (Layer 1 — RF/Wireless)",
      keywords: ["microwave", "interference", "2.4", "rf", "frequency", "5ghz"],
      brokenLinkIdx: 1
    },
    {
      title: "Great signal strength but internet is nearly unusable",
      symptom: "Laptop is 1 metre from the router showing 5 bars, but pages take 20+ seconds to load and video calls drop constantly.",
      clues: [
        "2.4GHz channel 6 is saturated with competing traffic. All devices on the same channel must share airtime and retry collisions."
      ],
      answer: "2.4GHz channel congestion (Physical Layer — Wireless). Strong signal means nothing if the channel is saturated. Every nearby network on the same channel competes for airtime. Fix: Switch to 5GHz (far less congested). If 2.4GHz is required, change to channel 1 or 11 (non-overlapping). WiFi 6 (802.11ax) handles congestion far better with OFDMA.",
      layer: "Physical (Layer 1 — Wireless)",
      keywords: ["channel", "congestion", "2.4ghz", "5ghz", "overlap", "saturated"],
      brokenLinkIdx: 1
    },
    {
      title: "Laptop loses WiFi when moving between floors",
      symptom: "A user's laptop drops WiFi every time they walk from the ground floor to the first floor. They have to manually reconnect. Signal strength shows as excellent on both floors.",
      clues: ["WiFi scan: ground floor uses Access Point 1 (AP1) on channel 6. First floor uses AP2 also on channel 6. Both APs have separate SSIDs — the laptop can't roam automatically between them."],
      answer: "Poor WiFi roaming configuration (Physical/Layer 2). The APs use different SSIDs and the same channel. The laptop can't seamlessly hand off because there's no roaming protocol (802.11r fast roaming) configured. Fix: Configure both APs with the same SSID and use different non-overlapping channels (1 and 11). Enable 802.11r (fast BSS transition) on both APs so the client can roam without dropping the connection.",
      layer: "Physical (Layer 1) — WiFi Roaming",
      keywords: ["roaming", "access point", "ssid", "channel", "802.11r", "handoff"],
      brokenLinkIdx: 0
    },
    {
      title: "Device connects to WiFi but browser shows 'No internet'",
      symptom: "A phone connects to the office WiFi and gets a valid IP. But every website shows 'No internet connection'. Other devices on the same WiFi work fine.",
      clues: ["Run: ping 8.8.8.8 from the phone → Request timed out. Run: ping 192.168.1.1 (router) → replies fine. The device can reach the router but nothing beyond it."],
      answer: "Default gateway unreachable beyond the router (Layer 3). The device has a valid LAN IP and can reach the local router, but the router's WAN interface or ISP connection is not working for this specific device's traffic. Most likely: the DHCP server handed the device a wrong gateway IP, or the router has a MAC-based access control blocking this device from internet access. Fix: Check the router's client isolation or MAC filter settings. Verify the gateway IP matches the router's LAN IP exactly.",
      layer: "Network (Layer 3) — Gateway",
      keywords: ["gateway", "internet", "dhcp", "router", "mac filter"],
      brokenLinkIdx: 3
    }
  ],
  6: [
    {
      title: "'I can't get online at all' — helpdesk call",
      symptom: "First call of the day: 'My PC was working fine yesterday, now nothing works. No websites, no shared drive, nothing at all.'",
      clues: [
        "Physical check: ethernet cable behind the user's desk was knocked loose when they moved their monitor this morning. Cable is half-unplugged."
      ],
      answer: "Physical layer failure (Layer 1). Dislodged cable — no electrical signal on the wire, switch and NIC both report no link. Without Layer 1, every other layer fails. Fix: Reseat the cable firmly until the clip clicks. Switch LED lights up, DHCP runs automatically, IP assigned within seconds. Key lesson: always start at the bottom (Physical) and work up.",
      layer: "Physical (Layer 1)",
      keywords: ["cable", "physical", "layer 1", "unplugged", "led", "apipa"],
      brokenLinkIdx: 0
    },
    {
      title: "Some websites load — internal systems all fail",
      symptom: "User can access google.com and youtube.com. But the company intranet, ticketing system, and file server all return 'Server not found'.",
      clues: [
        "Check PC DNS: primary DNS is 8.8.8.8. The internal DNS server at 10.0.0.2 holds all company domain records but is never being queried."
      ],
      answer: "DNS misconfiguration (Application Layer). PC uses public DNS (8.8.8.8) which has no knowledge of internal domain names. Public internet resolves fine. Internal names fail. Fix: Set primary DNS to the internal server (10.0.0.2). The internal DNS server handles company domains and conditionally forwards public queries to 8.8.8.8.",
      layer: "Application (Layer 5 — DNS)",
      keywords: ["dns", "internal", "public", "name resolution", "8.8.8.8", "domain"],
      brokenLinkIdx: 2
    },
    {
      title: "Traceroute shows *** at one specific hop",
      symptom: "A user can't reach a remote server. Running traceroute shows successful hops 1–4, then three *** at hop 5, then successful hops again from hop 6 onwards.",
      clues: ["The *** means that router at hop 5 is not sending ICMP Time Exceeded replies back. Run: ping to the final destination — it succeeds. The remote server is actually reachable."],
      answer: "ICMP filtered at an intermediate router (not a real fault). *** in traceroute means that specific router has a firewall rule blocking outbound ICMP TTL Exceeded messages. This is common on ISP routers for security reasons. The end-to-end path is actually working fine — the server is reachable. Fix: No fix needed. If troubleshooting latency, use TCP-based traceroute (tracetcp) which may bypass the ICMP filter.",
      layer: "Application (Layer 5) — ICMP/Traceroute",
      keywords: ["traceroute", "icmp", "firewall", "hop", "ttl", "asterisk"],
      brokenLinkIdx: 2
    },
    {
      title: "User gets 'Destination host unreachable' — not 'Request timed out'",
      symptom: "When pinging a remote server, the user receives 'Destination host unreachable' immediately — not the usual 'Request timed out' after a wait.",
      clues: ["'Destination host unreachable' comes from a local router (not the destination). Run: ipconfig — gateway is 192.168.1.1. Run: ping 192.168.1.1 → replies. But the router has no route to the destination subnet and is returning an ICMP unreachable message."],
      answer: "Missing route on local router (Layer 3). 'Request timed out' means the packet was sent but no reply came back — likely a remote issue. 'Destination host unreachable' means a local device (usually your gateway router) is actively telling you it has no route to the destination. Fix: Add the missing route to the router's routing table. Check if the destination network is reachable via the correct next-hop interface.",
      layer: "Network (Layer 3) — Routing",
      keywords: ["unreachable", "route", "router", "icmp", "layer 3", "routing table"],
      brokenLinkIdx: 0
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

// ── IT SUPPORT DATA ──

const IT_MODULES = [
  { id:1, title:"Windows OS & Upgrades", color:"#3b82f6", bg:"#eff6ff", desc:"PC Health Check, SetupDiag & prereqs" },
  { id:2, title:"Event Viewer & Logs", color:"#6366f1", bg:"#eef2ff", desc:"Event IDs, CBS.log & SFC/DISM" },
  { id:3, title:"BIOS/UEFI & Hardware", color:"#f97316", bg:"#fff7ed", desc:"TPM, Secure Boot & WinRE" },
  { id:4, title:"Remote Support Tools", color:"#f43f5e", bg:"#fff1f2", desc:"Atera, AnyDesk & RDP" },
  { id:5, title:"Help Desk & Ticketing", color:"#14b8a6", bg:"#f0fdfa", desc:"Autotask, priorities & escalation" },
  { id:6, title:"Troubleshooting Method", color:"#64748b", bg:"#f8fafc", desc:"5-step process & documentation" },
];

const IT_SCENARIOS = {
  1: [
    { id:1, question:"You run PC Health Check on LAPTOP-047 and get the message: 'This PC can't run Windows 11.' The user says the machine is only 2 years old. What tools do you open first to diagnose which requirement is failing, and what are you looking for?", keywords:["tpm.msc","tpm","msinfo32","secure boot","pc health check"], correctAnswer:"Open tpm.msc to check TPM status — you need 'TPM Ready' with Specification Version 2.0. Open msinfo32 and check Secure Boot State (must be On) and BIOS Mode (must be UEFI). PC Health Check identifies the blocker; tpm.msc and msinfo32 confirm which requirement is failing.", topic:"PC Health Check Diagnostics" },
    { id:2, question:"DESKTOP-112 fails the Windows 11 upgrade at 47% and rolls back with error code 0xC1900101. What tool do you run next to find the specific cause, and what information does it give you?", keywords:["setupdiag","driverblock","driver","0xc1900101"], correctAnswer:"Run SetupDiag. It reads the upgrade logs and outputs a FailureRule — for 0xC1900101 this will typically be 'DriverBlock' with the name of the incompatible driver. Check the manufacturer's website for a Windows 11 compatible driver, or remove the device before retrying the upgrade.", topic:"Upgrade Error Diagnosis" },
    { id:3, question:"SetupDiag output on WS-055 shows: FailureRule: DiskSpaceBlockInDownLevel. Running 'dir C:\\' shows 24 GB free. What is the minimum space required and what steps do you take to free it up?", keywords:["64","cleanmgr","disk cleanup","storage sense","space"], correctAnswer:"Windows 11 requires a minimum of 64 GB free on C: during the upgrade. Run Disk Cleanup (cleanmgr) and select 'Clean up system files' to recover space. Enable Storage Sense in Settings. Clear the Downloads folder and empty the Recycle Bin. Document the before/after space in the Autotask ticket.", topic:"Disk Space Management" },
    { id:4, question:"A user asks you: 'How do I know if my PC can run Windows 11 before trying to upgrade?' What three tools or checks do you tell them to use, and what does each one verify?", keywords:["pc health check","tpm.msc","msinfo32","systeminfo"], correctAnswer:"1) PC Health Check Tool — gives an instant pass/fail verdict with the specific blocker. 2) tpm.msc — verifies TPM is present and shows Specification Version (need 2.0). 3) msinfo32 — shows BIOS Mode (need UEFI), Secure Boot State (need On), and processor/RAM details.", topic:"Windows 11 Prerequisites" },
    { id:5, question:"You type 'winver' on a machine and it shows Windows 10, Version 21H2, Build 19044. The user wants to upgrade to Windows 11. What command shows you the full hardware spec including RAM and processor type to assess eligibility?", keywords:["systeminfo","msinfo32","ram","processor","64-bit"], correctAnswer:"Run 'systeminfo' in Command Prompt — it shows Total Physical Memory (need 4 GB+), processor type (need 64-bit), OS version, and BIOS version. Also open msinfo32 for BIOS Mode and Secure Boot State. For a quick pass/fail result, run PC Health Check Tool which checks all requirements automatically.", topic:"Windows 11 Prerequisites" },
    { id:6, question:"After enabling fTPM in the BIOS Security settings, what must you do next to confirm the machine is now eligible for Windows 11, and what should tpm.msc show?", keywords:["tpm.msc","pc health check","tpm ready","specification version 2.0","rerun"], correctAnswer:"After enabling fTPM, restart the machine and open tpm.msc — it should now show 'The TPM is ready for use' with Specification Version: 2.0. Then rerun PC Health Check Tool to confirm the machine passes all Windows 11 requirements. Document the change in the Autotask ticket.", topic:"PC Health Check Diagnostics" },
    { id:7, question:"SetupDiag shows FailureRule: UninstallOnUpgrade and names the application 'OldAccountingApp v3.1'. The upgrade has failed twice. What is the correct fix and how do you prevent this issue in future?", keywords:["uninstall","incompatible","app","application","remove"], correctAnswer:"Uninstall OldAccountingApp v3.1 before retrying the upgrade — Windows 11 cannot upgrade while this incompatible application is installed. Check the software vendor's website for a Windows 11 compatible version. After uninstalling, retry the upgrade and document findings in the ticket.", topic:"Upgrade Error Diagnosis" },
    { id:8, question:"A machine's BIOS shows the setting 'fTPM: Disabled' in the Security tab. The user can access BIOS but doesn't know what to change. Walk through the exact steps to resolve this.", keywords:["enable","ftpm","bios","security","save","exit","restart"], correctAnswer:"In the BIOS Security tab, change fTPM (AMD) or PTT (Intel) from Disabled to Enabled. Save the BIOS settings (typically F10) and Exit. The machine will restart, TPM will initialise, and tpm.msc will now show 'TPM Ready' with Specification Version 2.0. Note: BIOS changes cannot be made remotely via Atera or AnyDesk.", topic:"BIOS/TPM Configuration" },
    { id:9, question:"PC Health Check fails but tpm.msc shows 'TPM Ready — Version 2.0' and Secure Boot is On. What remaining requirements could still be blocking the upgrade?", keywords:["ram","storage","64 gb","4 gb","processor","64-bit","disk"], correctAnswer:"With TPM 2.0 and Secure Boot confirmed, check: RAM (must be 4 GB+), storage (must have 64 GB+ free on C:), processor (must be 64-bit on the approved CPU list). Run 'systeminfo' to check RAM and processor. Run 'dir C:\\' for disk space. PC Health Check will state the specific failing requirement.", topic:"Windows 11 Prerequisites" },
    { id:10, question:"You are writing the Autotask resolution note for a completed Windows 11 upgrade. The machine was blocked by a disabled TPM. What key information must your resolution note contain?", keywords:["machine name","tpm","bios","resolution","autotask","upgrade","successful"], correctAnswer:"The resolution note must include: machine name/asset tag (e.g. LAPTOP-047), the specific blocker (fTPM disabled in BIOS), the exact fix applied (enabled fTPM in BIOS Security settings), verification steps (tpm.msc showing TPM Ready 2.0, PC Health Check passing), and confirmation that the upgrade completed successfully.", topic:"Ticket Documentation" },
  ],
  2: [
    { id:1, question:"A user's application closes silently every morning at 08:30 with no error message. Where do you look in Event Viewer, what Event ID do you expect, and what information does it tell you?", keywords:["event viewer","application","event id 1000","id 1000","faulting","crash"], correctAnswer:"Open Event Viewer (eventvwr.msc) → Windows Logs → Application → Filter by Level: Error, and look for events around 08:30. Event ID 1000 is the standard application crash event — it shows the faulting application name, the faulting module (e.g. ntdll.dll), and the exact crash time.", topic:"Application Log Diagnostics" },
    { id:2, question:"Windows Update fails repeatedly with error code 0x80070057. Where is the detailed log for this, and what does the error indicate at that level?", keywords:["cbs.log","cbs","component store","0x80070057","corrupt","dism"], correctAnswer:"Check C:\\Windows\\Logs\\CBS\\CBS.log — search for 'FAILED' or '0x80070057'. This error indicates the Windows component store (SxS) is corrupt, preventing updates from installing. Run DISM /Online /Cleanup-Image /RestoreHealth (repairs component store) then SFC /scannow.", topic:"Windows Update Diagnostics" },
    { id:3, question:"You run sfc /scannow and get: 'Windows Resource Protection found corrupt files but was unable to fix some of them.' What is the next step and why must it be done in this order?", keywords:["dism","restorehealth","image","component store","sfc","repair"], correctAnswer:"Run DISM /Online /Cleanup-Image /RestoreHealth first. SFC cannot repair files if the Windows component store (its replacement file source) is itself corrupt. DISM downloads a clean image from Microsoft servers to repair the store. After DISM completes, run sfc /scannow again — it should now succeed.", topic:"SFC and DISM Repair" },
    { id:4, question:"A machine is rebooting unexpectedly without warning. Which Event Viewer log and which Event ID would confirm this is an unexpected power failure or crash?", keywords:["system","event id 41","id 41","kernel power","unexpected","reboot","shutdown"], correctAnswer:"Check Event Viewer → Windows Logs → System → filter by Error/Critical. Event ID 41, Source: Kernel-Power means the system shut down without a clean shutdown sequence — indicating a crash, power cut, or hard reset. Event ID 6008 'Unexpected shutdown' will also appear alongside it.", topic:"System Log Diagnostics" },
    { id:5, question:"After cleaning a malware infection, SFC /scannow fails. You run DISM RestoreHealth and it also fails with 'Source files could not be found.' What does this mean and what options remain?", keywords:["reinstall","clean install","windows","offline","source","usb","mount"], correctAnswer:"When both SFC and DISM fail, the Windows image is too severely corrupted for online repair. Options: (1) Run DISM with a local source using a mounted Windows ISO: DISM /Source:D:\\sources\\install.wim. (2) If that fails, a clean Windows reinstall is required. Document all repair attempts and escalate to a senior engineer.", topic:"SFC and DISM Repair" },
    { id:6, question:"You need to find exactly which Windows updates failed on a machine. Get-WindowsUpdateLog has been run. What file does it create, where, and what do you search for inside it?", keywords:["windowsupdate.log","desktop","failed","search","cbs","error"], correctAnswer:"Get-WindowsUpdateLog creates WindowsUpdate.log on the Desktop. Open it and search for 'FAILED' or 'error' to find failed update events. Look for CBS package installation failures and error codes. Cross-reference with CBS.log at C:\\Windows\\Logs\\CBS\\CBS.log for more detail on component store errors.", topic:"Windows Update Diagnostics" },
    { id:7, question:"A print server's Event Viewer System log shows Event ID 7023 with source 'Service Control Manager'. What does this mean and what do you do next?", keywords:["service","terminated","unexpectedly","services.msc","7023","start","restart"], correctAnswer:"Event ID 7023 means a Windows service terminated unexpectedly. Check the event description for the service name (e.g. Print Spooler). Open services.msc, find that service, and check its status. Right-click → Start to restart it. If it keeps crashing, check the Application log for related errors from that service.", topic:"System Log Diagnostics" },
    { id:8, question:"You suspect an account is locked out by failed login attempts from a specific PC. Which Event Viewer log, which Event ID, and which piece of information in the event identifies the source machine?", keywords:["security","event id 4740","4740","caller computer","workstation","locked out"], correctAnswer:"Check Event Viewer → Windows Logs → Security → filter for Event ID 4740 (Account Lockout). The event details show the locked account name and the Caller Computer Name — the machine from which the failed logins originated. Event ID 4625 (failed logon) provides the logon type and source IP for additional context.", topic:"Security Log Diagnostics" },
    { id:9, question:"Event ID 1000 in the Application log shows faulting module: ntdll.dll for a crashing application. What does this typically indicate and what is the fix?", keywords:["sfc","system files","corrupt","ntdll","system","scannow","repair"], correctAnswer:"ntdll.dll is a core Windows system DLL — when it's the faulting module, it typically indicates corrupted Windows system files rather than a fault in the application. Run sfc /scannow as Administrator to check and repair system files. If SFC finds violations and fixes them, the crash should stop. If SFC fails, run DISM /Online /Cleanup-Image /RestoreHealth first.", topic:"Application Log Diagnostics" },
    { id:10, question:"A machine had a sudden reboot three days ago. The user doesn't know what happened. Walk through exactly how you use Event Viewer to piece together what occurred.", keywords:["system","event viewer","id 41","id 6008","filter","time","application","error"], correctAnswer:"Open Event Viewer → Windows Logs → System. Filter by date to three days ago. Look for Event ID 41 (Kernel Power — unexpected shutdown) or ID 6008 (unexpected shutdown record) and note the exact time. Then check the Application log at the same time window for any critical errors just before the shutdown. Build a timeline from the events to identify the root cause.", topic:"System Log Diagnostics" },
  ],
  3: [
    { id:1, question:"tpm.msc on LAPTOP-031 shows 'Compatible TPM cannot be found on this computer.' Device Manager also shows no TPM device. The machine is 3 years old. What is the most likely cause and what do you do?", keywords:["bios","ftpm","ptt","disabled","security","enable"], correctAnswer:"The most likely cause is that the TPM chip (fTPM on AMD or PTT on Intel) is disabled in BIOS. Enter BIOS by restarting and pressing F2 or Delete. Navigate to Security tab → Advanced Security. Find fTPM or PTT and change it from Disabled to Enabled. Save and exit. tpm.msc will then show 'TPM Ready' with Specification Version 2.0.", topic:"TPM Configuration" },
    { id:2, question:"After replacing a user's HDD with a new SSD and reinstalling Windows, the machine shows 'Secure Boot Violation — Image failed to verify with SECURE BOOT' on every boot. What caused this and how do you fix it?", keywords:["uefi","gpt","legacy","mbr","secure boot","reinstall"], correctAnswer:"The installer defaulted to Legacy/MBR mode because BIOS was set to Legacy boot. Secure Boot requires UEFI mode + GPT-partitioned disk. Fix: Enter BIOS and disable Legacy Boot / enable UEFI Only. Then reinstall Windows — in UEFI mode the installer automatically uses GPT. Verify with msinfo32: BIOS Mode: UEFI, Secure Boot State: On.", topic:"Secure Boot Configuration" },
    { id:3, question:"A laptop shows 'Preparing Automatic Repair' on an endless loop and never boots into Windows. How do you access the recovery environment and what commands do you run?", keywords:["winre","shift","restart","bootrec","fixmbr","rebuildbcd","advanced options"], correctAnswer:"Access WinRE by holding Shift while clicking Restart, or boot from a Windows USB drive. In WinRE: Troubleshoot → Advanced Options → Command Prompt. Run: bootrec /fixmbr, bootrec /fixboot, bootrec /rebuildbcd. If rebuildbcd finds 0 Windows installations, also run: bcdboot C:\\Windows. Restart — Windows should load normally.", topic:"WinRE Boot Recovery" },
    { id:4, question:"msinfo32 shows 'BIOS Mode: Legacy' on a machine you are preparing for a Windows 11 upgrade. Why is this a problem and what changes are needed?", keywords:["uefi","secure boot","gpt","legacy","bios mode","windows 11"], correctAnswer:"Legacy BIOS mode does not support Secure Boot or GPT partitioning — both required for Windows 11. You need to: 1) Enter BIOS and switch to UEFI Only mode. 2) Convert the disk to GPT using MBR2GPT.exe /convert (non-destructive) or reinstall Windows in UEFI mode. 3) Enable Secure Boot. Verify: msinfo32 → BIOS Mode: UEFI, Secure Boot State: On.", topic:"UEFI Configuration" },
    { id:5, question:"bootrec /rebuildbcd shows '0 Windows installations identified.' What does this mean and what additional command resolves it?", keywords:["bcdboot","windows","c:\\windows","boot files","bcd"], correctAnswer:"'0 Windows installations identified' means the BCD scanner cannot find any Windows installations. Run: bcdboot C:\\Windows — this copies boot files from the Windows directory and creates a new BCD store pointing to the Windows installation on C:. After bcdboot completes, restart normally.", topic:"WinRE Boot Recovery" },
    { id:6, question:"A recent Windows update caused the machine to blue-screen on every startup. The machine boots into WinRE. Which WinRE tool is the most appropriate first step?", keywords:["uninstall updates","quality update","feature update","winre","troubleshoot"], correctAnswer:"In WinRE: Troubleshoot → Advanced Options → Uninstall Updates. Choose to remove the last Quality Update or Feature Update. This is a safe, reversible step that avoids data loss. If this doesn't resolve the issue, try System Restore (if restore points exist) before considering Reset this PC.", topic:"WinRE Boot Recovery" },
    { id:7, question:"tpm.msc shows TPM is present but the Specification Version is 1.2, not 2.0. What does this mean for Windows 11 and what options does the IT team have?", keywords:["tpm 2.0","windows 11","upgrade","incompatible","1.2","not supported"], correctAnswer:"Windows 11 requires TPM 2.0 — TPM 1.2 is a hardware limitation that cannot be upgraded through software. First check if the BIOS has an fTPM/PTT option that is a higher version (the embedded CPU TPM may be 2.0 even when a discrete 1.2 chip is present). If no TPM 2.0 option exists, the machine is not eligible. Document and escalate for hardware replacement discussion.", topic:"TPM Configuration" },
    { id:8, question:"After making BIOS changes to enable UEFI and Secure Boot, how do you verify the changes took effect without re-entering the BIOS?", keywords:["msinfo32","bios mode","uefi","secure boot state","on","tpm.msc"], correctAnswer:"Open msinfo32 (Windows key + R → msinfo32). Check: BIOS Mode (must show UEFI) and Secure Boot State (must show On). Also open tpm.msc to verify TPM is ready with Specification Version 2.0. These three checks confirm all firmware requirements for Windows 11 are met.", topic:"UEFI Configuration" },
    { id:9, question:"During a remote Atera session, a user reports their machine can't boot — it shows a 'Preparing Automatic Repair' loop. Can you fix this remotely, and what do you do?", keywords:["no","remote","cannot","physical","atera","winre","on-site","local"], correctAnswer:"WinRE and BIOS access cannot be performed through Atera, AnyDesk, or RDP — these tools only work once the OS has loaded. Arrange on-site access, or guide the user verbally over the phone to boot from a Windows USB drive and navigate WinRE options. Log the issue in Autotask and dispatch a field engineer if the user cannot follow phone guidance.", topic:"Remote vs On-site Limitations" },
    { id:10, question:"After running bootrec /fixmbr and bootrec /fixboot in WinRE, the machine still shows the same boot loop. What is the next command and what does it do?", keywords:["rebuildbcd","boot configuration","bcd","bootrec","rebuilds","boot menu"], correctAnswer:"Run bootrec /rebuildbcd — this scans all drives for compatible Windows installations and rebuilds the Boot Configuration Data (BCD) file that tells the bootloader where to find Windows. If it shows '0 Windows installations identified', additionally run bcdboot C:\\Windows to create fresh boot files.", topic:"WinRE Boot Recovery" },
  ],
  4: [
    { id:1, question:"Atera shows DESKTOP-055 as 'Offline' (grey dot) but the user confirms the PC is on and connected to the internet. What is the most likely cause and how do you resolve it without going on-site?", keywords:["atera agent","service","services.msc","stopped","start","agent service"], correctAnswer:"The Atera Agent Service has likely stopped. Ask the user to open services.msc (Windows key + R → services.msc), find 'Atera Agent Service', and check its status. If Stopped, right-click → Start. Wait 60 seconds — the device should appear Online in Atera. If the service keeps stopping, reinstall the Atera agent from the Atera admin portal.", topic:"Atera RMM Troubleshooting" },
    { id:2, question:"You have an AnyDesk session open to a remote user's PC. You can see the screen updating but your keyboard and mouse have no effect. What is causing this and what is the fix?", keywords:["uac","secure desktop","prompt","admin","yes","user","click","elevation"], correctAnswer:"A UAC (User Account Control) prompt has appeared, triggering Windows Secure Desktop. Secure Desktop intentionally blocks all remote input to prevent privilege escalation via remote tools. Ask the user to look at their physical screen and click 'Yes' on the UAC prompt. Once dismissed, your keyboard and mouse control will resume automatically.", topic:"AnyDesk Remote Support" },
    { id:3, question:"You attempt an RDP connection to LAPTOP-082 and immediately receive: 'Remote Desktop can't connect to the remote computer.' The user confirms the PC is on and Remote Desktop is enabled in System Properties. What do you check?", keywords:["firewall","wf.msc","inbound","tcp-in","3389","rule","remote desktop","enable"], correctAnswer:"Check the Windows Defender Firewall. Ask the user to open wf.msc → Inbound Rules → search for 'Remote Desktop'. The rule 'Remote Desktop - User Mode (TCP-In)' may be disabled (grey icon). Right-click → Enable Rule. Alternatively, run via Atera: netsh advfirewall firewall set rule name='Remote Desktop - User Mode (TCP-In)' new enable=yes", topic:"RDP Troubleshooting" },
    { id:4, question:"A field engineer needs to support a home worker whose home router does not allow port forwarding. Which remote tool should be used and why does it work through the home router?", keywords:["anydesk","nat","outbound","relay","cloud","port forwarding","home"], correctAnswer:"Use AnyDesk. Both the home user and the IT engineer connect outbound to AnyDesk's cloud relay server — neither side needs to accept inbound connections or configure port forwarding. The relay proxies the session between both endpoints, allowing it to work through NAT and home routers without any network configuration.", topic:"AnyDesk Remote Support" },
    { id:5, question:"Before starting a remote Atera session with a user, what three things should you check in the Atera dashboard about the device, and why does each matter?", keywords:["os","ram","last seen","online","status","device","atera"], correctAnswer:"1) Online status — confirm the device is showing Online before attempting to connect. 2) OS version and build — know what you're working with before you start. 3) RAM and disk usage — low resources may explain performance issues before you even connect. Also check 'Last Seen' timestamp to confirm the agent is actively reporting.", topic:"Atera RMM Troubleshooting" },
    { id:6, question:"What TCP port does RDP use, and what must be configured on the remote machine's firewall for RDP to work?", keywords:["3389","tcp","inbound","firewall","rule","rdp","port"], correctAnswer:"RDP uses TCP port 3389. The remote machine's Windows Defender Firewall must have an inbound rule enabled for TCP port 3389 — specifically 'Remote Desktop - User Mode (TCP-In)'. If the machine is on a corporate network, the network firewall may also need to allow TCP 3389 inbound.", topic:"RDP Troubleshooting" },
    { id:7, question:"You are supporting a user via AnyDesk. They need software installed that requires admin privileges. A UAC prompt appears and the user has stepped away from their desk. What happens and what do you do?", keywords:["uac","blocked","secure desktop","input","user","desk","wait","call"], correctAnswer:"Windows Secure Desktop blocks all remote input when a UAC prompt appears — your AnyDesk inputs are frozen until the UAC is dismissed locally. Call or message the user to return to their desk to click 'Yes'. For future sessions, consider connecting with a local admin account to avoid UAC interruptions during software installations.", topic:"AnyDesk Remote Support" },
    { id:8, question:"The Atera agent has been reinstalled but the device still shows Offline after 5 minutes. What else could prevent the agent from communicating with Atera?", keywords:["firewall","443","outbound","https","block","antivirus","network"], correctAnswer:"The Atera agent communicates over HTTPS (port 443) outbound to Atera's cloud servers. Check: 1) Windows Firewall — no rule should block outbound HTTPS for the Atera agent executable. 2) Corporate proxy/network firewall — may be blocking Atera's domain. 3) Antivirus — may be quarantining the agent. Add the Atera agent directory to antivirus exclusions if needed.", topic:"Atera RMM Troubleshooting" },
    { id:9, question:"A user is in a different city and needs support. Atera shows their device as Online. Walk through the preferred remote support workflow from opening Atera through to closing the ticket.", keywords:["atera","splashtop","connect","session","autotask","ticket","close"], correctAnswer:"1) Open Atera → find the device by name or account. 2) Check device details (OS, RAM, last seen). 3) Click Connect → launch Splashtop session. 4) Ask user to stay at their desk. 5) Run diagnostics (Task Manager, Event Viewer, ipconfig as needed). 6) Apply fix and verify with the user. 7) Disconnect. 8) Update the Autotask ticket with actions taken and resolution. 9) Close ticket after user confirmation.", topic:"Remote Support Workflow" },
    { id:10, question:"A user says RDP from home is 'too slow.' Which alternative tool should you suggest and what is the key technical reason it performs differently on home internet connections?", keywords:["anydesk","splashtop","compression","relay","optimised","home","vpn","performance"], correctAnswer:"Suggest AnyDesk or Splashtop. Both use proprietary compression algorithms optimised for low-bandwidth, variable-latency connections. RDP over the internet struggles with latency and packet loss on residential connections. AnyDesk and Splashtop route through cloud relays with adaptive compression. A properly configured VPN with split tunnelling can also improve RDP performance.", topic:"Remote Support Workflow" },
  ],
  5: [
    { id:1, question:"A ticket arrives: 'Nothing is working — nobody can log in.' Investigation reveals the Active Directory server is offline, affecting all 200 users. The agent assigned P4 Low priority. What priority should this be and what must happen immediately?", keywords:["p1","critical","escalate","priority","ad","all users","sla","15 min"], correctAnswer:"This is P1 Critical — a site-wide outage affecting all users (SLA: respond within 15 minutes). Immediately re-prioritise to P1 Critical, update the description to reflect full scope ('AD server offline, 200 users unable to authenticate, company-wide impact since [time]'), escalate to Tier 2/3, and notify the manager.", topic:"Ticket Priority Assessment" },
    { id:2, question:"Tier 2 receives an escalated ticket that reads: 'Upgrade failed. Couldn't fix it. Escalating.' They must now call the user back to start from scratch. What should the escalation note have contained?", keywords:["machine name","error code","setupdiag","steps","actions","taken","description","asset"], correctAnswer:"A proper escalation note must include: (1) Machine name/asset tag. (2) Exact error code (e.g. 0xC1900101). (3) SetupDiag output (FailureRule). (4) All steps attempted and their results. (5) Why you are escalating (what you cannot resolve). (6) Any time pressure or user impact. Tier 2 should be able to continue without contacting the user for basic information.", topic:"Ticket Documentation" },
    { id:3, question:"An agent closes a 'slow computer' ticket with resolution: 'Cleared temp files and restarted.' Three hours later the user reopens it. What process failure occurred and how should the agent have handled it?", keywords:["verify","user confirmation","confirm","resolved","reopen","close","verify fix"], correctAnswer:"The agent closed the ticket without verifying the fix with the user or investigating root cause. A ticket should only be closed after: (1) The fix was applied. (2) The issue was confirmed resolved. (3) The user confirmed they can work normally. The agent should have checked Task Manager and run CrystalDiskInfo before applying any fix, and confirmed with the user before closing.", topic:"Ticket Closure Process" },
    { id:4, question:"A single user cannot access the shared drive. The IT admin has already mapped a temporary network path as a workaround. What priority is this ticket and what is the response SLA?", keywords:["p3","medium","4 hours","workaround","single user","exists"], correctAnswer:"P3 Medium — a single user is affected and a workaround already exists. The SLA is to respond within 4 hours. Document the workaround in work detail, investigate and resolve the root cause (check VLAN rules, drive mapping settings, file server permissions), and confirm with the user once the permanent fix is in place.", topic:"Ticket Priority Assessment" },
    { id:5, question:"A department head's entire team of 12 cannot access email. IT confirms the Exchange server is responding but the issue is ongoing. What priority is this and why?", keywords:["p2","high","department","1 hour","multiple users","affected","team"], correctAnswer:"P2 High — a department (multiple users) is affected and email is a critical business function. The SLA is to respond within 1 hour. This would only be P1 if it were site-wide or affecting the entire company. Log as P2 High, assign immediately, and update the ticket every 30 minutes if ongoing.", topic:"Ticket Priority Assessment" },
    { id:6, question:"What is the difference between an Incident ticket and a Service Request ticket in Autotask? Give an example of each.", keywords:["incident","unplanned","broken","service request","planned","install","setup","scheduled"], correctAnswer:"An Incident is an unplanned event causing degradation or outage — something broken (e.g. 'Laptop won't boot', 'Email server down'). A Service Request is planned work initiated by the user or business — not something broken (e.g. 'Install Microsoft Office on new laptop', 'Set up new user account'). Incidents have priority SLAs; Service Requests are scheduled.", topic:"Ticket Types" },
    { id:7, question:"You are writing Work Detail notes during a live support session. What principle should guide what you record and when?", keywords:["as you go","each step","action","taken","result","real-time","document"], correctAnswer:"Record each action as you take it, in real time — not in a batch at the end. Note what you did, what result it produced, and any error messages or findings. This ensures nothing is forgotten and creates an accurate timeline. If you hand off the ticket, the next engineer can see exactly what has been done without asking.", topic:"Ticket Documentation" },
    { id:8, question:"A user's screen orientation is stuck in portrait mode after an accidental keypress. They can still work but want it fixed. What priority, and what does this tell you about P4?", keywords:["p4","low","cosmetic","minor","2 days","non-urgent","not impacting","functionality"], correctAnswer:"P4 Low — this is a minor cosmetic issue that does not prevent the user from working. The SLA is to respond within 2 business days. P4 is for non-urgent issues where no business function is impaired. Log it, schedule a fix at a convenient time, and confirm with the user when resolved.", topic:"Ticket Priority Assessment" },
    { id:9, question:"You have resolved a printer issue for a user. The printer is now printing normally. Walk through the exact steps to properly close this ticket in Autotask.", keywords:["work detail","resolution","user confirm","close","root cause","actions taken"], correctAnswer:"1) In Work Detail, record all actions: 'Stopped Print Spooler, cleared spool folder, restarted Spooler service.' 2) Ask the user to print a test page and confirm it works. 3) Write the Resolution note: 'Root cause: Print Spooler crashed due to corrupt job. Cleared spool and restarted service. User confirmed all printers restored at [time].' 4) Change ticket status to Closed. Never close until the user confirms.", topic:"Ticket Closure Process" },
    { id:10, question:"A colleague escalates a ticket to you but the machine name is missing. You need to connect via Atera to diagnose the issue. Why is the missing machine name a critical problem?", keywords:["machine name","atera","cannot find","device","identify","asset","ticket quality","documentation"], correctAnswer:"Without the machine name or asset tag, you cannot locate the device in Atera — you cannot initiate a remote session, run scripts, or check device status. You must contact the original agent or the user again for information that should have been captured at the start. Every ticket must include the machine name at creation — it is the minimum identifier needed for any remote support workflow.", topic:"Ticket Documentation" },
  ],
  6: [
    { id:1, question:"All 40 users report the shared printer is 'Offline.' The printer panel shows 'Ready.' Using the 5-step troubleshooting methodology, what are your first two steps and what specific actions do they involve?", keywords:["identify","theory","ping","spooler","services","step 1","step 2","bottom-up"], correctAnswer:"Step 1 — Identify: Confirm all users are affected, note the printer panel shows Ready (hardware is fine), establish when it started. Step 2 — Establish a Theory: Since the printer hardware is fine and all users are affected, the issue is server-side. Most likely: Print Spooler service has crashed. Ping the print server first to confirm it's reachable, then check the Spooler service in services.msc.", topic:"5-Step Troubleshooting" },
    { id:2, question:"An engineer receives a ticket: 'Outlook won't open.' Without checking Event Viewer, they uninstall/reinstall Outlook twice, then repair Office. 2 hours later: unresolved. What went wrong?", keywords:["step 1","step 2","identify","theory","event viewer","skipped","diagnosis","methodology"], correctAnswer:"The engineer skipped Steps 1 and 2 — they went straight to Step 4 (implement solution) without identifying the exact problem or establishing a theory. Event Viewer → Application log → Event ID 1000 would have shown a corrupted OST file in under 2 minutes. Correct fix: delete the OST file and let Outlook rebuild it (8-minute fix). Always diagnose before fixing.", topic:"5-Step Troubleshooting" },
    { id:3, question:"You have confirmed at Step 3 that the Print Spooler service is stopped. You are now at Step 4. What is the correct way to implement the fix?", keywords:["start","spooler","spool","printers","folder","clear","restart service","one change"], correctAnswer:"Step 4 — Implement the fix: Stop the Print Spooler service (services.msc), delete all files in C:\\Windows\\System32\\spool\\PRINTERS (the corrupt jobs causing the crash), then Start the Print Spooler service. Make only this one change — do not restart the server or make other changes simultaneously. This keeps the fix targeted and attributable.", topic:"5-Step Troubleshooting" },
    { id:4, question:"After restarting the Print Spooler service, printing appears to work from your test account. What does Step 5 require you to do before closing the Autotask ticket?", keywords:["verify","user","confirm","document","resolution","root cause","close","ticket"], correctAnswer:"Step 5 — Verify and Document: Ask one of the affected users to print a test document and confirm it works from their account. Once confirmed, write the Resolution note: document the root cause (corrupt print job crashed Spooler), actions taken (cleared spool folder, restarted service), and verification (user confirmed printing restored at [time]). Close the ticket only after user confirmation.", topic:"5-Step Troubleshooting" },
    { id:5, question:"A user says 'nothing works.' You are at Step 1 of the troubleshooting methodology. What specific questions do you ask to properly identify the problem, and why does this matter?", keywords:["what","when","which","error","app","affected","reproduce","specific","symptom"], correctAnswer:"Step 1 — Identify: Ask: (1) What specifically can't you do? (which application or service). (2) What exact error message do you see? (3) When did it start? (4) Did anything change recently? (5) Is anyone else affected? This matters because 'nothing works' could mean many different things — you cannot establish a theory until you have specific, reproducible symptoms.", topic:"Problem Identification" },
    { id:6, question:"During Step 2 of troubleshooting a network connectivity issue, you apply 'bottom-up' thinking. Starting from the bottom, what is the first layer you check and what specific action does this involve?", keywords:["physical","layer 1","cable","link","light","led","nic","bottom-up"], correctAnswer:"Bottom-up means starting at the Physical layer (Layer 1). Check: Is the network cable plugged in and seated? Is the NIC LED showing a link light? Is the cable damaged? This takes 10 seconds and rules out the most common cause. Do not check DNS, IP settings, or applications until you have confirmed the physical connection is intact.", topic:"Systematic Diagnosis" },
    { id:7, question:"An engineer fixes a 'slow PC' by simultaneously upgrading RAM from 8 GB to 16 GB and installing a new SSD. The PC is now fast. What is the problem with this approach?", keywords:["one change","simultaneously","don't know","which","fix","isolated","cause","one at a time"], correctAnswer:"The engineer made two changes simultaneously — you cannot determine which change fixed the issue. If a problem arises later, you wouldn't know the root cause. The correct approach: make one change, measure the result, then make the next change if needed. This keeps each change attributable and makes root cause analysis reliable.", topic:"Systematic Diagnosis" },
    { id:8, question:"You have finished troubleshooting a VPN issue for a remote user. The VPN is now connecting. You write the resolution note. What must the note include to meet the Step 5 standard?", keywords:["root cause","actions taken","resolution","user confirmed","time","close","what","fix"], correctAnswer:"The resolution note must include: (1) Root cause — what was actually wrong. (2) Actions taken — what you did to fix it. (3) Verification — how you confirmed it works (e.g. 'User confirmed VPN connects successfully'). (4) Time of resolution. Close the ticket only after all four elements are documented.", topic:"Documentation Standards" },
    { id:9, question:"A user's mapped S: drive disconnects after moving to the 3rd floor. Other 3rd floor users have no issue. How does the 5-step methodology guide your investigation?", keywords:["identify","theory","vlan","smb","445","test","one user","systematic","diagnose"], correctAnswer:"(1) Identify: one user affected after moving desks, others on same floor fine. (2) Theory: their machine is on a different VLAN or has a different network config. (3) Test: run ipconfig — check VLAN subnet vs working users. Run net use — check S: status. Test SMB (port 445) to the file server. (4) Fix: add VLAN firewall rule for SMB if that's the gap. (5) Verify and document. Systematic approach avoids guessing.", topic:"5-Step Troubleshooting" },
    { id:10, question:"Two engineers spent 3 hours each on the same recurring printer issue this month. Neither documented beyond 'Printer fixed.' What process failure does this represent and what is the remedy?", keywords:["documentation","resolution","root cause","recurring","knowledge","ticket","work detail","repeat"], correctAnswer:"This is a documentation failure — without recording root cause, actions taken, and resolution in Autotask, the next engineer starts from scratch every time. Step 5 requires full documentation so knowledge is captured. The remedy: mandate that every closed ticket includes root cause, commands run, fix applied, and how the fix was verified. This builds a knowledge base that reduces resolution time for recurring issues.", topic:"Documentation Standards" },
  ],
};

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

function NetSimCanvas({ devices: initialDevices, links: initialLinks, packets, label, desc, color="#6366f1", faultScenarios=[], onFaultModeChange=null }) {
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
  const [diagnosis, setDiagnosis] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [moduleScore, setModuleScore] = useState({correct:0, total:0});
  const [sessionResults, setSessionResults] = useState([]);
  const dragRef = useRef(null);
  const didDragRef = useRef(false);
  const svgRef = useRef(null);

  useEffect(() => { if (onFaultModeChange) onFaultModeChange(troubleshootMode); }, [troubleshootMode, onFaultModeChange]);

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
    setDiagnosis("");
    setSubmitted(false);
    setIsCorrect(false);
    setSessionResults([]);
    setTroubleshootMode(true);
    setRunning(false);
  };

  const submitDiagnosis = () => {
    if (!diagnosis.trim()) return;
    const sc = faultScenarios[faultScenarioIdx];
    if (!sc) return;
    const lower = diagnosis.toLowerCase();
    const matched = (sc.keywords||[]).filter(k => lower.includes(k.toLowerCase()));
    const correct = matched.length >= 2;
    setIsCorrect(correct);
    setSubmitted(true);
    setShowAnswer(true);
    setModuleScore(prev => ({correct: prev.correct+(correct?1:0), total: prev.total+1}));
    setSessionResults(prev => [...prev, {title: sc.title, isCorrect: correct, layer: sc.layer}]);
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
          onClick={troubleshootMode ? ()=>{setTroubleshootMode(false);setBrokenLink(null);setFixedLinks([]);setRevealedClues([]);setShowAnswer(false);setDiagnosis("");setSubmitted(false);setIsCorrect(false);setModuleScore({correct:0,total:0});setSessionResults([]);} : activateTroubleshoot}
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
                <g key={i} onClick={()=>{ if(troubleshootMode && lk.broken && showAnswer) setFixedLinks(prev=>[...prev,i]); }} style={{cursor:lk.broken&&showAnswer?"pointer":"default"}}>
                  <line x1={ax} y1={ay} x2={bx} y2={by}
                    stroke={lk.broken?"#ef4444":"#94a3b8"} strokeWidth={lk.broken?3:2.5}
                    strokeDasharray={lk.broken?"8 4":lk.dashed?"6 3":"none"} opacity="0.9"/>
                  {lk.broken && <text x={(ax+bx)/2} y={(ay+by)/2-10} textAnchor="middle" fontSize="18" fill="#ef4444">✕</text>}
                  {lk.broken && !showAnswer && <text x={(ax+bx)/2} y={(ay+by)/2+18} textAnchor="middle" fontSize="8" fill="#ef4444" opacity="0.7">investigate first →</text>}
                  {lk.broken && showAnswer && <text x={(ax+bx)/2} y={(ay+by)/2+18} textAnchor="middle" fontSize="8" fill="#10b981" fontWeight="700">click to fix</text>}
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
  const allDone = sessionResults.length === faultScenarios.length;

  if (allDone) {
    const correct = sessionResults.filter(r => r.isCorrect).length;
    const failed = sessionResults.filter(r => !r.isCorrect);
    return (
      <div style={{padding:"10px",height:"100%",boxSizing:"border-box",overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
        <div style={{textAlign:"center",padding:"8px 0"}}>
          <div style={{fontSize:22,marginBottom:4}}>🎯</div>
          <div style={{fontWeight:800,fontSize:13,color:"#0f172a"}}>Session Complete</div>
          <div style={{fontSize:11,color:"#64748b"}}>All {faultScenarios.length} scenarios done</div>
        </div>
        <div style={{background: correct===faultScenarios.length?"#ecfdf5":correct>=faultScenarios.length/2?"#fffbeb":"#fef2f2", border:`1px solid ${correct===faultScenarios.length?"#86efac":correct>=faultScenarios.length/2?"#fcd34d":"#fecaca"}`, borderRadius:10,padding:"10px",textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:900,color:correct===faultScenarios.length?"#065f46":correct>=faultScenarios.length/2?"#92400e":"#dc2626"}}>{correct}/{faultScenarios.length}</div>
          <div style={{fontSize:10,color:"#475569",fontWeight:600}}>{correct===faultScenarios.length?"Perfect score!":correct>=faultScenarios.length/2?"Good effort":"Needs more practice"}</div>
        </div>
        <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.07em"}}>Results</div>
        {sessionResults.map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"5px 7px",borderRadius:6,background:r.isCorrect?"#f0fdf4":"#fef2f2",border:`1px solid ${r.isCorrect?"#bbf7d0":"#fecaca"}`}}>
            <span style={{fontSize:11,flexShrink:0}}>{r.isCorrect?"✅":"❌"}</span>
            <div>
              <div style={{fontSize:9,fontWeight:700,color:"#1e293b",lineHeight:1.3}}>{r.title}</div>
              <div style={{fontSize:8,color:"#64748b"}}>{r.layer}</div>
            </div>
          </div>
        ))}
        {failed.length>0&&(
          <>
            <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.07em"}}>Areas to Improve</div>
            {failed.map((r,i)=>(
              <div key={i} style={{padding:"6px 8px",borderRadius:7,background:"#fff7ed",border:"1px solid #fed7aa"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#c2410c",marginBottom:2}}>{r.layer}</div>
                <div style={{fontSize:8,color:"#78350f",lineHeight:1.5}}>Review: <b>{r.title}</b> — re-read the explanation and try this scenario again.</div>
              </div>
            ))}
          </>
        )}
        <button onClick={()=>{
          setTroubleshootMode(false);setBrokenLink(null);setFixedLinks([]);setRevealedClues([]);
          setShowAnswer(false);setDiagnosis("");setSubmitted(false);setIsCorrect(false);
          setModuleScore({correct:0,total:0});setSessionResults([]);setFaultScenarioIdx(0);
        }} style={{marginTop:"auto",width:"100%",padding:"8px 0",borderRadius:7,border:"none",background:"#0f172a",color:"#fff",fontWeight:700,fontSize:10,cursor:"pointer"}}>
          Exit Fault Mode
        </button>
      </div>
    );
  }

  if (!sc) return null;
  return (
    <div style={{padding:"8px 10px",height:"100%",boxSizing:"border-box",display:"flex",flexDirection:"column",gap:7,overflowY:"auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:8,fontWeight:700,color:"#dc2626",textTransform:"uppercase"}}>🔴 Fault Report</div>
        <div style={{fontSize:9,fontWeight:700,color:"#6366f1",background:"#eef2ff",borderRadius:5,padding:"1px 6px"}}>{sessionResults.length}/{faultScenarios.length} done</div>
      </div>
      <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:7,padding:"7px 9px"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#1e293b",lineHeight:1.3,marginBottom:3}}>{sc.title}</div>
        <div style={{fontSize:9,color:"#64748b",lineHeight:1.5}}>{sc.symptom}</div>
      </div>
      <div style={{fontSize:8,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.07em"}}>🔍 Clue (optional)</div>
      {sc.clues.slice(0,1).map((clue,i)=>(
        <div key={i}>
          {revealedClues.includes(i) ? (
            <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:6,padding:"6px 8px",fontSize:9,color:"#0369a1",lineHeight:1.5}}>{clue}</div>
          ) : (
            <button onClick={()=>!submitted&&setRevealedClues(prev=>[...prev,i])} disabled={submitted}
              style={{width:"100%",padding:"5px 8px",borderRadius:6,border:"1px solid #e2e8f0",background:"#f8fafc",color:submitted?"#c4c4c4":"#475569",cursor:submitted?"default":"pointer",fontSize:9,textAlign:"left",fontWeight:600}}>
              🔍 Reveal Clue
            </button>
          )}
        </div>
      ))}
      {!submitted ? (
        <>
          <div style={{fontSize:8,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.07em"}}>💬 Your Diagnosis</div>
          <textarea value={diagnosis} onChange={e=>setDiagnosis(e.target.value)}
            placeholder="What is the root cause? How would you troubleshoot and fix it?"
            style={{width:"100%",flex:1,minHeight:110,padding:"8px 10px",borderRadius:7,border:"1px solid #cbd5e1",fontSize:10,resize:"none",fontFamily:"inherit",outline:"none",boxSizing:"border-box",lineHeight:1.6,color:"#334155"}}/>
          <button onClick={submitDiagnosis} disabled={!diagnosis.trim()}
            style={{width:"100%",padding:"8px 0",borderRadius:7,border:"none",background:diagnosis.trim()?"#6366f1":"#e2e8f0",color:diagnosis.trim()?"#fff":"#94a3b8",fontWeight:700,fontSize:11,cursor:diagnosis.trim()?"pointer":"default"}}>
            Submit Answer
          </button>
        </>
      ) : (
        <>
          <div style={{background:isCorrect?"#ecfdf5":"#fef2f2",border:`1px solid ${isCorrect?"#86efac":"#fecaca"}`,borderRadius:7,padding:"8px 10px"}}>
            <div style={{fontSize:11,fontWeight:800,color:isCorrect?"#065f46":"#dc2626",marginBottom:4}}>{isCorrect?"✅ Correct!":"❌ Not quite"}</div>
            <div style={{fontSize:9,color:"#475569",fontStyle:"italic",background:"rgba(0,0,0,0.03)",borderRadius:5,padding:"4px 7px",marginBottom:6,lineHeight:1.5}}>{diagnosis}</div>
            <div style={{fontSize:8,fontWeight:700,color:"#64748b",textTransform:"uppercase",marginBottom:3}}>Root Cause & Fix</div>
            <div style={{fontSize:9,color:"#1e293b",lineHeight:1.5,marginBottom:3}}>{sc.answer}</div>
            <div style={{fontSize:8,fontWeight:700,color:"#6366f1"}}>{sc.layer}</div>
          </div>
          {fixedLinks.length>0
            ? <div style={{background:"#ecfdf5",border:"1px solid #86efac",borderRadius:6,padding:"5px 8px",fontSize:9,color:"#166534",fontWeight:700,textAlign:"center"}}>✅ Network restored!</div>
            : showAnswer && <div style={{fontSize:9,color:"#94a3b8",textAlign:"center"}}>← click the red ✕ to fix it</div>
          }
          <button onClick={()=>{
            const next=(faultScenarioIdx+1)%faultScenarios.length;
            setFaultScenarioIdx(next);
            setBrokenLink(faultScenarios[next].brokenLinkIdx);
            setFixedLinks([]);setRevealedClues([]);setShowAnswer(false);
            setDiagnosis("");setSubmitted(false);setIsCorrect(false);setRunning(false);
          }} style={{width:"100%",padding:"8px 0",borderRadius:7,border:"none",background:"#0f172a",color:"#fff",fontSize:10,cursor:"pointer",fontWeight:700}}>
            {sessionResults.length===faultScenarios.length-1 ? "See Results →" : `Next Scenario (${sessionResults.length+1}/${faultScenarios.length})`}
          </button>
        </>
      )}
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
  const [faultActive, setFaultActive] = useState(false);
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
        <NetSimCanvas devices={devices} links={links} packets={packets} label="Network Devices" desc="See how data flows through a switch and router." color="#6366f1" faultScenarios={FAULT_SCENARIOS[1]} onFaultModeChange={setFaultActive}/>
      </div>
      {!faultActive && (
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
      )}
    </div>
  );
}

// ── MODULE 2 ──
function Mod2Sim() {
  const [faultActive, setFaultActive] = useState(false);
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
        <NetSimCanvas devices={devices} links={links} packets={packets} label="Routing Between Networks" desc="Watch packets route between two IP networks via a router." color="#0ea5e9" faultScenarios={FAULT_SCENARIOS[2]} onFaultModeChange={setFaultActive}/>
      </div>
      {!faultActive && (
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
      )}
    </div>
  );
}

// ── MODULE 3 ──
function Mod3Sim() {
  const [faultActive, setFaultActive] = useState(false);
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
        <NetSimCanvas devices={devices} links={links} packets={packets} label="TCP Connection Flow" desc="Watch a full TCP handshake then data transfer through a firewall." color="#10b981" faultScenarios={FAULT_SCENARIOS[3]} onFaultModeChange={setFaultActive}/>
      </div>
      {!faultActive && (
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
      )}
    </div>
  );
}

// ── MODULE 4 ──
function Mod4Sim() {
  const [faultActive, setFaultActive] = useState(false);
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
        <NetSimCanvas devices={devices} links={links} packets={packets} label="DNS + DHCP + NAT" desc="Watch a full web request — DNS lookup, NAT translation, HTTP response." color="#f59e0b" faultScenarios={FAULT_SCENARIOS[4]} onFaultModeChange={setFaultActive}/>
      </div>
      {!faultActive && (
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
      )}
    </div>
  );
}

// ── MODULE 5 ──
function Mod5Sim() {
  const [faultActive, setFaultActive] = useState(false);
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
        <NetSimCanvas devices={devices} links={links} packets={packets} label="Home Network to Internet" desc="See how WiFi devices connect through your router and ISP to the internet." color="#ec4899" faultScenarios={FAULT_SCENARIOS[5]} onFaultModeChange={setFaultActive}/>
      </div>
      {!faultActive && (
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
      )}
    </div>
  );
}

// ── MODULE 6 ──
function Mod6Sim() {
  const [faultActive, setFaultActive] = useState(false);
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
        <NetSimCanvas devices={devices} links={links} packets={packets} label="Network Fault Scenario" desc="A PC has an APIPA address (169.254.x.x). Diagnose the fault bottom-up." color="#ef4444" faultScenarios={FAULT_SCENARIOS[6]} onFaultModeChange={setFaultActive}/>
      </div>
      {!faultActive && (
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
      )}
    </div>
  );
}

function InfoPanel({ moduleId, color, infoData=MODULE_INFO }) {
  const info = infoData[moduleId];
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

// ── IT MODULE SIMULATORS ──
function ITScenarioQuiz({ moduleId, color, onBack }) {
  const scenarios = IT_SCENARIOS[moduleId] || [];
  const [qIdx, setQIdx] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const current = scenarios[qIdx];

  const checkAnswer = (answer, keywords) => {
    const lower = answer.toLowerCase();
    return keywords.filter(k => lower.includes(k.toLowerCase())).length >= 2;
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    const correct = checkAnswer(input, current.keywords);
    setResults(prev => [...prev, { correct, topic: current.topic, correctAnswer: current.correctAnswer }]);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (qIdx === scenarios.length - 1) { setShowResults(true); }
    else { setQIdx(q => q + 1); setInput(""); setSubmitted(false); }
  };

  const handleReset = () => { setQIdx(0); setInput(""); setSubmitted(false); setResults([]); setShowResults(false); };

  if (showResults) {
    const score = results.filter(r => r.correct).length;
    const wrongTopics = [...new Set(results.filter(r => !r.correct).map(r => r.topic))];
    const rating = score >= 9 ? "Excellent" : score >= 7 ? "Good" : score >= 5 ? "Developing" : "Needs Review";
    const ratingColor = score >= 9 ? "#10b981" : score >= 7 ? "#3b82f6" : score >= 5 ? "#f59e0b" : "#ef4444";
    return (
      <div style={{height:"100%",overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"32px 20px",fontFamily:"system-ui,sans-serif"}}>
        <div style={{maxWidth:560,width:"100%"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:"3.5rem",fontWeight:900,color:score>=7?"#10b981":"#f59e0b",lineHeight:1}}>{score}<span style={{fontSize:"1.5rem",color:"#94a3b8"}}>/10</span></div>
            <div style={{marginTop:6,display:"inline-block",padding:"4px 16px",borderRadius:20,background:`${ratingColor}18`,border:`1px solid ${ratingColor}40`,color:ratingColor,fontWeight:700,fontSize:"0.95rem"}}>{rating}</div>
            <div style={{marginTop:10,color:"#64748b",fontSize:"0.85rem"}}>Module {moduleId} complete</div>
          </div>
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:"0.85rem",color:"#0f172a",marginBottom:12}}>Score Breakdown</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {results.map((r,i)=>(
                <div key={i} style={{width:32,height:32,borderRadius:8,background:r.correct?`${color}18`:"#fef2f2",border:`1px solid ${r.correct?color+"40":"#fecaca"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:r.correct?color:"#ef4444"}}>
                  {r.correct?"✓":"✗"}
                </div>
              ))}
            </div>
          </div>
          {wrongTopics.length > 0 && (
            <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:20,marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:"0.85rem",color:"#0f172a",marginBottom:10}}>Areas of Development</div>
              <p style={{fontSize:"0.8rem",color:"#64748b",marginBottom:12,lineHeight:1.5}}>Focus on these topics before your next assessment:</p>
              {wrongTopics.map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,padding:"8px 12px",borderRadius:9,background:"#fef2f2",border:"1px solid #fecaca"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",flexShrink:0}}/>
                  <div style={{fontSize:"0.82rem",color:"#1e293b",fontWeight:600}}>{t}</div>
                </div>
              ))}
            </div>
          )}
          {wrongTopics.length === 0 && (
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:16,padding:16,marginBottom:16,textAlign:"center"}}>
              <div style={{fontSize:"1.5rem",marginBottom:4}}>🎉</div>
              <div style={{fontWeight:700,color:"#166534",fontSize:"0.9rem"}}>Perfect score — no areas of development!</div>
            </div>
          )}
          <div style={{display:"flex",gap:10}}>
            <button onClick={handleReset} style={{flex:1,padding:12,borderRadius:10,background:`linear-gradient(135deg,${color},${color}cc)`,color:"#fff",fontWeight:700,border:"none",cursor:"pointer",fontSize:"0.9rem"}}>Try Again</button>
            <button onClick={onBack} style={{flex:1,padding:12,borderRadius:10,background:"#f1f5f9",color:"#475569",fontWeight:600,border:"1px solid #e2e8f0",cursor:"pointer",fontSize:"0.9rem"}}>← Back to Hub</button>
          </div>
        </div>
      </div>
    );
  }

  const lastResult = submitted ? results[results.length - 1] : null;

  return (
    <div style={{height:"100%",display:"flex",fontFamily:"system-ui,sans-serif",minHeight:0}}>
      {/* Left: Question panel */}
      <div style={{flex:3,padding:20,overflowY:"auto",display:"flex",flexDirection:"column",gap:14,borderRight:"1px solid #e2e8f0"}}>
        {/* Progress */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:"0.78rem",fontWeight:700,color:color}}>Question {qIdx+1} of {scenarios.length}</div>
          <div style={{flex:1,height:5,borderRadius:3,background:"#f1f5f9",overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:3,background:color,width:`${((qIdx+(submitted?1:0))/scenarios.length)*100}%`,transition:"width 0.3s"}}/>
          </div>
          <div style={{fontSize:"0.75rem",color:"#94a3b8"}}>{results.filter(r=>r.correct).length}/{results.length} correct</div>
        </div>
        {/* Scenario */}
        <div style={{background:"#fff",border:`1px solid ${color}30`,borderLeft:`4px solid ${color}`,borderRadius:"0 12px 12px 0",padding:"14px 16px"}}>
          <div style={{fontSize:"0.72rem",fontWeight:700,color:color,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7}}>Scenario</div>
          <div style={{fontSize:"0.9rem",color:"#1e293b",lineHeight:1.7}}>{current.question}</div>
        </div>
        {/* Answer area */}
        <div>
          <label style={{fontSize:"0.78rem",fontWeight:600,color:"#475569",display:"block",marginBottom:6}}>Your Answer</label>
          <textarea
            value={input} onChange={e=>setInput(e.target.value)}
            disabled={submitted}
            placeholder="Type your answer here — be specific, use the correct tool names and commands..."
            rows={5}
            style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1px solid ${submitted?(lastResult?.correct?"#86efac":"#fca5a5"):"#e2e8f0"}`,background:submitted?(lastResult?.correct?"#f0fdf4":"#fef2f2"):"#fff",fontSize:"0.88rem",color:"#1e293b",resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.6}}
          />
        </div>
        {/* Buttons */}
        <div style={{display:"flex",gap:10}}>
          {!submitted ? (
            <button onClick={handleSubmit} disabled={!input.trim()} style={{padding:"10px 24px",borderRadius:10,background:input.trim()?`linear-gradient(135deg,${color},${color}cc)`:"#e2e8f0",color:input.trim()?"#fff":"#94a3b8",fontWeight:700,border:"none",cursor:input.trim()?"pointer":"default",fontSize:"0.9rem"}}>
              Submit Answer
            </button>
          ) : (
            <button onClick={handleNext} style={{padding:"10px 24px",borderRadius:10,background:`linear-gradient(135deg,${color},${color}cc)`,color:"#fff",fontWeight:700,border:"none",cursor:"pointer",fontSize:"0.9rem"}}>
              {qIdx === scenarios.length - 1 ? "See Results →" : "Next Question →"}
            </button>
          )}
          <button onClick={onBack} style={{padding:"10px 18px",borderRadius:10,background:"transparent",color:"#94a3b8",fontWeight:600,border:"1px solid #e2e8f0",cursor:"pointer",fontSize:"0.85rem"}}>← Hub</button>
        </div>
      </div>
      {/* Right: Feedback panel */}
      <div style={{flex:2,padding:18,overflowY:"auto",background:"#f8fafc",display:"flex",flexDirection:"column",gap:12}}>
        {/* Running score */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"10px 14px"}}>
          <div style={{fontSize:"0.75rem",fontWeight:700,color:"#64748b",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.04em"}}>Progress</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {scenarios.map((_,i)=>{
              const res = results[i];
              return (
                <div key={i} style={{width:26,height:26,borderRadius:6,border:`1px solid ${i===qIdx?color:(res?( res.correct?color+"60":"#fca5a5"):"#e2e8f0")}`,background:i===qIdx?`${color}18`:(res?(res.correct?`${color}18`:"#fef2f2"):"transparent"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:i===qIdx?color:(res?(res.correct?color:"#ef4444"):"#cbd5e1")}}>
                  {res ? (res.correct?"✓":"✗") : (i+1)}
                </div>
              );
            })}
          </div>
        </div>
        {/* Feedback */}
        {submitted && lastResult ? (
          <div style={{background:"#fff",border:`1px solid ${lastResult.correct?"#86efac":"#fca5a5"}`,borderRadius:12,padding:14,flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:28,height:28,borderRadius:8,background:lastResult.correct?"#f0fdf4":"#fef2f2",border:`1px solid ${lastResult.correct?"#86efac":"#fca5a5"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:lastResult.correct?"#10b981":"#ef4444"}}>
                {lastResult.correct?"✓":"✗"}
              </div>
              <div style={{fontWeight:700,fontSize:"0.9rem",color:lastResult.correct?"#166534":"#991b1b"}}>
                {lastResult.correct?"Correct!":"Not quite — see below"}
              </div>
            </div>
            <div style={{fontSize:"0.72rem",fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Model Answer</div>
            <div style={{fontSize:"0.82rem",color:"#374151",lineHeight:1.75,background:"#f8fafc",borderRadius:8,padding:"10px 12px",border:"1px solid #e2e8f0"}}>{lastResult.correctAnswer}</div>
            <div style={{marginTop:10,padding:"7px 10px",borderRadius:7,background:`${color}10`,border:`1px solid ${color}30`}}>
              <span style={{fontSize:"0.72rem",fontWeight:700,color:color}}>Topic: </span>
              <span style={{fontSize:"0.72rem",color:"#475569"}}>{current.topic}</span>
            </div>
          </div>
        ) : (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#cbd5e1",textAlign:"center",gap:8,padding:20}}>
            <div style={{fontSize:"2.5rem",opacity:0.4}}>💬</div>
            <div style={{fontSize:"0.85rem",fontWeight:600}}>Submit your answer</div>
            <div style={{fontSize:"0.78rem"}}>Feedback and the model answer will appear here</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── LOGIN ──
function LoginScreen({ onLogin, portal="networking", onBack }) {
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [err,setErr]=useState(""); const [shake,setShake]=useState(false);
  const isIT = portal==="it";
  const expectedU = isIT ? IT_LOGIN_USERNAME : LOGIN_USERNAME;
  const expectedP = isIT ? IT_LOGIN_PASSWORD : LOGIN_PASSWORD;
  const accent = isIT ? "#14b8a6" : "#6366f1";
  const accent2 = isIT ? "#0d9488" : "#8b5cf6";
  const mods = isIT ? IT_MODULES : MODULES;
  const attempt=()=>{
    if(u.trim().toLowerCase()===expectedU.toLowerCase()&&p.trim()===expectedP) onLogin();
    else { setErr("Incorrect username or password."); setShake(true); setTimeout(()=>setShake(false),500); }
  };
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"system-ui,sans-serif"}}>
      <div style={{maxWidth:420,width:"100%",textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:20}}>
          {mods.map((m)=><div key={m.id} style={{width:34,height:34,borderRadius:9,background:m.color,opacity:0.85,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:10}}>M{m.id}</div>)}
        </div>
        <h1 style={{color:"#f1f5f9",fontSize:"1.7rem",fontWeight:800,margin:"0 0 6px"}}>Learning Hub</h1>
        <p style={{color:"#64748b",fontSize:"0.85rem",marginBottom:28}}>{isIT?"IT Support Training":"Networking Training · Google Course"}</p>
        <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,padding:28,animation:shake?"shake 0.4s":"none"}}>
          <div style={{color:"#94a3b8",fontSize:13,marginBottom:18}}>Sign in to access your {isIT?"IT Support":"Networking"} hub</div>
          {[["Username",u,setU,"text","Enter username"],["Password",p,setP,"password","Enter password"]].map(([label,val,setter,type,ph])=>(
            <div key={label} style={{marginBottom:14,textAlign:"left"}}>
              <label style={{fontSize:12,color:"#64748b",fontWeight:600,display:"block",marginBottom:5}}>{label}</label>
              <input type={type} value={val} onChange={e=>{setter(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder={ph}
                style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1px solid ${err?"#ef4444":"rgba(255,255,255,0.15)"}`,background:"rgba(255,255,255,0.07)",color:"#e2e8f0",fontSize:"0.95rem",outline:"none",boxSizing:"border-box"}}/>
            </div>
          ))}
          {err&&<div style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"8px 12px",color:"#fca5a5",fontSize:13,marginBottom:14}}>{err}</div>}
          <button onClick={attempt} style={{width:"100%",padding:13,borderRadius:10,background:`linear-gradient(135deg,${accent},${accent2})`,color:"#fff",fontWeight:700,fontSize:"1rem",border:"none",cursor:"pointer"}}>Sign In →</button>
        </div>
        {onBack&&<button onClick={onBack} style={{marginTop:14,background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:"0.85rem"}}>← Back to portal</button>}
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>
    </div>
  );
}

// ── PORTAL SELECTION ──
function PortalScreen({ onSelect }) {
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"system-ui,sans-serif"}}>
      <div style={{maxWidth:620,width:"100%",textAlign:"center"}}>
        <h1 style={{color:"#f1f5f9",fontSize:"2.2rem",fontWeight:800,margin:"0 0 8px"}}>Learning Hub</h1>
        <p style={{color:"#64748b",fontSize:"0.9rem",marginBottom:36}}>Choose your learning track to get started</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {[
            {key:"networking",icon:"🌐",title:"Networking",color:"#6366f1",desc:"OSI model, IP routing, TCP/UDP, DNS, DHCP, WiFi & troubleshooting",tag:"6 Modules · Live Simulators"},
            {key:"it",icon:"🖥️",title:"IT Support",color:"#14b8a6",desc:"Windows OS, Event Viewer, BIOS/UEFI, remote tools, ticketing & methodology",tag:"6 Modules · Fault Scenarios"},
          ].map(pt=>(
            <div key={pt.key} onClick={()=>onSelect(pt.key)}
              style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${pt.color}35`,borderRadius:20,padding:"28px 20px",cursor:"pointer",transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=`${pt.color}12`;e.currentTarget.style.borderColor=pt.color;e.currentTarget.style.transform="translateY(-4px)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.borderColor=`${pt.color}35`;e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{fontSize:"2.8rem",marginBottom:10}}>{pt.icon}</div>
              <div style={{color:"#f1f5f9",fontWeight:800,fontSize:"1.2rem",marginBottom:6}}>{pt.title}</div>
              <div style={{color:"#94a3b8",fontSize:"0.82rem",marginBottom:14,lineHeight:1.6}}>{pt.desc}</div>
              <div style={{background:`${pt.color}20`,color:pt.color,borderRadius:20,padding:"4px 14px",fontSize:"0.75rem",fontWeight:700,display:"inline-block"}}>{pt.tag}</div>
            </div>
          ))}
        </div>
      </div>
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

// ── NAME ENTRY SCREEN ──
function NameScreen({ onEnter, onSignOut, accent="#6366f1", accent2="#8b5cf6" }) {
  const [nameInput,setNameInput]=useState("");
  const go=()=>nameInput.trim()&&onEnter(nameInput.trim());
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"system-ui,sans-serif"}}>
      <div style={{maxWidth:420,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:"2.5rem",marginBottom:12}}>👋</div>
        <h2 style={{color:"#f1f5f9",fontSize:"1.5rem",fontWeight:700,marginBottom:8}}>Welcome! What's your name?</h2>
        <p style={{color:"#94a3b8",marginBottom:28,fontSize:"0.9rem"}}>Personalise your learning journey</p>
        <input placeholder="Enter your first name..." value={nameInput} onChange={e=>setNameInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&go()}
          style={{width:"100%",padding:"13px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)",color:"#e2e8f0",fontSize:"1.1rem",outline:"none",boxSizing:"border-box",marginBottom:12,textAlign:"center"}} autoFocus/>
        <button onClick={go} style={{width:"100%",padding:13,borderRadius:12,background:`linear-gradient(135deg,${accent},${accent2})`,color:"#fff",fontWeight:700,fontSize:"1rem",border:"none",cursor:"pointer"}}>Enter the Hub →</button>
        <button onClick={onSignOut} style={{marginTop:10,background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:"0.85rem"}}>← Sign out</button>
      </div>
    </div>
  );
}

// ── NETWORKING APP ──
function NetworkingApp({ onPortalReset }) {
  const [loggedIn,setLoggedIn]=useState(()=>localStorage.getItem("nh_auth")==="1");
  const [screen,setScreen]=useState(()=>localStorage.getItem("nh_name")?"hub":"name");
  const [name,setName]=useState(()=>localStorage.getItem("nh_name")||"");
  const [activeModule,setActiveModule]=useState(null);

  if(!loggedIn) return <LoginScreen portal="networking" onLogin={()=>{localStorage.setItem("nh_auth","1");setLoggedIn(true);}} onBack={onPortalReset}/>;

  const signOut=()=>{localStorage.removeItem("nh_auth");localStorage.removeItem("nh_name");setLoggedIn(false);setScreen("name");setName("");onPortalReset();};
  const openModule=(mod)=>{ setActiveModule(mod.id); setScreen("module"); };
  const mod=MODULES.find(m=>m.id===activeModule);
  const SimComponent=activeModule?MODULE_SIMS[activeModule]:null;

  if(screen==="name") return <NameScreen onEnter={n=>{localStorage.setItem("nh_name",n);setName(n);setScreen("hub");}} onSignOut={signOut}/>;

  if(screen==="hub") return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e1b4b)",padding:"14px 20px",display:"flex",alignItems:"center",gap:12}}>
        <div><div style={{color:"#f1f5f9",fontWeight:700}}>Learning Hub — Networking</div><div style={{color:"#64748b",fontSize:"0.75rem"}}>Welcome, {name}</div></div>
        <button onClick={()=>setScreen("name")} style={{marginLeft:"auto",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"#94a3b8",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:"0.75rem"}}>Switch User</button>
        <button onClick={signOut} style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:"0.75rem"}}>Sign Out</button>
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

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",background:"#f8fafc"}}>
      <div style={{background:mod?`linear-gradient(135deg,${mod.color}e0,${mod.color}90)`:"linear-gradient(135deg,#0f172a,#1e1b4b)",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={()=>setScreen("hub")} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:"0.8rem"}}>← Hub</button>
        {mod&&<div style={{fontWeight:700,color:"#fff",fontSize:"0.95rem"}}>Module {mod.id}: {mod.title}</div>}
      </div>
      <div style={{flex:1,overflow:"hidden",display:"flex"}}>
        <div style={{flex:1,overflow:"auto",padding:14,display:"flex",flexDirection:"column"}}>{SimComponent&&<SimComponent/>}</div>
        <div style={{width:290,background:"#fff",borderLeft:"1px solid #e2e8f0",overflow:"auto",padding:18,flexShrink:0}}>
          {mod&&(<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #f1f5f9"}}><div style={{width:10,height:10,borderRadius:"50%",background:mod.color,flexShrink:0}}/><div style={{fontWeight:700,color:"#0f172a",fontSize:13}}>{mod.title}</div></div>)}
          {activeModule&&<InfoPanel moduleId={activeModule} color={mod?.color||"#6366f1"}/>}
        </div>
      </div>
    </div>
  );
}

// ── IT SUPPORT APP ──
function ITApp({ onPortalReset }) {
  const [loggedIn,setLoggedIn]=useState(()=>localStorage.getItem("it_auth")==="1");
  const [screen,setScreen]=useState(()=>localStorage.getItem("it_name")?"hub":"name");
  const [name,setName]=useState(()=>localStorage.getItem("it_name")||"");
  const [activeModule,setActiveModule]=useState(null);

  if(!loggedIn) return <LoginScreen portal="it" onLogin={()=>{localStorage.setItem("it_auth","1");setLoggedIn(true);}} onBack={onPortalReset}/>;

  const signOut=()=>{localStorage.removeItem("it_auth");localStorage.removeItem("it_name");setLoggedIn(false);setScreen("name");setName("");onPortalReset();};
  const openModule=(mod)=>{ setActiveModule(mod.id); setScreen("module"); };
  const mod=IT_MODULES.find(m=>m.id===activeModule);

  if(screen==="name") return <NameScreen onEnter={n=>{localStorage.setItem("it_name",n);setName(n);setScreen("hub");}} onSignOut={signOut} accent="#14b8a6" accent2="#0d9488"/>;

  if(screen==="hub") return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:"linear-gradient(135deg,#0f172a,#134e4a)",padding:"14px 20px",display:"flex",alignItems:"center",gap:12}}>
        <div><div style={{color:"#f1f5f9",fontWeight:700}}>Learning Hub — IT Support</div><div style={{color:"#64748b",fontSize:"0.75rem"}}>Welcome, {name}</div></div>
        <button onClick={()=>setScreen("name")} style={{marginLeft:"auto",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"#94a3b8",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:"0.75rem"}}>Switch User</button>
        <button onClick={signOut} style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:"0.75rem"}}>Sign Out</button>
      </div>
      <div style={{maxWidth:740,margin:"0 auto",padding:"24px 16px"}}>
        <h2 style={{fontSize:"1.3rem",fontWeight:700,color:"#0f172a",margin:"0 0 5px"}}>Choose a Module, {name}</h2>
        <p style={{color:"#64748b",fontSize:"0.9rem",marginBottom:20}}>Each module has 10 scenario-based questions. Type your answer and get instant feedback.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>
          {IT_MODULES.map(m=>(
            <div key={m.id} onClick={()=>openModule(m)}
              style={{background:"#fff",borderRadius:16,padding:"18px 16px",cursor:"pointer",border:"1px solid #e2e8f0",transition:"all 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 20px ${m.color}30`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)";}}>
              <div style={{width:40,height:40,borderRadius:12,background:`${m.color}18`,border:`1px solid ${m.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:m.color,marginBottom:10}}>M{m.id}</div>
              <div style={{fontWeight:700,fontSize:"0.9rem",color:"#0f172a",marginBottom:3}}>{m.title}</div>
              <div style={{fontSize:"0.78rem",color:"#64748b",marginBottom:10}}>{m.desc}</div>
              <span style={{fontSize:9,background:`${m.color}15`,color:m.color,borderRadius:4,padding:"2px 6px",fontWeight:600}}>10 SCENARIOS</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Module screen — full-width scenario quiz
  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",background:"#f8fafc"}}>
      <div style={{background:mod?`linear-gradient(135deg,${mod.color}e0,${mod.color}90)`:"linear-gradient(135deg,#0f172a,#134e4a)",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={()=>setScreen("hub")} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:"0.8rem"}}>← Hub</button>
        {mod&&<div style={{fontWeight:700,color:"#fff",fontSize:"0.95rem"}}>Module {mod.id}: {mod.title}</div>}
        <div style={{marginLeft:"auto",color:"rgba(255,255,255,0.6)",fontSize:"0.75rem"}}>10 scenario questions</div>
      </div>
      <div style={{flex:1,overflow:"hidden"}}>
        {activeModule&&mod&&<ITScenarioQuiz moduleId={activeModule} color={mod.color} onBack={()=>setScreen("hub")}/>}
      </div>
    </div>
  );
}

// ── MAIN APP ──
export default function App() {
  const [portal,setPortal]=useState(()=>localStorage.getItem("hub_portal")||null);
  const select=(p)=>{ localStorage.setItem("hub_portal",p); setPortal(p); };
  const resetPortal=()=>{ localStorage.removeItem("hub_portal"); setPortal(null); };
  if(!portal) return <PortalScreen onSelect={select}/>;
  if(portal==="networking") return <NetworkingApp onPortalReset={resetPortal}/>;
  return <ITApp onPortalReset={resetPortal}/>;
}
