import { useState, useCallback, useEffect, useMemo } from "react";

const MODULES = [
  { id:"resp", icon:"◧", label:"Shared Responsibility", color:"#0078d4" },
  { id:"hier", icon:"⊞", label:"Resource Hierarchy", color:"#50e6ff" },
  { id:"regions", icon:"◎", label:"Regions & Zones", color:"#00b7c3" },
  { id:"compute", icon:"⬡", label:"Compute Services", color:"#b4a0ff" },
  { id:"network", icon:"⬟", label:"Networking", color:"#ffb900" },
  { id:"storage", icon:"◈", label:"Storage & Redundancy", color:"#ff8c00" },
  { id:"identity", icon:"◉", label:"Identity & Zero Trust", color:"#e74856" },
  { id:"govern", icon:"◆", label:"Governance & Purview", color:"#00cc6a" },
  { id:"cost", icon:"◇", label:"Cost & Pricing", color:"#ffd700" },
  { id:"monitor", icon:"◎", label:"Monitoring & Alerts", color:"#0078d4" },
  { id:"migrate", icon:"⇄", label:"Migration Tools", color:"#9333ea" },
];

const RESP_LAYERS = [
  { id:"physical", label:"Physical hosts / network / datacenter", icon:"🏢" },
  { id:"os", label:"Operating system", icon:"💻" },
  { id:"network", label:"Network controls", icon:"🌐" },
  { id:"app", label:"Application", icon:"📦" },
  { id:"identity", label:"Identity & directory", icon:"🔑" },
  { id:"data", label:"Data", icon:"💾" },
  { id:"devices", label:"Devices (mobile & PCs)", icon:"📱" },
  { id:"accounts", label:"Accounts & identities", icon:"👤" },
];

const RESP_MATRIX = {
  IaaS:["ms","you","you","you","shared","you","you","you"],
  PaaS:["ms","ms","shared","shared","shared","you","you","you"],
  SaaS:["ms","ms","ms","ms","shared","shared","you","you"],
  "On-Prem":["you","you","you","you","you","you","you","you"],
};

const REGIONS_DATA = [
  { name:"East US", x:28.1, y:29.2, zones:3, paired:"West US", services:200, city:"Virginia" },
  { name:"West US", x:16.0, y:23.6, zones:3, paired:"East US", services:180, city:"Washington" },
  { name:"Central US", x:24.0, y:26.9, zones:3, paired:"East US 2", services:170, city:"Iowa" },
  { name:"North Europe", x:48.3, y:20.4, zones:3, paired:"West Europe", services:195, city:"Dublin" },
  { name:"West Europe", x:51.4, y:20.9, zones:3, paired:"North Europe", services:200, city:"Netherlands" },
  { name:"UK South", x:50.0, y:21.4, zones:3, paired:"UK West", services:180, city:"London" },
  { name:"Southeast Asia", x:78.8, y:49.3, zones:3, paired:"East Asia", services:175, city:"Singapore" },
  { name:"East Asia", x:81.7, y:37.6, zones:3, paired:"Southeast Asia", services:170, city:"Hong Kong" },
  { name:"Japan East", x:88.8, y:30.2, zones:3, paired:"Japan West", services:180, city:"Tokyo" },
  { name:"Australia East", x:92.0, y:68.8, zones:3, paired:"Australia SE", services:165, city:"Sydney" },
  { name:"Brazil South", x:37.1, y:63.1, zones:3, paired:"South Central US", services:140, city:"São Paulo" },
  { name:"South Africa N", x:57.8, y:64.6, zones:3, paired:"South Africa W", services:120, city:"Johannesburg" },
  { name:"Central India", x:70.5, y:39.7, zones:3, paired:"South India", services:155, city:"Pune" },
  { name:"Canada Central", x:27.9, y:25.7, zones:3, paired:"Canada East", services:160, city:"Toronto" },
  { name:"UAE North", x:65.4, y:36.0, zones:3, paired:"UAE Central", services:130, city:"Dubai" },
  { name:"US Gov Virginia", x:28.5, y:29.5, zones:0, paired:"US Gov Texas", sovereign:true, city:"Gov" },
  { name:"China East", x:83.8, y:32.7, zones:0, paired:"China North", sovereign:true, city:"Shanghai" },
];

const HIERARCHY_DATA = {
  name:"Contoso Root MG", type:"mg", children:[
    { name:"Production MG", type:"mg", children:[
      { name:"Prod Subscription", type:"sub", cost:"$4,200/mo", children:[
        { name:"rg-webapp-prod", type:"rg", region:"East US", children:[
          { name:"app-service-01", type:"res", kind:"App Service", icon:"▣" },
          { name:"sql-db-prod", type:"res", kind:"SQL Database", icon:"◫" },
          { name:"storage-prod", type:"res", kind:"Storage Account", icon:"◨" },
          { name:"redis-cache-01", type:"res", kind:"Azure Cache", icon:"◇" },
        ]},
        { name:"rg-network-prod", type:"rg", region:"East US", children:[
          { name:"vnet-prod", type:"res", kind:"Virtual Network", icon:"⬡" },
          { name:"nsg-frontend", type:"res", kind:"NSG", icon:"◈" },
          { name:"pip-lb-01", type:"res", kind:"Public IP", icon:"◎" },
          { name:"agw-prod", type:"res", kind:"App Gateway", icon:"⬟" },
        ]},
      ]},
    ]},
    { name:"Dev/Test MG", type:"mg", children:[
      { name:"Dev Subscription", type:"sub", cost:"$890/mo", children:[
        { name:"rg-devtest", type:"rg", region:"West US", children:[
          { name:"vm-dev-01", type:"res", kind:"Virtual Machine", icon:"⬢" },
          { name:"vm-dev-02", type:"res", kind:"Virtual Machine", icon:"⬢" },
          { name:"cosmos-dev", type:"res", kind:"Cosmos DB", icon:"◫" },
        ]},
      ]},
    ]},
    { name:"Sandbox MG", type:"mg", children:[
      { name:"Learning Subscription", type:"sub", cost:"$50/mo", children:[
        { name:"rg-sandbox", type:"rg", region:"West US", children:[
          { name:"vm-learn-01", type:"res", kind:"Virtual Machine", icon:"⬢" },
        ]},
      ]},
    ]},
  ]
};

const COMPUTE_TYPES = [
  { id:"vm", name:"Virtual Machines", cat:"IaaS", icon:"⬢", color:"#ef4444", control:"Full OS control", scale:"Manual / Scale Sets", cost:"Per-second billing", use:"Legacy apps, custom software, full admin access", startup:"Minutes", you:["OS patches","Runtime","App code","Data"], ms:["Hardware","Network","Datacenter"] },
  { id:"app", name:"App Service", cat:"PaaS", icon:"▣", color:"#3b82f6", control:"Code only, managed OS", scale:"Auto-scale built in", cost:"Per App Service Plan", use:"Web apps, REST APIs, mobile backends", startup:"Seconds", you:["App code","Data"], ms:["Hardware","OS","Runtime","Scaling"] },
  { id:"func", name:"Functions", cat:"Serverless", icon:"ϟ", color:"#10b981", control:"Single function code", scale:"Infinite auto-scale", cost:"Per execution + time", use:"Event-driven, microservices, automation", startup:"Milliseconds", you:["Function code"], ms:["Everything else"] },
  { id:"aci", name:"Container Instances", cat:"PaaS", icon:"▥", color:"#8b5cf6", control:"Container image", scale:"Manual per group", cost:"Per second (vCPU + mem)", use:"Quick container runs, batch jobs", startup:"Seconds", you:["Container image","Data"], ms:["Hardware","Orchestration","OS"] },
  { id:"avd", name:"Virtual Desktop", cat:"IaaS", icon:"⊞", color:"#f59e0b", control:"Full desktop experience", scale:"Per-user or pooled", cost:"Per-user/hour", use:"Remote workers, BYOD, secure desktop", startup:"Minutes", you:["Desktop config","User data","Apps"], ms:["Hardware","Host infra","Gateway"] },
];

const STORAGE_TIERS = [
  { name:"Hot", color:"#ef4444", storeCost:20.8, accessCost:0.44, desc:"Frequently accessed", icon:"🔥" },
  { name:"Cool", color:"#3b82f6", storeCost:10, accessCost:1, desc:"30+ days infrequent", icon:"❄️" },
  { name:"Cold", color:"#6366f1", storeCost:3.6, accessCost:1, desc:"90+ days rare", icon:"🧊" },
  { name:"Archive", color:"#1e293b", storeCost:1.0, accessCost:5, desc:"180+ days offline", icon:"📦" },
];

const REDUNDANCY = [
  { id:"LRS", name:"Locally Redundant", copies:3, scope:"Single datacenter", regions:1, zones:1, durability:"11 nines", color:"#64748b", desc:"3 copies in 1 datacenter. Cheapest. No zone/region protection." },
  { id:"ZRS", name:"Zone-Redundant", copies:3, scope:"3 zones, 1 region", regions:1, zones:3, durability:"12 nines", color:"#3b82f6", desc:"1 copy per zone. Survives zone failures. No region protection." },
  { id:"GRS", name:"Geo-Redundant", copies:6, scope:"2 regions", regions:2, zones:1, durability:"16 nines", color:"#8b5cf6", desc:"LRS in primary + LRS in paired region. Failover required for secondary read." },
  { id:"RAGRS", name:"Read-Access Geo", copies:6, scope:"2 regions, read secondary", regions:2, zones:1, durability:"16 nines", color:"#e74856", read:true, desc:"Like GRS but secondary region is always readable. Best durability." },
  { id:"GZRS", name:"Geo-Zone-Redundant", copies:6, scope:"3 zones + paired region", regions:2, zones:3, durability:"16 nines", color:"#10b981", desc:"ZRS primary + LRS secondary. Zone AND region protection. Best of both worlds." },
];

const NETWORK_SERVICES = [
  { id:"vnet", name:"Virtual Network", icon:"⬡", desc:"Isolated network in Azure", color:"#0078d4" },
  { id:"subnet", name:"Subnets", icon:"▤", desc:"Segments within a VNet", color:"#3b82f6" },
  { id:"nsg", name:"NSG", icon:"🛡️", desc:"Firewall rules per subnet/NIC", color:"#f59e0b" },
  { id:"vpn", name:"VPN Gateway", icon:"🔐", desc:"Encrypted tunnel to on-prem", color:"#10b981" },
  { id:"er", name:"ExpressRoute", icon:"⚡", desc:"Private fiber to Azure (no internet)", color:"#8b5cf6" },
  { id:"lb", name:"Load Balancer", icon:"⇄", desc:"Distributes traffic across VMs", color:"#06b6d4" },
  { id:"appgw", name:"App Gateway", icon:"🌐", desc:"Layer 7 LB + WAF", color:"#f472b6" },
  { id:"dns", name:"Azure DNS", icon:"🏷️", desc:"Host DNS zones in Azure", color:"#a78bfa" },
  { id:"peer", name:"VNet Peering", icon:"↔", desc:"Connect VNets directly (no gateway)", color:"#fbbf24" },
  { id:"pip", name:"Public Endpoint", icon:"🌍", desc:"Internet-accessible IP", color:"#ef4444" },
  { id:"pep", name:"Private Endpoint", icon:"🔒", desc:"Access PaaS over private VNet IP", color:"#10b981" },
];

const GOVERN_RESOURCES = [
  { id:"vm1", name:"vm-prod-web", type:"Virtual Machine", region:"East US", rg:"rg-production", tags:{}, locked:null },
  { id:"vm2", name:"vm-dev-test", type:"Virtual Machine", region:"West US", rg:"rg-development", tags:{}, locked:null },
  { id:"sql1", name:"sql-customer-db", type:"SQL Database", region:"East US", rg:"rg-production", tags:{}, locked:null },
  { id:"st1", name:"storageblob01", type:"Storage Account", region:"East US", rg:"rg-production", tags:{}, locked:null },
  { id:"vn1", name:"vnet-main", type:"Virtual Network", region:"West Europe", rg:"rg-network", tags:{}, locked:null },
  { id:"kv1", name:"keyvault-prod", type:"Key Vault", region:"East US", rg:"rg-security", tags:{}, locked:null },
];

const POLICIES = [
  { id:"loc", name:"Allowed Locations", desc:"Only East US and West US allowed", check:(r) => ["East US","West US"].includes(r.region), icon:"📍" },
  { id:"tag", name:"Require 'Environment' Tag", desc:"Every resource must have Environment tag", check:(r) => !!r.tags?.Environment, icon:"🏷️" },
  { id:"novm", name:"No VMs in Dev RG", desc:"Deny Virtual Machines in rg-development", check:(r) => !(r.type==="Virtual Machine" && r.rg==="rg-development"), icon:"🚫" },
  { id:"lock", name:"Prod Must Be Locked", desc:"Resources in rg-production must have a lock", check:(r) => r.rg!=="rg-production" || r.locked!==null, icon:"🔒" },
];

const F = "'DM Sans', sans-serif";
const MM = "'Fira Code', monospace";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600;700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f1219; overflow: hidden; }
  @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.06); } }
  @keyframes glow { 0%,100% { box-shadow:0 0 8px rgba(0,120,212,0.3); } 50% { box-shadow:0 0 20px rgba(0,120,212,0.6); } }
  @keyframes ripple { 0% { box-shadow:0 0 0 0 rgba(0,120,212,0.4); } 100% { box-shadow:0 0 0 20px rgba(0,120,212,0); } }
  @keyframes slideBar { from { transform:scaleX(0); } to { transform:scaleX(1); } }
  @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
  @keyframes popIn { 0% { transform:scale(0.5); opacity:0; } 60% { transform:scale(1.1); } 100% { transform:scale(1); opacity:1; } }
  @keyframes gradShift { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
  @keyframes dashFlow { to { stroke-dashoffset:-14; } }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
  @keyframes sparkle { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
  @keyframes orbit { 0% { transform:rotate(0deg) translateX(20px) rotate(0deg); } 100% { transform:rotate(360deg) translateX(20px) rotate(-360deg); } }
  @keyframes scanline { 0% { top:-2px; } 100% { top:100%; } }
  .fade-in { animation: fadeSlideIn 0.3s ease-out; }
  .pop-in { animation: popIn 0.35s cubic-bezier(.34,1.56,.64,1); }
  .pulse-anim { animation: pulse 2s ease-in-out infinite; }
  .glow-box { animation: glow 2s ease-in-out infinite; }
  .ripple-anim { animation: ripple 1.5s ease-out infinite; }
  .float-anim { animation: float 3s ease-in-out infinite; }
  .sparkle-anim { animation: sparkle 1.5s ease-in-out infinite; }
  .bar-fill { animation: slideBar 0.5s ease-out forwards; transform-origin: left; }
  .grad-bg { background-size:200% 200%; animation: gradShift 4s ease infinite; }
  .nav-btn { transition: all 0.15s ease; cursor: pointer; border: none; outline: none; }
  .nav-btn:hover { background: rgba(255,255,255,0.06) !important; }
  .nav-btn.active { background: rgba(0,120,212,0.12) !important; }
  .card { transition: all 0.15s ease; cursor: pointer; }
  .card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  .icon-btn { transition: all 0.12s; cursor: pointer; }
  .icon-btn:hover { filter: brightness(1.3); }
  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#252a3a; border-radius:3px; }
`;

function SectionLabel({ children, color }) {
  return (<div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}><div style={{ width:3, height:20, borderRadius:2, background:color }} /><span style={{ fontWeight:700, fontSize:15, color:"#e2e8f0" }}>{children}</span></div>);
}

export default function AzureSandbox() {
  const [active, setActive] = useState("resp");
  const [sideOpen, setSideOpen] = useState(true);
  const mod = MODULES.find(m => m.id === active);

  return (
    <>
      <style>{CSS}</style>
      <div style={{ height:"100vh", display:"flex", fontFamily:F, color:"#e2e8f0", background:"#0f1219", overflow:"hidden" }}>
        <div style={{ width: sideOpen ? 210 : 52, background:"#0a0d14", borderRight:"1px solid #1a1f2e", display:"flex", flexDirection:"column", transition:"width 0.25s ease", flexShrink:0, overflow:"hidden" }}>
          <div style={{ padding: sideOpen ? "14px" : "14px 10px", borderBottom:"1px solid #1a1f2e", display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={() => setSideOpen(p => !p)}>
            <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#0078d4,#00b7c3)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0 }}>A</div>
            {sideOpen && <div><div style={{ fontWeight:800, fontSize:13 }}>Azure Sandbox</div><div style={{ fontSize:9, color:"#334155" }}>Visual Learning OS</div></div>}
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
            {MODULES.map(m => (
              <button key={m.id} className={`nav-btn ${active===m.id?"active":""}`} onClick={() => setActive(m.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 14px", background:"transparent", color: active===m.id ? "#fff" : "#64748b", fontFamily:F, fontSize:12, fontWeight: active===m.id ? 700 : 500, textAlign:"left", borderLeft:`3px solid ${active===m.id ? m.color : "transparent"}` }}>
                <span style={{ fontSize:14, flexShrink:0, width:18, textAlign:"center", color: active===m.id ? m.color : "#64748b" }}>{m.icon}</span>
                {sideOpen && <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.label}</span>}
              </button>
            ))}
          </div>
          {sideOpen && <div style={{ padding:"10px 14px", borderTop:"1px solid #1a1f2e", fontSize:9, color:"#1e293b" }}>No Azure account needed</div>}
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"10px 24px", borderBottom:"1px solid #1a1f2e", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:mod.color }} />
            <span style={{ fontWeight:700, fontSize:14 }}>{mod.label}</span>
            <div style={{ flex:1 }} />
            <span style={{ fontSize:10, color:"#252a3a", fontFamily:MM }}>sandbox://azure/{mod.id}</span>
          </div>
          <div className="fade-in" key={active} style={{ flex:1, overflow:"auto", padding:"20px 24px" }}>
            {active==="resp" && <SharedResponsibility />}
            {active==="hier" && <ResourceHierarchy />}
            {active==="regions" && <RegionsZones />}
            {active==="compute" && <ComputeServices />}
            {active==="network" && <NetworkSandbox />}
            {active==="storage" && <StorageModule />}
            {active==="identity" && <IdentityModule />}
            {active==="govern" && <GovernanceModule />}
            {active==="cost" && <CostModule />}
            {active==="monitor" && <MonitorModule />}
            {active==="migrate" && <MigrateModule />}
          </div>
        </div>
      </div>
    </>
  );
}

function SharedResponsibility() {
  const [model, setModel] = useState("IaaS");
  const [hovered, setHovered] = useState(null);
  const matrix = RESP_MATRIX[model];
  const colors = { ms:"#0078d4", you:"#e74856", shared:"#ffb900" };
  const labels = { ms:"Microsoft", you:"Customer", shared:"Shared" };
  // Count responsibilities
  const msCount = matrix.filter(x=>x==="ms").length;
  const youCount = matrix.filter(x=>x==="you").length;
  const sharedCount = matrix.filter(x=>x==="shared").length;

  return (
    <div style={{ maxWidth:720, margin:"0 auto" }}>
      <SectionLabel color="#0078d4">Cloud Model Comparison</SectionLabel>
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {["On-Prem","IaaS","PaaS","SaaS"].map(m => (
          <button key={m} className="card" onClick={() => setModel(m)}
            style={{ flex:1, padding:"18px 8px", background: model===m ? "#141720" : "#0a0d14", border: model===m ? "2px solid #0078d4" : "2px solid #141720", borderRadius:14, fontFamily:F, textAlign:"center" }}>
            <div style={{ fontFamily:MM, fontSize:16, fontWeight:700, color: model===m ? "#0078d4" : "#475569", marginBottom:4 }}>{m}</div>
            <div style={{ fontSize:10, color:"#475569" }}>
              {m==="On-Prem"?"You own everything":m==="IaaS"?"You manage most":m==="PaaS"?"Shared control":"Provider manages most"}
            </div>
          </button>
        ))}
      </div>

      {/* Visual summary bar */}
      <div style={{ display:"flex", height:8, borderRadius:4, overflow:"hidden", marginBottom:20, gap:2 }}>
        <div className="bar-fill" key={model+"ms"} style={{ flex:msCount, background:colors.ms, borderRadius:4 }} />
        <div className="bar-fill" key={model+"sh"} style={{ flex:sharedCount, background:colors.shared, borderRadius:4 }} />
        <div className="bar-fill" key={model+"you"} style={{ flex:youCount, background:colors.you, borderRadius:4 }} />
      </div>
      <div style={{ display:"flex", gap:16, marginBottom:20, justifyContent:"center" }}>
        {[{k:"ms",l:"Microsoft"},{k:"shared",l:"Shared"},{k:"you",l:"Customer"}].map(x => (
          <div key={x.k} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:colors[x.k] }} />
            <span style={{ fontSize:11, color:"#94a3b8" }}>{x.l}</span>
          </div>
        ))}
      </div>

      {/* Layer stack */}
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {RESP_LAYERS.map((layer, i) => {
          const who = matrix[i];
          const isHov = hovered === i;
          const msPct = who==="ms"?100:who==="shared"?50:0;
          return (
            <div key={layer.id} className="fade-in" style={{ animationDelay: `${i*40}ms`, animationFillMode:"both" }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div style={{ display:"flex", alignItems:"center", gap:0, borderRadius:8, overflow:"hidden", transition:"all 0.2s", transform: isHov ? "scale(1.01)" : "none", boxShadow: isHov ? `0 0 12px ${colors[who]}15` : "none" }}>
                <div style={{ width:170, padding:"9px 12px", background:"#141720", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                  <span style={{ fontSize:15, width:22, textAlign:"center" }}>{layer.icon}</span>
                  <span style={{ fontSize:11, color:"#cbd5e1" }}>{layer.label}</span>
                </div>
                <div style={{ flex:1, height:36, display:"flex" }}>
                  <div key={model+layer.id+"ms"} style={{ width:`${msPct}%`, height:"100%", background:`linear-gradient(90deg, #0078d4cc, #0078d488)`, transition:"width 0.5s cubic-bezier(.4,0,.2,1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {msPct >= 40 && <span style={{ fontFamily:MM, fontSize:7, color:"#fff", fontWeight:700, opacity:0.8 }}>MICROSOFT</span>}
                  </div>
                  <div key={model+layer.id+"you"} style={{ width:`${100-msPct}%`, height:"100%", background: who==="shared"?`repeating-linear-gradient(135deg, #ffb90025, #ffb90025 3px, #ffb90010 3px, #ffb90010 6px)`:`linear-gradient(90deg, #e7485688, #e74856aa)`, transition:"width 0.5s cubic-bezier(.4,0,.2,1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {(100-msPct) >= 40 && <span style={{ fontFamily:MM, fontSize:7, color:"#fff", fontWeight:700, opacity:0.8 }}>{who==="shared"?"SHARED":"CUSTOMER"}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop:20, display:"grid", gridTemplateColumns:"140px 1fr", gap:16 }}>
        {/* Donut chart */}
        <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            {(() => {
              const total = 8;
              const segments = [{who:"ms",count:msCount},{who:"shared",count:sharedCount},{who:"you",count:youCount}];
              let offset = 0;
              const circumference = 2 * Math.PI * 45;
              return segments.filter(s=>s.count>0).map((s,i) => {
                const pct = s.count / total;
                const dash = pct * circumference;
                const gap = circumference - dash;
                const el = <circle key={s.who} cx="60" cy="60" r="45" fill="none" stroke={colors[s.who]} strokeWidth="16" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)" style={{transition:"all 0.6s cubic-bezier(.4,0,.2,1)"}} />;
                offset += dash;
                return el;
              });
            })()}
            <text x="60" y="56" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="800" fontFamily="'Fira Code'">{model}</text>
            <text x="60" y="72" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="'DM Sans'">model</text>
          </svg>
        </div>
        {/* Stats + tip */}
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            {[{who:"ms",label:"Microsoft"},{who:"shared",label:"Shared"},{who:"you",label:"Customer"}].map(s => {
              const count = matrix.filter(x=>x===s.who).length;
              return count > 0 ? (
                <div key={s.who} className="pop-in" style={{ flex:1, padding:"8px 10px", background:`${colors[s.who]}08`, border:`1px solid ${colors[s.who]}25`, borderRadius:8, textAlign:"center" }}>
                  <div style={{ fontFamily:MM, fontSize:20, fontWeight:700, color:colors[s.who] }}>{count}</div>
                  <div style={{ fontSize:9, color:"#475569" }}>{s.label}</div>
                </div>
              ) : null;
            })}
          </div>
          <div style={{ padding:"10px 14px", background:"rgba(0,120,212,0.06)", borderRadius:8, borderLeft:"3px solid #0078d4" }}>
            <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.7 }}>
              <strong style={{ color:"#60a5fa" }}>Always yours:</strong> Data, Devices, Accounts — no matter which model.
            </div>
          </div>
          <div style={{ padding:"8px 14px", background:"rgba(255,185,0,0.04)", borderRadius:8, marginTop:6, borderLeft:"3px solid #ffb900" }}>
            <div style={{ fontSize:10, color:"#fbbf24", fontWeight:700 }}>📝 Exam Tip</div>
            <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>Microsoft ALWAYS manages physical infrastructure. Customer ALWAYS manages data, accounts, and devices.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceHierarchy() {
  const [expanded, setExpanded] = useState({"Contoso Root MG":true, "Production MG":true, "Prod Subscription":true, "rg-webapp-prod":true});
  const toggle = (name) => setExpanded(p => ({...p, [name]: !p[name]}));
  const tc = { mg:"#b4a0ff", sub:"#50e6ff", rg:"#ffb900", res:"#94a3b8" };
  const tl = { mg:"Management Group", sub:"Subscription", rg:"Resource Group", res:"Resource" };
  const bgc = { mg:"rgba(180,160,255,0.06)", sub:"rgba(80,230,255,0.06)", rg:"rgba(255,185,0,0.06)", res:"transparent" };
  const [selNode, setSelNode] = useState(null);

  const renderNode = (node, depth=0, parentPath="") => {
    const path = parentPath + "/" + node.name;
    const isOpen = expanded[node.name];
    const hasKids = node.children?.length > 0;
    const col = tc[node.type];
    const isSel = selNode === path;
    return (
      <div key={path}>
        <div className="card" onClick={() => { if(hasKids) toggle(node.name); setSelNode(isSel ? null : path); }}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", marginLeft:depth*28, marginBottom:3, background: isSel ? bgc[node.type] : "#0d1117", borderRadius:10, borderLeft:`3px solid ${col}`, border: isSel ? `1px solid ${col}40` : "1px solid transparent" }}>
          {hasKids ? (
            <span style={{ fontSize:10, color:col, width:16, textAlign:"center", transition:"transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0)", fontWeight:700 }}>▶</span>
          ) : (
            <span style={{ fontSize:14, width:16, textAlign:"center" }}>{node.icon || "•"}</span>
          )}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{node.name}</div>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:2 }}>
              <span style={{ fontFamily:MM, fontSize:9, color:col, background:`${col}15`, padding:"1px 6px", borderRadius:3 }}>{tl[node.type]}</span>
              {node.kind && <span style={{ fontSize:10, color:"#475569" }}>{node.kind}</span>}
              {node.region && <span style={{ fontSize:10, color:"#334155" }}>📍 {node.region}</span>}
              {node.cost && <span style={{ fontFamily:MM, fontSize:10, color:"#10b981" }}>{node.cost}</span>}
            </div>
          </div>
          {hasKids && <span style={{ fontFamily:MM, fontSize:10, color:"#334155" }}>{node.children.length}</span>}
        </div>
        {isOpen && hasKids && (
          <div style={{ borderLeft:`1px dashed ${col}30`, marginLeft: depth*28+16 }}>
            {node.children.map(c => renderNode(c, depth+1, path))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth:700, margin:"0 auto" }}>
      <SectionLabel color="#50e6ff">Azure Resource Hierarchy</SectionLabel>
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        {Object.entries(tc).map(([k,v]) => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", background:"#0d1117", borderRadius:8, border:"1px solid #1a1f2e" }}>
            <div style={{ width:10, height:10, borderRadius:3, background:v }} />
            <span style={{ fontSize:11, color:"#94a3b8" }}>{tl[k]}</span>
          </div>
        ))}
      </div>
      {renderNode(HIERARCHY_DATA)}
      <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div style={{ padding:"12px 16px", background:"#0d1117", borderRadius:10, border:"1px solid #1a1f2e" }}>
          <div style={{ fontSize:10, color:"#475569", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>RBAC Inheritance ↓</div>
          {/* Visual cascade */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
            {[{l:"Management Group",w:"100%",c:"#b4a0ff"},{l:"Subscription",w:"85%",c:"#50e6ff"},{l:"Resource Group",w:"70%",c:"#ffb900"},{l:"Resource",w:"55%",c:"#94a3b8"}].map((s,i) => (
              <div key={s.l} style={{ width:s.w, padding:"4px 8px", background:`${s.c}08`, border:`1px solid ${s.c}30`, borderRadius:6, textAlign:"center", fontSize:9, color:s.c, fontWeight:600, transition:"all 0.3s" }}>
                {i > 0 && <div style={{ fontSize:8, color:"#334155", marginBottom:1 }}>↓ inherits</div>}
                {s.l}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:"12px 16px", background:"#0d1117", borderRadius:10, border:"1px solid #1a1f2e" }}>
          <div style={{ fontSize:10, color:"#475569", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Key Rules</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {[{t:"1 Resource → 1 RG",d:"Cannot belong to multiple groups",c:"#ffb900"},{t:"Delete RG = Delete All",d:"Shared lifecycle for everything inside",c:"#ef4444"},{t:"RG ≠ Region Lock",d:"RG has a region, but resources inside can be anywhere",c:"#3b82f6"}].map(r => (
              <div key={r.t} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:r.c, flexShrink:0 }} />
                <div><div style={{ fontSize:11, fontWeight:600, color:r.c }}>{r.t}</div><div style={{ fontSize:9, color:"#475569" }}>{r.d}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RegionsZones() {
  const [sel, setSel] = useState(null);
  const [showZoneDetail, setShowZoneDetail] = useState(false);
  const selected = REGIONS_DATA.find(r => r.name === sel);
  const paired = selected ? REGIONS_DATA.find(r => r.name === selected.paired) : null;
  return (
    <div style={{ maxWidth:800, margin:"0 auto" }}>
      <SectionLabel color="#00b7c3">Global Infrastructure</SectionLabel>
      {/* Stats */}
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        {[{v:"60+",l:"Regions",c:"#00b7c3"},{v:"3",l:"Zones/Region",c:"#0078d4"},{v:"300+",l:"Services",c:"#50e6ff"},{v:"2",l:"Sovereign",c:"#e74856"}].map(s=>(
          <div key={s.l} style={{ flex:1, background:"#0d1117", borderRadius:10, padding:"10px 12px", textAlign:"center", border:"1px solid #1a1f2e" }}>
            <div style={{ fontFamily:MM, fontSize:18, fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:"#475569" }}>{s.l}</div>
          </div>
        ))}
      </div>
      {/* Map */}
      <div style={{ position:"relative", background:"#050810", borderRadius:16, border:"1px solid #1a1f2e", overflow:"hidden", aspectRatio:"2/1" }}>
        {/* World map outline SVG — equirectangular projection, viewBox matches % coords */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
          <defs>
            <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="#0078d4" stopOpacity="0.04"/><stop offset="100%" stopColor="transparent"/></radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#mapGlow)"/>
          {/* Lat/lon grid */}
          {[16.7,33.3,50,66.7,83.3].map(v=><line key={`h${v}`} x1="0" y1={v} x2="100" y2={v} stroke="#50e6ff" strokeWidth="0.08" strokeDasharray="0.5,1" opacity="0.3"/>)}
          {[16.7,33.3,50,66.7,83.3].map(v=><line key={`v${v}`} x1={v} y1="0" x2={v} y2="100" stroke="#50e6ff" strokeWidth="0.08" strokeDasharray="0.5,1" opacity="0.3"/>)}
          <line x1="0" y1="50" x2="100" y2="50" stroke="#00b7c3" strokeWidth="0.12" strokeDasharray="0.8,0.8" opacity="0.4"/>
          <text x="1" y="49.2" fill="#00b7c3" fontSize="1.8" opacity="0.4">Equator</text>
          {/* NORTH AMERICA */}
          <polygon fill="#50e6ff" opacity="0.12" stroke="#50e6ff" strokeWidth="0.15" strokeOpacity="0.3" points="
            3.3,13.9 5.6,11.1 16.7,11.1 23.6,11.1 30.6,13.9 33.3,17.2 34.7,23.3 32.5,25 30.6,26.7
            28.9,30.6 27.8,33.3 27.8,36.1 27.2,37.8 25.8,38.3 25,41.7 20.8,40.6 19.4,37.2 17.2,31.1
            16.1,29.4 16.1,23.3 14.4,20 8.3,16.7"/>
          {/* Greenland */}
          <polygon fill="#50e6ff" opacity="0.09" stroke="#50e6ff" strokeWidth="0.12" strokeOpacity="0.25" points="35,8.3 40,6.7 43,8.3 42,13.3 38,15 35,12.5"/>
          {/* SOUTH AMERICA */}
          <polygon fill="#50e6ff" opacity="0.12" stroke="#50e6ff" strokeWidth="0.15" strokeOpacity="0.3" points="
            28.6,47.2 31.4,44.4 33.9,46.7 40.3,52.8 39.4,58.3 38.1,62.8 37.2,63.3
            33.9,69.4 31.1,77.8 31.1,80.6 29.2,75.6 30.3,66.7 28.6,56.7 27.8,50"/>
          {/* EUROPE */}
          <polygon fill="#50e6ff" opacity="0.12" stroke="#50e6ff" strokeWidth="0.15" strokeOpacity="0.3" points="
            47.5,29.4 48.6,30 50.8,26.1 51.4,23.3 50,21.4 48.6,18.3 51.4,15.6 55,11.1
            57.2,12.2 57.8,27.2 56.7,28.9 54.2,28.9 52,27 50.8,28"/>
          {/* Iceland */}
          <polygon fill="#50e6ff" opacity="0.08" stroke="#50e6ff" strokeWidth="0.1" strokeOpacity="0.2" points="44.4,13.9 46,12.8 47.2,13.3 46.5,14.7 44.8,14.7"/>
          {/* AFRICA */}
          <polygon fill="#50e6ff" opacity="0.12" stroke="#50e6ff" strokeWidth="0.15" strokeOpacity="0.3" points="
            48.3,30.6 52.8,29.4 55.6,32.2 58.9,33.3 59.7,38.9 63.9,44.4 61.1,50.6
            59.7,63.9 55,69.4 53.3,62.2 50.8,46.7 45.3,42.2 47,34"/>
          {/* ASIA */}
          <polygon fill="#50e6ff" opacity="0.12" stroke="#50e6ff" strokeWidth="0.15" strokeOpacity="0.3" points="
            60,28.3 61.1,12.2 77.8,9.4 88.9,11.1 97.2,13.9 97.2,25 88.9,30 85.3,29.4
            83.3,33.3 80,44.4 78.1,42.2 76.7,40.6 75,37.2 72.2,45.6 70.5,40.6 68.6,36.1
            64.7,32.2"/>
          {/* India subcontinent */}
          <polygon fill="#50e6ff" opacity="0.1" stroke="#50e6ff" strokeWidth="0.12" strokeOpacity="0.25" points="
            68.6,36.1 72.8,36.7 75,37.2 73.6,42.2 71.4,45.6 69.2,42.8 68,38.9"/>
          {/* SE Asia / Indonesia */}
          <polygon fill="#50e6ff" opacity="0.08" stroke="#50e6ff" strokeWidth="0.1" strokeOpacity="0.2" points="76.7,40.6 78.1,42.2 80,44.4 82,47 84,50.6 82,52 78.8,49.3 77,46"/>
          {/* Japan */}
          <polygon fill="#50e6ff" opacity="0.08" stroke="#50e6ff" strokeWidth="0.1" strokeOpacity="0.2" points="88,28 90,27.5 89.5,31.5 88,33 87,30"/>
          {/* AUSTRALIA */}
          <polygon fill="#50e6ff" opacity="0.12" stroke="#50e6ff" strokeWidth="0.15" strokeOpacity="0.3" points="
            81.9,58.3 82.2,62.2 82.2,67.8 85,71.1 88.6,69.4 90.3,71.1 91.9,68.9
            92.5,65 90.6,59.4 85,58 81.7,57"/>
          {/* New Zealand */}
          <polygon fill="#50e6ff" opacity="0.07" stroke="#50e6ff" strokeWidth="0.08" strokeOpacity="0.15" points="96,67 96.8,69 96.2,72 95.5,71 95.8,68"/>
        </svg>
        {/* Region pair line + animated data packets */}
        {selected && paired && (
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:2 }}>
            <line x1={`${selected.x}%`} y1={`${selected.y}%`} x2={`${paired.x}%`} y2={`${paired.y}%`} stroke="#0078d4" strokeWidth="2" strokeDasharray="8,5" opacity="0.7">
              <animate attributeName="stroke-dashoffset" from="0" to="26" dur="2s" repeatCount="indefinite"/>
            </line>
            {[0,1,2].map(i => (
              <circle key={i} r="3" fill="#50e6ff" opacity="0">
                <animate attributeName="cx" from={`${selected.x}%`} to={`${paired.x}%`} dur="2.8s" repeatCount="indefinite" begin={`${i*0.9}s`}/>
                <animate attributeName="cy" from={`${selected.y}%`} to={`${paired.y}%`} dur="2.8s" repeatCount="indefinite" begin={`${i*0.9}s`}/>
                <animate attributeName="opacity" values="0;0.9;0.9;0" dur="2.8s" repeatCount="indefinite" begin={`${i*0.9}s`}/>
              </circle>
            ))}
          </svg>
        )}
        {/* Region dots */}
        {REGIONS_DATA.map(r => {
          const isSel = r.name === sel;
          const isPair = selected?.paired === r.name;
          const isActive = isSel || isPair;
          return (
            <div key={r.name} onClick={() => setSel(isSel ? null : r.name)}
              style={{ position:"absolute", left:`${r.x}%`, top:`${r.y}%`, transform:"translate(-50%,-50%)", cursor:"pointer", zIndex: isActive ? 10 : 1 }}>
              {/* Animated zone rings for selected */}
              {isSel && r.zones > 0 && (
                <svg style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", width:40, height:40, pointerEvents:"none" }}>
                  {[0,1,2].map(z => (
                    <circle key={z} cx="20" cy="20" r={12+z*3} fill="none" stroke="#50e6ff" strokeWidth="0.8" opacity="0.4">
                      <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" begin={`${z*0.3}s`} repeatCount="indefinite"/>
                      <animate attributeName="r" values={`${12+z*3};${13+z*3};${12+z*3}`} dur="2s" begin={`${z*0.3}s`} repeatCount="indefinite"/>
                    </circle>
                  ))}
                </svg>
              )}
              {/* Outer glow */}
              {isSel && <div style={{ position:"absolute", inset:-10, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,120,212,0.25) 0%, transparent 70%)" }} className="pulse-anim"/>}
              {/* Dot */}
              <div className={isSel ? "ripple-anim" : ""} style={{
                width: isSel ? 14 : isPair ? 12 : 8,
                height: isSel ? 14 : isPair ? 12 : 8,
                borderRadius:"50%",
                background: r.sovereign ? "#e74856" : isSel ? "#0078d4" : isPair ? "#50e6ff" : "#00b7c3",
                border: isActive ? "2px solid #fff" : "1.5px solid rgba(255,255,255,0.25)",
                boxShadow: `0 0 ${isActive?12:6}px ${r.sovereign?"#e7485680":isSel?"#0078d480":"#00b7c360"}`,
                transition:"all 0.2s"
              }} />
              {/* Label */}
              {isActive && (
                <div className="pop-in" style={{ position:"absolute", top:-36, left:"50%", transform:"translateX(-50%)", background:"#0d1117ee", border:`1px solid ${isSel?"#0078d4":"#50e6ff"}`, padding:"4px 10px", borderRadius:6, whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(0,0,0,0.7)" }}>
                  <div style={{ fontSize:10, fontWeight:700, color: isSel ? "#0078d4" : "#50e6ff" }}>{r.name}{r.sovereign && " 🔒"}</div>
                  <div style={{ fontSize:8, color:"#475569", textAlign:"center" }}>{r.city} · {r.zones}z · {r.services} svc</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Detail panel */}
      <div style={{ display:"flex", gap:12, marginTop:14 }}>
        <div style={{ flex:1, padding:16, background:"#0d1117", borderRadius:12, border:"1px solid #1a1f2e" }}>
          {selected ? (
            <div className="fade-in" key={sel}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <div className="pulse-anim" style={{ width:14, height:14, borderRadius:"50%", background: selected.sovereign ? "#e74856" : "#0078d4", boxShadow:`0 0 10px ${selected.sovereign?"#e74856":"#0078d4"}60` }} />
                <div>
                  <span style={{ fontWeight:700, fontSize:16, color:"#e2e8f0" }}>{selected.name}</span>
                  <div style={{ fontSize:10, color:"#475569" }}>📍 {selected.city}</div>
                </div>
                {selected.sovereign && <span style={{ fontSize:10, background:"rgba(231,72,86,0.15)", color:"#e74856", padding:"2px 8px", borderRadius:4 }}>Sovereign</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
                <div style={{ background:"#141720", borderRadius:8, padding:10, textAlign:"center" }}>
                  <div style={{ fontFamily:MM, fontSize:18, fontWeight:700, color:"#00b7c3" }}>{selected.zones || 0}</div>
                  <div style={{ fontSize:10, color:"#475569" }}>Avail. Zones</div>
                </div>
                <div style={{ background:"#141720", borderRadius:8, padding:10, textAlign:"center" }}>
                  <div style={{ fontFamily:MM, fontSize:18, fontWeight:700, color:"#50e6ff" }}>{selected.services}</div>
                  <div style={{ fontSize:10, color:"#475569" }}>Services</div>
                </div>
                <div style={{ background:"#141720", borderRadius:8, padding:10, textAlign:"center", cursor:"pointer" }} onClick={() => paired && setSel(selected.paired)}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#a78bfa" }}>{selected.paired}</div>
                  <div style={{ fontSize:10, color:"#475569" }}>Paired ↗</div>
                </div>
              </div>
              {/* Zone visual with infrastructure bars */}
              {selected.zones > 0 && (
                <div>
                  <div style={{ fontSize:9, color:"#475569", fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Independent Infrastructure per Zone</div>
                  <div style={{ display:"flex", gap:6 }}>
                    {[1,2,3].map(z => (
                      <div key={z} style={{ flex:1, background:"rgba(0,120,212,0.06)", border:"1.5px solid #0078d440", borderRadius:10, padding:8, textAlign:"center" }}>
                        <div style={{ fontFamily:MM, fontSize:12, fontWeight:700, color:"#60a5fa", marginBottom:6 }}>Zone {z}</div>
                        {[{i:"⚡",l:"Power",c:"#fbbf24"},{i:"❄️",l:"Cool",c:"#38bdf8"},{i:"🌐",l:"Net",c:"#10b981"}].map(inf=>(
                          <div key={inf.l} style={{ display:"flex", alignItems:"center", gap:3, marginBottom:3 }}>
                            <span style={{ fontSize:8 }}>{inf.i}</span>
                            <div style={{ flex:1, height:3, background:"#1a1f2e", borderRadius:2, overflow:"hidden" }}>
                              <div className="bar-fill" style={{ height:"100%", background:inf.c, borderRadius:2, width:"100%" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selected.sovereign && <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(231,72,86,0.08)", borderRadius:8, fontSize:11, color:"#f87171" }}>Physically & logically isolated. Operated by separate entity (e.g., 21Vianet for China).</div>}
            </div>
          ) : (
            <div style={{ padding:30, textAlign:"center", color:"#252a3a", fontSize:13 }}>Click a region on the map</div>
          )}
        </div>
        <div style={{ width:180, padding:14, background:"#0d1117", borderRadius:12, border:"1px solid #1a1f2e" }}>
          <div style={{ fontFamily:MM, fontSize:10, color:"#475569", marginBottom:10 }}>SLA BY DEPLOYMENT</div>
          {[{l:"Single VM",v:"99.9%",c:"#64748b"},{l:"Avail. Set",v:"99.95%",c:"#3b82f6"},{l:"Avail. Zones",v:"99.99%",c:"#10b981"}].map(s=>(
            <div key={s.l} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:11, color:"#94a3b8" }}>{s.l}</span>
                <span style={{ fontFamily:MM, fontSize:11, color:s.c, fontWeight:700 }}>{s.v}</span>
              </div>
              <div style={{ height:4, background:"#1a1f2e", borderRadius:2, overflow:"hidden" }}>
                <div className="bar-fill" style={{ height:"100%", background:s.c, borderRadius:2, width: s.v==="99.9%"?"33%":s.v==="99.95%"?"66%":"100%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComputeServices() {
  const [sel, setSel] = useState("vm");
  const active = COMPUTE_TYPES.find(c => c.id === sel);
  return (
    <div style={{ maxWidth:720, margin:"0 auto" }}>
      <SectionLabel color="#b4a0ff">Choose Your Compute</SectionLabel>
      {/* Service selector */}
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {COMPUTE_TYPES.map(c => (
          <button key={c.id} className="card" onClick={() => setSel(c.id)}
            style={{ flex:"1 1 110px", padding:"16px 8px", background: sel===c.id ? "#141720" : "#0a0d14", border: sel===c.id ? `2px solid ${c.color}` : "2px solid #141720", borderRadius:14, fontFamily:F, textAlign:"center" }}>
            <div className={sel===c.id ? "float-anim" : ""} style={{ fontSize:28, marginBottom:4, lineHeight:1 }}>{c.icon}</div>
            <div style={{ fontSize:11, fontWeight:700, color: sel===c.id ? "#e2e8f0" : "#475569" }}>{c.name}</div>
            <div style={{ fontFamily:MM, fontSize:9, color:c.color, marginTop:2 }}>{c.cat}</div>
          </button>
        ))}
      </div>
      {active && (
        <div className="fade-in" key={sel}>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:`${active.color}15`, border:`2px solid ${active.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{active.icon}</div>
            <div>
              <div style={{ fontWeight:700, fontSize:18, color:"#e2e8f0" }}>{active.name}</div>
              <span style={{ fontFamily:MM, fontSize:11, color:active.color }}>{active.cat}</span>
            </div>
          </div>
          {/* Spec grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            {[{l:"Control Level",v:active.control,i:"🎛️"},{l:"Scaling",v:active.scale,i:"📈"},{l:"Cost Model",v:active.cost,i:"💰"},{l:"Startup Time",v:active.startup,i:"⏱️"}].map(f=>(
              <div key={f.l} style={{ padding:"12px 14px", background:"#0d1117", borderRadius:10, border:"1px solid #1a1f2e" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:12 }}>{f.i}</span>
                  <span style={{ fontSize:10, color:"#475569", textTransform:"uppercase", letterSpacing:1 }}>{f.l}</span>
                </div>
                <div style={{ fontSize:13, color:"#e2e8f0", fontWeight:500 }}>{f.v}</div>
              </div>
            ))}
          </div>
          {/* Responsibility split visual */}
          <div style={{ display:"flex", gap:10, marginBottom:14 }}>
            <div style={{ flex:1, padding:"12px 14px", background:"rgba(231,72,86,0.06)", borderRadius:10, border:"1px solid #e7485620" }}>
              <div style={{ fontSize:10, color:"#e74856", fontWeight:700, marginBottom:8 }}>YOU MANAGE</div>
              {active.you.map(item => (
                <div key={item} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#e74856" }} />
                  <span style={{ fontSize:12, color:"#fca5a5" }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ flex:1, padding:"12px 14px", background:"rgba(0,120,212,0.06)", borderRadius:10, border:"1px solid #0078d420" }}>
              <div style={{ fontSize:10, color:"#0078d4", fontWeight:700, marginBottom:8 }}>MICROSOFT MANAGES</div>
              {active.ms.map(item => (
                <div key={item} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#0078d4" }} />
                  <span style={{ fontSize:12, color:"#93c5fd" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding:"10px 14px", background:"#0d1117", borderRadius:10, border:"1px solid #1a1f2e" }}>
            <div style={{ fontSize:10, color:"#475569", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>💡 Best For</div>
            <div style={{ fontSize:13, color:"#e2e8f0" }}>{active.use}</div>
          </div>
          {/* Control Spectrum */}
          <div style={{ padding:"14px 16px", background:"#080b12", borderRadius:10, border:"1px solid #1a1f2e", marginTop:10 }}>
            <div style={{ fontSize:10, color:"#475569", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Control vs Convenience</div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontFamily:MM, fontSize:9, color:"#ef4444" }}>FULL</span>
              <div className="grad-bg" style={{ flex:1, height:10, borderRadius:5, background:"linear-gradient(90deg, #ef4444, #f59e0b, #3b82f6, #8b5cf6, #10b981)", position:"relative" }}>
                <div className="pop-in" key={sel} style={{ position:"absolute", top:-4, width:18, height:18, borderRadius:"50%", background:"#fff", border:`3px solid ${active.color}`, boxShadow:`0 0 10px ${active.color}60`, transition:"left 0.5s cubic-bezier(.34,1.56,.64,1)", left: active.cat==="IaaS"?`${sel==="avd"?"15":"5"}%`:active.cat==="PaaS"?`${sel==="app"?"55":"42"}%`:"90%" }} />
              </div>
              <span style={{ fontFamily:MM, fontSize:9, color:"#10b981" }}>EASY</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, padding:"0 2px" }}>
              {["IaaS","PaaS","Serverless"].map(c => <span key={c} style={{ fontSize:9, color:"#334155" }}>{c}</span>)}
            </div>
          </div>
          {/* Quick stats */}
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            {[{l:"Cold Start",v:active.startup,c:active.color},{l:"Scale",v:active.cat==="Serverless"?"∞ Auto":active.scale.split(" ")[0],c:active.color},{l:"OS Access",v:active.cat==="IaaS"?"Full":active.cat==="PaaS"?"None":"None",c:active.color}].map(s=>(
              <div key={s.l} className="pop-in" style={{ flex:1, padding:"10px 10px", background:"#080b12", borderRadius:8, border:"1px solid #1a1f2e", textAlign:"center" }}>
                <div style={{ fontFamily:MM, fontSize:16, fontWeight:700, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:9, color:"#475569", marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NetworkSandbox() {
  const [nsgRules, setNsgRules] = useState([
    { port:443, action:"Allow", dir:"Inbound", label:"HTTPS", proto:"TCP" },
    { port:80, action:"Allow", dir:"Inbound", label:"HTTP", proto:"TCP" },
    { port:22, action:"Deny", dir:"Inbound", label:"SSH", proto:"TCP" },
    { port:3389, action:"Deny", dir:"Inbound", label:"RDP", proto:"TCP" },
    { port:1433, action:"Deny", dir:"Inbound", label:"SQL", proto:"TCP" },
  ]);
  const [selService, setSelService] = useState(null);
  const toggleRule = (i) => setNsgRules(p => p.map((r,j) => j===i ? {...r, action: r.action==="Allow"?"Deny":"Allow"} : r));
  const allowedPorts = nsgRules.filter(r=>r.action==="Allow").map(r=>r.port);

  return (
    <div style={{ maxWidth:780, margin:"0 auto" }}>
      <SectionLabel color="#ffb900">Network Architecture</SectionLabel>
      {/* Service pills */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {NETWORK_SERVICES.map(s => (
          <div key={s.id} className="card" onClick={() => setSelService(selService===s.id?null:s.id)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background: selService===s.id ? `${s.color}15` : "#0a0d14", border: selService===s.id ? `1.5px solid ${s.color}` : "1.5px solid #1a1f2e", borderRadius:20, cursor:"pointer" }}>
            <span style={{ fontSize:12 }}>{s.icon}</span>
            <span style={{ fontSize:11, fontWeight:600, color: selService===s.id ? s.color : "#64748b" }}>{s.name}</span>
          </div>
        ))}
      </div>
      {selService && (
        <div className="fade-in" style={{ padding:"10px 14px", background:"#0d1117", borderRadius:10, marginBottom:16, border:"1px solid #1a1f2e" }}>
          <span style={{ fontSize:12, color:"#e2e8f0" }}><strong style={{ color: NETWORK_SERVICES.find(s=>s.id===selService)?.color }}>{NETWORK_SERVICES.find(s=>s.id===selService)?.name}:</strong> {NETWORK_SERVICES.find(s=>s.id===selService)?.desc}</span>
        </div>
      )}
      {/* Visual diagram */}
      <div style={{ background:"#080b12", borderRadius:16, padding:20, border:"1px solid #1a1f2e", marginBottom:16, position:"relative", overflow:"hidden" }}>
        {/* Animated packets */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:3 }}>
          {allowedPorts.length > 0 && [0,1,2].map(i => (
            <circle key={i} r="3" fill="#10b981" opacity="0">
              <animate attributeName="cx" from="8%" to="50%" dur={`${1.8+i*0.3}s`} repeatCount="indefinite" begin={`${i*0.6}s`}/>
              <animate attributeName="cy" values="50%;48%;50%;52%;50%" dur={`${1.8+i*0.3}s`} repeatCount="indefinite" begin={`${i*0.6}s`}/>
              <animate attributeName="opacity" values="0;0.8;0.8;0" dur={`${1.8+i*0.3}s`} repeatCount="indefinite" begin={`${i*0.6}s`}/>
            </circle>
          ))}
          {nsgRules.filter(r=>r.action==="Deny").length > 0 && (
            <circle r="3" fill="#ef4444" opacity="0">
              <animate attributeName="cx" from="8%" to="24%" dur="0.9s" repeatCount="indefinite"/>
              <animate attributeName="cy" values="42%;40%;42%" dur="0.9s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;0.6;0" dur="0.9s" repeatCount="indefinite"/>
            </circle>
          )}
        </svg>
        <div style={{ display:"flex", alignItems:"stretch", gap:0 }}>
          {/* Internet */}
          <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", width:70 }}>
            <div className="pulse-anim" style={{ width:48, height:48, borderRadius:"50%", background:"#141720", border:"2px solid #334155", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🌐</div>
            <div style={{ fontSize:10, color:"#475569", marginTop:4 }}>Internet</div>
          </div>
          {/* Arrow */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", width:50, position:"relative" }}>
            <div style={{ width:"100%", height:2, background:"linear-gradient(90deg, #475569, #ffb900)" }} />
            {allowedPorts.length > 0 && <div style={{ position:"absolute", top:-14, fontSize:8, color:"#ffb900", fontFamily:MM, whiteSpace:"nowrap" }}>ports: {allowedPorts.join(",")}</div>}
          </div>
          {/* NSG Shield */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:50 }}>
            <div style={{ width:40, height:50, background:"rgba(255,185,0,0.1)", border:"2px solid #ffb900", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
              <span style={{ fontSize:16 }}>🛡️</span>
              <span style={{ fontFamily:MM, fontSize:7, color:"#ffb900" }}>NSG</span>
            </div>
          </div>
          {/* Arrow */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:30 }}>
            <div style={{ width:"100%", height:2, background:"#ffb900" }} />
          </div>
          {/* VNet */}
          <div style={{ flex:1, background:"rgba(0,120,212,0.05)", border:"2px dashed #0078d440", borderRadius:16, padding:14 }}>
            <div style={{ fontFamily:MM, fontSize:10, color:"#0078d4", marginBottom:10 }}>⬡ VNet: 10.0.0.0/16</div>
            <div style={{ display:"flex", gap:10 }}>
              <div style={{ flex:1, background:"rgba(59,130,246,0.06)", border:"1px solid #3b82f620", borderRadius:10, padding:10 }}>
                <div style={{ fontFamily:MM, fontSize:9, color:"#3b82f6", marginBottom:8 }}>▤ Frontend: 10.0.1.0/24</div>
                <div style={{ display:"flex", gap:6 }}>
                  {["vm-web-01","vm-web-02"].map(v => (
                    <div key={v} style={{ flex:1, background:"#0d1117", borderRadius:8, padding:8, textAlign:"center", border:"1px solid #1a1f2e" }}>
                      <div style={{ fontSize:14 }}>⬢</div>
                      <div style={{ fontFamily:MM, fontSize:7, color:"#94a3b8" }}>{v}</div>
                      <div style={{ fontFamily:MM, fontSize:7, color:"#334155" }}>10.0.1.{v.slice(-1)==="1"?"4":"5"}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex:1, background:"rgba(239,68,68,0.04)", border:"1px solid #ef444420", borderRadius:10, padding:10 }}>
                <div style={{ fontFamily:MM, fontSize:9, color:"#ef4444", marginBottom:8 }}>▤ Backend: 10.0.2.0/24</div>
                <div style={{ display:"flex", gap:6 }}>
                  <div style={{ flex:1, background:"#0d1117", borderRadius:8, padding:8, textAlign:"center", border:"1px solid #1a1f2e" }}>
                    <div style={{ fontSize:14 }}>◫</div>
                    <div style={{ fontFamily:MM, fontSize:7, color:"#94a3b8" }}>sql-db-01</div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:3, marginTop:2 }}>
                      <div style={{ width:5, height:5, borderRadius:"50%", background:"#10b981" }} />
                      <span style={{ fontFamily:MM, fontSize:7, color:"#10b981" }}>Private EP</span>
                    </div>
                  </div>
                  <div style={{ flex:1, background:"#0d1117", borderRadius:8, padding:8, textAlign:"center", border:"1px solid #1a1f2e" }}>
                    <div style={{ fontSize:14 }}>◨</div>
                    <div style={{ fontFamily:MM, fontSize:7, color:"#94a3b8" }}>storage-01</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* VPN to on-prem */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:50, flexDirection:"column" }}>
            <div style={{ fontFamily:MM, fontSize:7, color:"#10b981", marginBottom:2 }}>VPN</div>
            <div style={{ width:2, height:"60%", background:"linear-gradient(180deg, #10b981, #10b98140)" }} />
          </div>
          <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", width:60 }}>
            <div style={{ width:44, height:44, borderRadius:8, background:"#141720", border:"2px solid #334155", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏢</div>
            <div style={{ fontSize:9, color:"#475569", marginTop:4 }}>On-Prem</div>
          </div>
        </div>
      </div>
      {/* NSG Rules */}
      <SectionLabel color="#ffb900">NSG Firewall Rules — Click to toggle</SectionLabel>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
        {nsgRules.map((r, i) => {
          const on = r.action==="Allow";
          return (
            <div key={i} className="card" onClick={() => toggleRule(i)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background: on ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)", border:`1.5px solid ${on ? "#10b98140" : "#ef444440"}`, borderRadius:10, cursor:"pointer" }}>
              <div style={{ fontFamily:MM, fontSize:18, fontWeight:700, color: on ? "#10b981" : "#ef4444" }}>{on ? "✓" : "✗"}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"#e2e8f0" }}>{r.label}</div>
                <div style={{ fontFamily:MM, fontSize:9, color:"#475569" }}>:{r.port} {r.proto} {r.dir}</div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Connectivity comparison */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:14 }}>
        <div style={{ padding:"14px 16px", background:"#0a0d14", borderRadius:12, border:"1px solid #10b98130", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg, #10b981, transparent)" }} />
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}><span style={{ fontSize:16 }}>🔐</span><span style={{ fontSize:13, fontWeight:700, color:"#10b981" }}>VPN Gateway</span></div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
            {["Encrypted","Public Internet","~1.25 Gbps"].map(t=><span key={t} style={{ fontSize:9, padding:"2px 7px", background:"#10b98110", color:"#10b981", borderRadius:4, fontFamily:MM }}>{t}</span>)}
          </div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>IPSec tunnel over internet. Site-to-Site or Point-to-Site.</div>
        </div>
        <div style={{ padding:"14px 16px", background:"#0a0d14", borderRadius:12, border:"1px solid #8b5cf630", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg, #8b5cf6, transparent)" }} />
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}><span style={{ fontSize:16 }}>⚡</span><span style={{ fontSize:13, fontWeight:700, color:"#8b5cf6" }}>ExpressRoute</span></div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
            {["Private","Dedicated Fiber","100 Gbps"].map(t=><span key={t} style={{ fontSize:9, padding:"2px 7px", background:"#8b5cf610", color:"#8b5cf6", borderRadius:4, fontFamily:MM }}>{t}</span>)}
          </div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>Private connection via provider. Never touches public internet.</div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
        <div style={{ padding:"10px 14px", background:"#0a0d14", borderRadius:10, border:"1px solid #1a1f2e" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}><span style={{ fontSize:12 }}>🏷️</span><span style={{ fontSize:11, fontWeight:700, color:"#a78bfa" }}>Azure DNS</span></div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>Host DNS zones. Public (internet) or Private (VNet only). Name → IP resolution.</div>
        </div>
        <div style={{ padding:"10px 14px", background:"#0a0d14", borderRadius:10, border:"1px solid #1a1f2e" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}><span style={{ fontSize:12 }}>↔</span><span style={{ fontSize:11, fontWeight:700, color:"#fbbf24" }}>VNet Peering</span></div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>Connect VNets directly over MS backbone. No gateway. Cross-region supported.</div>
        </div>
      </div>
    </div>
  );
}

function StorageModule() {
  const [selRd, setSelRd] = useState("LRS");
  const [hovTier, setHovTier] = useState(null);
  const rd = REDUNDANCY.find(r => r.id === selRd);

  return (
    <div style={{ maxWidth:720, margin:"0 auto" }}>
      <SectionLabel color="#ff8c00">Access Tiers — Storage vs Access Cost</SectionLabel>
      {/* Tier comparison */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:24 }}>
        {STORAGE_TIERS.map(t => {
          const isHov = hovTier === t.name;
          return (
            <div key={t.name} className="card" onMouseEnter={()=>setHovTier(t.name)} onMouseLeave={()=>setHovTier(null)}
              style={{ background:"#0d1117", borderRadius:12, border: isHov ? `2px solid ${t.color}` : "2px solid #1a1f2e", overflow:"hidden", transition:"all 0.2s" }}>
              {/* Visual bar */}
              <div style={{ height:60, background:`linear-gradient(180deg, ${t.color}30, ${t.color}08)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{t.icon}</div>
              <div style={{ padding:12 }}>
                <div style={{ fontFamily:MM, fontSize:14, fontWeight:700, color:t.color, marginBottom:4 }}>{t.name}</div>
                <div style={{ fontSize:10, color:"#94a3b8", marginBottom:8, minHeight:28 }}>{t.desc}</div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:9, color:"#475569" }}>Storage</span>
                  <span style={{ fontFamily:MM, fontSize:10, color:"#10b981" }}>${t.storeCost}/TB</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:9, color:"#475569" }}>Access</span>
                  <span style={{ fontFamily:MM, fontSize:10, color:"#ef4444" }}>${t.accessCost}/10K</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding:"10px 14px", background:"rgba(99,102,241,0.06)", borderRadius:8, fontSize:11, color:"#818cf8", marginBottom:24, textAlign:"center" }}>
        ⚠️ <strong>Archive</strong> data is <strong>offline</strong>. Must rehydrate (takes hours) before reading. Cannot be read directly.
      </div>

      {/* Redundancy */}
      <SectionLabel color="#ff8c00">Redundancy — How Azure Protects Your Data</SectionLabel>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {REDUNDANCY.map(r => (
          <button key={r.id} className="card" onClick={() => setSelRd(r.id)}
            style={{ flex:1, padding:"12px 8px", background: selRd===r.id ? `${r.color}12` : "#0a0d14", border: selRd===r.id ? `2px solid ${r.color}` : "2px solid #141720", borderRadius:12, fontFamily:F, textAlign:"center", cursor:"pointer" }}>
            <div style={{ fontFamily:MM, fontSize:16, fontWeight:700, color: selRd===r.id ? r.color : "#475569" }}>{r.id}</div>
            <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{r.copies} copies</div>
          </button>
        ))}
      </div>
      <div className="fade-in" key={selRd} style={{ background:"#0d1117", borderRadius:14, padding:18, border:"1px solid #1a1f2e" }}>
        <div style={{ fontWeight:700, fontSize:16, color:rd.color, marginBottom:2 }}>{rd.name} Storage ({rd.id})</div>
        <div style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>{rd.desc}</div>
        {/* Visual */}
        <div style={{ display:"flex", gap:24, justifyContent:"center", alignItems:"center", marginBottom:16 }}>
          {/* Primary region */}
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:10, color:"#94a3b8", marginBottom:8, fontWeight:700 }}>Primary Region</div>
            <div style={{ display:"flex", gap: rd.zones > 1 ? 8 : 6 }}>
              {Array.from({length: rd.zones > 1 ? 3 : 3}).map((_,i) => (
                <div key={i} style={{ width:44, height:50, borderRadius:8, background:`${rd.color}15`, border:`2px solid ${rd.color}50`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2 }}>
                  <span style={{ fontSize:14 }}>💾</span>
                  <span style={{ fontFamily:MM, fontSize:8, color:rd.color }}>{rd.zones > 1 ? `Z${i+1}` : `C${i+1}`}</span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily:MM, fontSize:9, color:"#334155", marginTop:6 }}>{rd.zones > 1 ? "3 zones" : "1 datacenter"}</div>
          </div>
          {/* Replication arrow — animated */}
          {rd.regions > 1 && (
            <>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, width:110 }}>
                <div style={{ fontFamily:MM, fontSize:8, color:rd.color, textTransform:"uppercase", letterSpacing:1 }}>Async Replication</div>
                <svg width="110" height="28" style={{ overflow:"visible" }}>
                  <line x1="5" y1="14" x2="105" y2="14" stroke={rd.color} strokeWidth="2" strokeDasharray="5,4">
                    <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1s" repeatCount="indefinite"/>
                  </line>
                  {[0,1].map(i=>(
                    <circle key={i} r="3" fill={rd.color}>
                      <animate attributeName="cx" from="5" to="105" dur="1.8s" repeatCount="indefinite" begin={`${i*0.9}s`}/>
                      <animate attributeName="cy" values="14;12;14;16;14" dur="1.8s" repeatCount="indefinite" begin={`${i*0.9}s`}/>
                      <animate attributeName="opacity" values="0;0.8;0.8;0" dur="1.8s" repeatCount="indefinite" begin={`${i*0.9}s`}/>
                    </circle>
                  ))}
                </svg>
                <div style={{ fontFamily:MM, fontSize:8, color:"#334155" }}>300+ miles</div>
                {rd.read && <div style={{ fontFamily:MM, fontSize:8, color:"#10b981", background:"rgba(16,185,129,0.1)", padding:"2px 6px", borderRadius:3, marginTop:2 }}>+ READ ACCESS</div>}
              </div>
              {/* Secondary */}
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#94a3b8", marginBottom:8, fontWeight:700 }}>Paired Region</div>
                <div style={{ display:"flex", gap:6 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:44, height:50, borderRadius:8, background:`${rd.color}08`, border:`2px dashed ${rd.color}30`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, opacity:0.7 }}>
                      <span style={{ fontSize:14 }}>💾</span>
                      <span style={{ fontFamily:MM, fontSize:8, color:rd.color }}>C{i+1}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily:MM, fontSize:9, color:"#334155", marginTop:6 }}>300+ miles away</div>
              </div>
            </>
          )}
        </div>
        <div style={{ textAlign:"center", fontFamily:MM, fontSize:12, color:rd.color }}>{rd.durability} durability ({rd.copies} total copies)</div>
      </div>
      {/* Archive rehydration */}
      <div style={{ marginTop:16, padding:"14px 18px", background:"#0d1117", borderRadius:12, border:"1px solid #1a1f2e" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#6366f1", marginBottom:10 }}>📦 Archive Rehydration Process</div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <div style={{ padding:"8px 12px", background:"#1e293b15", borderRadius:8, textAlign:"center", border:"1px solid #1e293b" }}>
            <div style={{ fontSize:18 }}>🗄️</div>
            <div style={{ fontFamily:MM, fontSize:8, color:"#475569" }}>Archive</div>
          </div>
          <svg width="100" height="24">
            <line x1="0" y1="12" x2="100" y2="12" stroke="#6366f1" strokeWidth="2" strokeDasharray="4,3">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite"/>
            </line>
            <text x="50" y="9" textAnchor="middle" fill="#6366f1" fontSize="8" fontFamily="'Fira Code'">1-15 hrs</text>
          </svg>
          <div style={{ padding:"8px 12px", background:"rgba(59,130,246,0.06)", borderRadius:8, textAlign:"center", border:"1px solid #3b82f630" }}>
            <div style={{ fontSize:18 }}>❄️</div>
            <div style={{ fontFamily:MM, fontSize:8, color:"#3b82f6" }}>Cool/Hot</div>
          </div>
          <span style={{ fontSize:16, color:"#10b981" }}>→</span>
          <div style={{ padding:"8px 12px", background:"rgba(16,185,129,0.06)", borderRadius:8, textAlign:"center", border:"1px solid #10b98130" }}>
            <div style={{ fontSize:18 }}>✅</div>
            <div style={{ fontFamily:MM, fontSize:8, color:"#10b981" }}>Readable</div>
          </div>
        </div>
      </div>
      {/* Blob types + tools */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
        <div style={{ padding:"10px 12px", background:"#0d1117", borderRadius:10, border:"1px solid #1a1f2e", borderTop:"3px solid #ff8c00" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#ff8c00", marginBottom:4 }}>Blob Types</div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.6 }}><strong style={{color:"#94a3b8"}}>Block:</strong> Files, images, videos · <strong style={{color:"#94a3b8"}}>Append:</strong> Log files · <strong style={{color:"#94a3b8"}}>Page:</strong> VHDs/disks</div>
        </div>
        <div style={{ padding:"10px 12px", background:"#0d1117", borderRadius:10, border:"1px solid #1a1f2e", borderTop:"3px solid #3b82f6" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#3b82f6", marginBottom:4 }}>Data Transfer Tools</div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.6 }}><strong style={{color:"#94a3b8"}}>AzCopy:</strong> CLI bulk copy · <strong style={{color:"#94a3b8"}}>Storage Explorer:</strong> GUI · <strong style={{color:"#94a3b8"}}>Data Box:</strong> Physical ship 80TB</div>
        </div>
      </div>
    </div>
  );
}

function IdentityModule() {
  const [step, setStep] = useState(0);
  const steps = [
    { label:"User Request", icon:"👤", color:"#94a3b8", desc:"A user or service principal attempts to access an Azure resource. This triggers the authentication pipeline." },
    { label:"Microsoft Entra ID", icon:"🔑", color:"#0078d4", desc:"Formerly Azure Active Directory. Verifies the user's identity through SSO, federated identity, or direct authentication. This is Azure's cloud-based identity service." },
    { label:"MFA Challenge", icon:"📱", color:"#8b5cf6", desc:"Multi-Factor Authentication: Something you KNOW (password) + something you HAVE (phone/authenticator) + something you ARE (biometric). Passwordless options: FIDO2, Windows Hello, Authenticator app." },
    { label:"Conditional Access", icon:"🔀", color:"#ffb900", desc:"Policy engine evaluates: Which user? Which device? What location? Which app? What risk level? — then decides: Allow, Block, or Require MFA." },
    { label:"RBAC Check", icon:"🛡️", color:"#10b981", desc:"Role-Based Access Control. Three built-in roles: Owner (full control), Contributor (create/manage, no access mgmt), Reader (view only). Assigned at scope: Management Group → Subscription → Resource Group → Resource." },
    { label:"Access Granted", icon:"☁️", color:"#50e6ff", desc:"User can now interact with the Azure resource within the permissions granted by their RBAC role. All actions are logged in the Activity Log." },
  ];
  const ztPrinciples = [
    { label:"Verify Explicitly", icon:"🔍", color:"#0078d4", desc:"Always authenticate and authorize based on all data points: identity, location, device, service, data, anomalies." },
    { label:"Least Privilege", icon:"🔐", color:"#8b5cf6", desc:"Limit user access with Just-In-Time and Just-Enough-Access (JIT/JEA). Minimize blast radius." },
    { label:"Assume Breach", icon:"⚠️", color:"#ef4444", desc:"Segment access. Verify end-to-end encryption. Use analytics to detect threats and improve defenses." },
  ];
  const layers = [
    { label:"Physical Security", color:"#1e293b", icon:"🏢" },
    { label:"Identity & Access", color:"#7c3aed", icon:"🔑" },
    { label:"Perimeter", color:"#2563eb", icon:"🌐" },
    { label:"Network", color:"#0891b2", icon:"⬡" },
    { label:"Compute", color:"#059669", icon:"⬢" },
    { label:"Application", color:"#d97706", icon:"▣" },
    { label:"Data", color:"#dc2626", icon:"💾" },
  ];

  return (
    <div style={{ maxWidth:750, margin:"0 auto" }}>
      <SectionLabel color="#e74856">Authentication Flow — Step Through</SectionLabel>
      {/* Step visualizer */}
      <div style={{ display:"flex", alignItems:"center", gap:2, marginBottom:16, overflowX:"auto", padding:"4px 0" }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:2 }}>
            <div className="card" onClick={() => setStep(i)}
              style={{ width:72, textAlign:"center", padding:"12px 4px", background: step===i ? `${s.color}15` : step>i ? `${s.color}08` : "#0a0d14", border: step===i ? `2px solid ${s.color}` : "2px solid #141720", borderRadius:12, cursor:"pointer", position:"relative" }}>
              {step>i && <div style={{ position:"absolute", top:4, right:4, width:10, height:10, borderRadius:"50%", background:"#10b981", display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, color:"#fff" }}>✓</div>}
              <div className={step===i ? "pulse-anim" : ""} style={{ fontSize:22, marginBottom:2 }}>{s.icon}</div>
              <div style={{ fontSize:8, fontWeight:700, color: step>=i ? s.color : "#334155", lineHeight:1.2 }}>{s.label}</div>
            </div>
            {i < steps.length-1 && <div style={{ width:16, height:2, background: step>i ? steps[i].color : "#1a1f2e", borderRadius:1, transition:"background 0.3s" }} />}
          </div>
        ))}
      </div>
      <div className="fade-in" key={step} style={{ padding:"14px 18px", background:"#0d1117", borderRadius:12, borderLeft:`4px solid ${steps[step].color}`, marginBottom:24, border:"1px solid #1a1f2e" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <span style={{ fontSize:16 }}>{steps[step].icon}</span>
          <span style={{ fontWeight:700, color:steps[step].color, fontSize:14 }}>{steps[step].label}</span>
          <span style={{ fontFamily:MM, fontSize:10, color:"#334155" }}>Step {step+1}/6</span>
        </div>
        <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7 }}>{steps[step].desc}</div>
      </div>

      {/* Zero Trust */}
      <SectionLabel color="#e74856">Zero Trust Principles</SectionLabel>
      <div style={{ display:"flex", gap:10, marginBottom:24 }}>
        {ztPrinciples.map(p => (
          <div key={p.label} style={{ flex:1, padding:"14px", background:"#0d1117", borderRadius:12, border:"1px solid #1a1f2e", borderTop:`3px solid ${p.color}` }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{p.icon}</div>
            <div style={{ fontWeight:700, fontSize:13, color:p.color, marginBottom:4 }}>{p.label}</div>
            <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.6 }}>{p.desc}</div>
          </div>
        ))}
      </div>

      {/* Defense in Depth */}
      <SectionLabel color="#e74856">Defense in Depth — 7 Concentric Layers</SectionLabel>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
        {layers.map((l, i) => (
          <div key={i} className="card" style={{ width:`${100 - i*9}%`, padding:"9px 16px", background:`${l.color}10`, border:`1.5px solid ${l.color}35`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all 0.15s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:14 }}>{l.icon}</span>
              <span style={{ fontSize:12, fontWeight:700, color:l.color }}>{l.label}</span>
            </div>
            <div style={{ fontFamily:MM, fontSize:9, color:"#475569" }}>Layer {i+1}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12, textAlign:"center", fontSize:11, color:"#475569" }}>Each layer slows attackers. If one fails, the next catches them.</div>
      {/* Identity service cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:16 }}>
        <div style={{ padding:"12px 14px", background:"#0d1117", borderRadius:10, border:"1px solid #0078d430" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><span style={{ fontSize:14 }}>🔑</span><span style={{ fontSize:11, fontWeight:700, color:"#0078d4" }}>Microsoft Entra ID</span></div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>Cloud identity (formerly Azure AD). SSO, MFA, Conditional Access. Manages users, groups, app registrations.</div>
        </div>
        <div style={{ padding:"12px 14px", background:"#0d1117", borderRadius:10, border:"1px solid #8b5cf630" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><span style={{ fontSize:14 }}>🏛️</span><span style={{ fontSize:11, fontWeight:700, color:"#8b5cf6" }}>Entra Domain Services</span></div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>Managed AD DS in Azure. Domain join, group policy, LDAP, Kerberos — no domain controllers needed.</div>
        </div>
        <div style={{ padding:"12px 14px", background:"#0d1117", borderRadius:10, border:"1px solid #f59e0b30" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><span style={{ fontSize:14 }}>🌍</span><span style={{ fontSize:11, fontWeight:700, color:"#f59e0b" }}>External Identities</span></div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>B2B: invite partners. B2C: customer-facing identity for apps. Federation with Google, Facebook, SAML.</div>
        </div>
      </div>
      <div style={{ marginTop:8, padding:"8px 14px", background:"rgba(255,185,0,0.04)", borderRadius:8, borderLeft:"3px solid #ffb900" }}>
        <div style={{ fontSize:10, color:"#fbbf24", fontWeight:700 }}>📝 Exam Tip</div>
        <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>Microsoft rebranded Azure AD → <strong style={{color:"#0078d4"}}>Microsoft Entra ID</strong> in 2023. The exam uses the new name. Zero Trust = "never trust, always verify."</div>
      </div>
    </div>
  );
}

function GovernanceModule() {
  const [resources, setResources] = useState(GOVERN_RESOURCES);
  const [activePolicies, setActivePolicies] = useState([]);
  const [selectedRes, setSelectedRes] = useState(null);
  const togglePolicy = (pid) => setActivePolicies(p => p.includes(pid) ? p.filter(x=>x!==pid) : [...p,pid]);
  const applyTag = (rid, tag) => setResources(p => p.map(r => r.id===rid ? {...r, tags:{...r.tags, [tag]:tag==="Environment"?(r.rg.includes("prod")?"Production":"Development"):r.region}} : r));
  const toggleLock = (rid, lock) => setResources(p => p.map(r => r.id===rid ? {...r, locked: r.locked===lock ? null : lock} : r));
  const evaluated = resources.map(r => ({...r, violations: activePolicies.map(pid => POLICIES.find(p=>p.id===pid)).filter(p => !p.check(r)).map(p => p.name)}));
  const compliant = evaluated.filter(r => r.violations.length === 0).length;

  return (
    <div style={{ maxWidth:750, margin:"0 auto" }}>
      <SectionLabel color="#00cc6a">Azure Policy — Toggle to Enforce</SectionLabel>
      {/* Compliance score — visual gauge */}
      {activePolicies.length > 0 && (() => {
        const pct = Math.round(compliant/evaluated.length*100);
        const c = pct===100 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
        const circ = 2 * Math.PI * 38;
        return (
        <div style={{ display:"flex", gap:14, marginBottom:16, alignItems:"center" }}>
          <div style={{ position:"relative", width:76, height:76, flexShrink:0 }}>
            <svg width="76" height="76" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#1a1f2e" strokeWidth="10"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke={c} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ - (pct/100)*circ}
                transform="rotate(-90 50 50)" style={{ transition:"stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)" }}/>
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:MM, fontSize:18, fontWeight:700, color:c }}>{pct}%</span>
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0", marginBottom:2 }}>Compliance Score</div>
            <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>{compliant}/{evaluated.length} resources passing</div>
            <div style={{ display:"flex", gap:3 }}>
              {evaluated.map((r,i) => (
                <div key={i} title={r.name} style={{ width:10, height:10, borderRadius:2, background: r.violations.length===0 ? "#10b981" : "#ef4444", transition:"background 0.3s" }} />
              ))}
            </div>
          </div>
        </div>);
      })()}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
        {POLICIES.map(p => {
          const on = activePolicies.includes(p.id);
          return (
            <div key={p.id} className="card" onClick={() => togglePolicy(p.id)}
              style={{ padding:"12px 14px", background: on ? "rgba(0,204,106,0.06)" : "#0a0d14", border: on ? "2px solid #00cc6a40" : "2px solid #141720", borderRadius:12, cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:14 }}>{p.icon}</span>
                <div style={{ width:18, height:18, borderRadius:4, background: on ? "#00cc6a" : "#1a1f2e", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:700, transition:"all 0.2s" }}>{on?"✓":""}</div>
                <span style={{ fontSize:12, fontWeight:700, color: on ? "#00cc6a" : "#64748b" }}>{p.name}</span>
              </div>
              <div style={{ fontSize:10, color:"#475569", marginLeft:46 }}>{p.desc}</div>
            </div>
          );
        })}
      </div>

      <SectionLabel color="#00cc6a">Resources — Click to Manage Tags & Locks</SectionLabel>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {evaluated.map(r => {
          const hasBad = r.violations.length > 0;
          const isSel = selectedRes === r.id;
          return (
            <div key={r.id} onClick={() => setSelectedRes(isSel ? null : r.id)}
              style={{ padding:"11px 16px", background: isSel ? "#141720" : "#0d1117", borderRadius:10, border:`1.5px solid ${hasBad ? "#ef444440" : isSel ? "#334155" : "#1a1f2e"}`, cursor:"pointer", transition:"all 0.15s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{r.name}</div>
                  <div style={{ fontSize:10, color:"#475569" }}>{r.type} · {r.region} · {r.rg}</div>
                </div>
                {r.locked && <span style={{ fontFamily:MM, fontSize:9, color:"#fbbf24", background:"rgba(251,191,36,0.1)", padding:"2px 8px", borderRadius:4 }}>🔒 {r.locked}</span>}
                {Object.entries(r.tags).map(([k,v]) => <span key={k} style={{ fontFamily:MM, fontSize:9, color:"#a78bfa", background:"rgba(167,139,250,0.1)", padding:"2px 6px", borderRadius:4 }}>🏷️ {k}:{String(v)}</span>)}
                {hasBad ? <span style={{ fontFamily:MM, fontSize:10, color:"#ef4444", fontWeight:700 }}>✗ NON-COMPLIANT</span>
                  : activePolicies.length > 0 ? <span style={{ fontFamily:MM, fontSize:10, color:"#10b981", fontWeight:700 }}>✓ COMPLIANT</span> : null}
              </div>
              {isSel && (
                <div className="fade-in" style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
                  <button className="icon-btn" onClick={(e)=>{e.stopPropagation();applyTag(r.id,"Environment")}} style={{ padding:"5px 10px", background:"rgba(167,139,250,0.1)", border:"1px solid #a78bfa40", borderRadius:6, color:"#a78bfa", fontSize:11, fontFamily:F, cursor:"pointer" }}>+ Tag: Environment</button>
                  <button className="icon-btn" onClick={(e)=>{e.stopPropagation();toggleLock(r.id,"CanNotDelete")}} style={{ padding:"5px 10px", background:"rgba(251,191,36,0.1)", border:"1px solid #fbbf2440", borderRadius:6, color:"#fbbf24", fontSize:11, fontFamily:F, cursor:"pointer" }}>{r.locked==="CanNotDelete"?"Remove":"+"} Lock: CanNotDelete</button>
                  <button className="icon-btn" onClick={(e)=>{e.stopPropagation();toggleLock(r.id,"ReadOnly")}} style={{ padding:"5px 10px", background:"rgba(251,191,36,0.1)", border:"1px solid #fbbf2440", borderRadius:6, color:"#fbbf24", fontSize:11, fontFamily:F, cursor:"pointer" }}>{r.locked==="ReadOnly"?"Remove":"+"} Lock: ReadOnly</button>
                  {hasBad && <div style={{ width:"100%", fontSize:11, color:"#f87171", marginTop:4 }}>⚠ {r.violations.join(" · ")}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Purview section */}
      <div style={{ marginTop:20, padding:"14px 18px", background:"rgba(0,204,106,0.04)", borderRadius:12, border:"1px solid #00cc6a20" }}>
        <div style={{ fontWeight:700, fontSize:13, color:"#00cc6a", marginBottom:8 }}>Microsoft Purview — Data Governance</div>
        <div style={{ display:"flex", gap:10 }}>
          {[{l:"Classify",d:"Auto-discover & label sensitive data",i:"🏷️"},{l:"Protect",d:"Encryption, access policies, DLP",i:"🛡️"},{l:"Govern",d:"Data lineage, cataloging, compliance",i:"📊"}].map(p=>(
            <div key={p.l} style={{ flex:1, background:"#0d1117", borderRadius:8, padding:"10px 12px", border:"1px solid #1a1f2e" }}>
              <span style={{ fontSize:16 }}>{p.i}</span>
              <div style={{ fontWeight:700, fontSize:12, color:"#e2e8f0", marginTop:4 }}>{p.l}</div>
              <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{p.d}</div>
            </div>
          ))}
        </div>
      </div>
      {/* IaC & Deployment */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:12 }}>
        <div style={{ padding:"10px 12px", background:"#0d1117", borderRadius:10, border:"1px solid #1a1f2e", borderTop:"3px solid #0078d4" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#0078d4", marginBottom:4 }}>ARM Templates</div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>JSON declarative IaC. Idempotent — deploy same template, get same result every time.</div>
        </div>
        <div style={{ padding:"10px 12px", background:"#0d1117", borderRadius:10, border:"1px solid #1a1f2e", borderTop:"3px solid #10b981" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#10b981", marginBottom:4 }}>Bicep</div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>Cleaner syntax for ARM. Compiles to JSON. Azure-native IaC with better readability.</div>
        </div>
        <div style={{ padding:"10px 12px", background:"#0d1117", borderRadius:10, border:"1px solid #1a1f2e", borderTop:"3px solid #f59e0b" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#f59e0b", marginBottom:4 }}>Blueprints</div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>Package: ARM + Policy + RBAC + Resource Groups. Repeatable environment setup at scale.</div>
        </div>
      </div>
    </div>
  );
}

function CostModule() {
  const [vms, setVms] = useState(2);
  const [size, setSize] = useState("B2s");
  const [hours, setHours] = useState(730);
  const [storage, setStorage] = useState(100);
  const [egress, setEgress] = useState(50);
  const [commit, setCommit] = useState("payg");
  const prices = { "B1s":0.012, "B2s":0.042, "D2s_v3":0.096, "D4s_v3":0.192, "E2s_v3":0.126 };
  const disc = commit==="res"?0.6:commit==="save"?0.78:1;
  const vmCost = vms * (prices[size]||0.042) * hours * disc;
  const stCost = storage * 0.018;
  const egCost = Math.max(0, egress - 5) * 0.087;
  const total = vmCost + stCost + egCost;
  const payg = vms*(prices[size]||0.042)*hours + stCost + egCost;
  const saved = payg - total;

  return (
    <div style={{ maxWidth:680, margin:"0 auto" }}>
      <SectionLabel color="#ffd700">Pricing Calculator</SectionLabel>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #1a1f2e" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#60a5fa", marginBottom:14 }}>⬢ Virtual Machines</div>
          <div style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:10, color:"#64748b" }}>Count</span><span style={{ fontFamily:MM, fontSize:11, color:"#e2e8f0" }}>{vms}</span></div>
            <input type="range" min={1} max={20} value={vms} onChange={e=>setVms(+e.target.value)} style={{ width:"100%", accentColor:"#0078d4" }} />
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:"#64748b", marginBottom:4 }}>Size</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {Object.entries(prices).map(([s,p])=>(<button key={s} className="card" onClick={()=>setSize(s)} style={{ padding:"4px 8px", background:size===s?"#0078d4":"#141720", border:size===s?"1px solid #0078d4":"1px solid #1a1f2e", borderRadius:6, fontFamily:MM, fontSize:9, color:size===s?"#fff":"#64748b", cursor:"pointer" }}>{s}<br/>${p}/hr</button>))}
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:10, color:"#64748b" }}>Hours/mo</span><span style={{ fontFamily:MM, fontSize:11, color:"#e2e8f0" }}>{hours}h</span></div>
            <input type="range" min={100} max={730} step={10} value={hours} onChange={e=>setHours(+e.target.value)} style={{ width:"100%", accentColor:"#0078d4" }} />
          </div>
          <div style={{ fontSize:10, color:"#64748b", marginBottom:4 }}>Commitment</div>
          {[{id:"payg",l:"Pay-As-You-Go",d:"-0%"},{id:"save",l:"Savings Plan (1yr)",d:"-22%"},{id:"res",l:"Reserved (1yr)",d:"-40%"}].map(o=>(
            <div key={o.id} className="card" onClick={()=>setCommit(o.id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:commit===o.id?"rgba(16,185,129,0.06)":"transparent", borderRadius:6, cursor:"pointer", marginBottom:2, border:commit===o.id?"1px solid #10b98130":"1px solid transparent" }}>
              <div style={{ width:12, height:12, borderRadius:"50%", border:`2px solid ${commit===o.id?"#10b981":"#334155"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>{commit===o.id&&<div style={{width:5,height:5,borderRadius:"50%",background:"#10b981"}}/>}</div>
              <span style={{ fontSize:11, color:commit===o.id?"#e2e8f0":"#64748b", flex:1 }}>{o.l}</span>
              <span style={{ fontFamily:MM, fontSize:10, color:"#10b981" }}>{o.d}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #1a1f2e" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#ff8c00", marginBottom:10 }}>◈ Storage</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:10, color:"#64748b" }}>GB</span><span style={{ fontFamily:MM, fontSize:11 }}>{storage}</span></div>
            <input type="range" min={0} max={5000} step={50} value={storage} onChange={e=>setStorage(+e.target.value)} style={{ width:"100%", accentColor:"#ff8c00" }} />
          </div>
          <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #1a1f2e" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#ef4444", marginBottom:10 }}>↑ Outbound Egress</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:10, color:"#64748b" }}>GB (first 5 free)</span><span style={{ fontFamily:MM, fontSize:11 }}>{egress}</span></div>
            <input type="range" min={0} max={1000} step={10} value={egress} onChange={e=>setEgress(+e.target.value)} style={{ width:"100%", accentColor:"#ef4444" }} />
            <div style={{ fontSize:9, color:"#334155", marginTop:4 }}>↓ Inbound always FREE</div>
          </div>
          <div style={{ background:"#0d1117", borderRadius:14, padding:12, border:"1px solid #1a1f2e" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#ffd700", marginBottom:6 }}>Pricing vs TCO Calculator</div>
            <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.5 }}><strong style={{color:"#60a5fa"}}>Pricing:</strong> Estimate costs for new Azure resources.<br/><strong style={{color:"#10b981"}}>TCO:</strong> Compare on-prem total cost vs Azure migration.</div>
          </div>
        </div>
      </div>
      <div style={{ marginTop:14, background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #1a1f2e" }}>
        {/* Visual proportion bar */}
        {total > 0 && <div style={{ display:"flex", height:10, borderRadius:5, overflow:"hidden", marginBottom:12, gap:1 }}>
          {[{v:vmCost,c:"#60a5fa"},{v:stCost,c:"#ff8c00"},{v:egCost,c:"#ef4444"}].filter(r=>r.v>0).map((r,i) => (
            <div key={i} className="bar-fill" style={{ flex:r.v, background:r.c, borderRadius:i===0?"5px 0 0 5px":i===2?"0 5px 5px 0":"0", minWidth:2, transition:"flex 0.4s ease" }} />
          ))}
        </div>}
        {[{l:`VMs (${vms}× ${size}, ${hours}h)`,v:vmCost,c:"#60a5fa"},{l:`Storage (${storage}GB)`,v:stCost,c:"#ff8c00"},{l:`Egress (${egress}GB)`,v:egCost,c:"#ef4444"}].map(r=>(<div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:2,background:r.c}}/><span style={{fontSize:12,color:"#94a3b8"}}>{r.l}</span></div><span style={{fontFamily:MM,fontSize:13,color:r.c}}>${r.v.toFixed(2)}</span></div>))}
        <div style={{ borderTop:"1px solid #1a1f2e", marginTop:8, paddingTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontWeight:700, fontSize:14 }}>Monthly Total</span>
          <div style={{ textAlign:"right" }}><div style={{ fontFamily:MM, fontSize:28, fontWeight:700, color:"#ffd700" }}>${total.toFixed(2)}</div>{saved>0&&<div style={{fontFamily:MM,fontSize:11,color:"#10b981"}}>Saving ${saved.toFixed(2)}/mo</div>}</div>
        </div>
      </div>
    </div>
  );
}

function MonitorModule() {
  const recs = [{cat:"Cost",color:"#10b981",icon:"💰",title:"Right-size vm-dev-01",desc:"CPU avg 5%. Downsize D4s→B2s. Save $150/mo."},{cat:"Security",color:"#ef4444",icon:"🔒",title:"Enable MFA for admins",desc:"3 admin accounts lack MFA."},{cat:"Reliability",color:"#3b82f6",icon:"◎",title:"Use availability zones",desc:"vm-prod-web single zone. Deploy 2+ for 99.99%."},{cat:"Performance",color:"#f59e0b",icon:"⚡",title:"Enable accelerated networking",desc:"sql-db-01 throughput 40% below capability."},{cat:"Operational",color:"#a78bfa",icon:"🔧",title:"Update TLS to 1.2+",desc:"2 App Services using deprecated TLS 1.0."}];
  const cpuD = [25,32,28,45,62,58,71,85,78,65,42,38,30,28,35,40,55,48,52,45,38,32,28,25];
  const memD = [60,62,61,63,68,72,75,80,78,74,65,63,62,61,63,65,70,68,67,64,62,61,60,60];
  const [metric, setMetric] = useState("cpu");
  const data = metric==="cpu" ? cpuD : memD;

  return (
    <div style={{ maxWidth:750, margin:"0 auto" }}>
      <SectionLabel color="#0078d4">Azure Monitor Dashboard</SectionLabel>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14, marginBottom:18 }}>
        <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #1a1f2e" }}>
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            {[{id:"cpu",l:"CPU %"},{id:"mem",l:"Memory %"}].map(m=>(<button key={m.id} className="card" onClick={()=>setMetric(m.id)} style={{padding:"4px 12px",background:metric===m.id?"#0078d420":"transparent",border:metric===m.id?"1px solid #0078d4":"1px solid #1a1f2e",borderRadius:6,fontFamily:MM,fontSize:10,color:metric===m.id?"#0078d4":"#475569",cursor:"pointer"}}>{m.l}</button>))}
          </div>
          <div style={{ height:110, display:"flex", alignItems:"flex-end", gap:3, position:"relative" }}>
            {/* 70% threshold line */}
            <div style={{ position:"absolute", left:0, right:0, bottom:"70%", borderTop:"2px dashed #ef4444", opacity:0.4, zIndex:2, pointerEvents:"none" }}>
              <span style={{ position:"absolute", right:0, top:-11, fontFamily:MM, fontSize:7, color:"#ef4444", background:"#0d1117", padding:"0 3px" }}>70% ALERT</span>
            </div>
            {/* 50% reference */}
            <div style={{ position:"absolute", left:0, right:0, bottom:"50%", borderTop:"1px dotted #334155", zIndex:1, pointerEvents:"none" }}>
              <span style={{ position:"absolute", right:0, top:-10, fontFamily:MM, fontSize:6, color:"#334155", background:"#0d1117", padding:"0 2px" }}>50%</span>
            </div>
            {data.map((v,i)=>{
              const peak = v === Math.max(...data);
              return <div key={`${metric}${i}`} className="bar-fill" style={{flex:1,height:`${v}%`,background:v>70?"linear-gradient(0deg,#ef4444,#ef444480)":v>50?"linear-gradient(0deg,#f59e0b,#f59e0b80)":"linear-gradient(0deg,#3b82f6,#3b82f680)",borderRadius:"3px 3px 0 0",animationDelay:`${i*20}ms`,position:"relative"}}>
                {peak && <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50)", fontFamily:MM, fontSize:7, color:"#ef4444", whiteSpace:"nowrap", background:"#0d1117", padding:"0 2px", borderRadius:2 }}>{v}%▲</div>}
              </div>;
            })}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
            {["00:00","06:00","12:00","18:00","23:59"].map(t=><span key={t} style={{fontFamily:MM,fontSize:8,color:"#334155"}}>{t}</span>)}
          </div>
          <div style={{marginTop:10,padding:"6px 10px",background:"rgba(239,68,68,0.06)",borderRadius:6,display:"flex",alignItems:"center",gap:6}}>
            <span className="pulse-anim" style={{fontSize:10}}>🔔</span>
            <span style={{fontSize:10,color:"#f87171"}}>Alert triggered: {metric==="cpu"?"CPU":"Mem"} {">"} 70% at 07:30</span>
          </div>
        </div>
        <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #1a1f2e" }}>
          <div style={{fontSize:12,fontWeight:700,color:"#0078d4",marginBottom:12}}>Service Health</div>
          {[{s:"Virtual Machines",st:"ok"},{s:"App Service",st:"warn"},{s:"SQL Database",st:"ok"},{s:"Storage",st:"ok"},{s:"Key Vault",st:"ok"}].map((h,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<4?"1px solid #141720":"none"}}>
              <div className={h.st==="warn"?"pulse-anim":""} style={{width:8,height:8,borderRadius:"50%",background:h.st==="ok"?"#10b981":"#f59e0b"}}/>
              <span style={{fontSize:11,color:"#e2e8f0",flex:1}}>{h.s}</span>
            </div>
          ))}
        </div>
      </div>
      <SectionLabel color="#0078d4">Advisor Recommendations</SectionLabel>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {recs.map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#0d1117",borderRadius:10,borderLeft:`4px solid ${r.color}`,border:"1px solid #1a1f2e"}}>
            <span style={{fontSize:18}}>{r.icon}</span>
            <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{r.title}</span><span style={{fontFamily:MM,fontSize:9,color:r.color,background:`${r.color}15`,padding:"1px 6px",borderRadius:3}}>{r.cat}</span></div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{r.desc}</div></div>
          </div>
        ))}
      </div>
      <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[{t:"Azure Monitor",d:"Metrics, logs, alerts from all resources. Query with KQL in Log Analytics.",c:"#0078d4",i:"📊"},{t:"Service Health",d:"Outages, maintenance, advisories for YOUR regions and services.",c:"#10b981",i:"💚"},{t:"Advisor",d:"Personalized recommendations: cost, security, reliability, performance.",c:"#ffd700",i:"💡"}].map(c=>(
          <div key={c.t} style={{background:"#0d1117",borderRadius:10,padding:"12px 14px",border:"1px solid #1a1f2e",borderTop:`3px solid ${c.c}`}}><span style={{fontSize:18}}>{c.i}</span><div style={{fontWeight:700,fontSize:12,color:c.c,marginTop:4}}>{c.t}</div><div style={{fontSize:10,color:"#64748b",marginTop:4,lineHeight:1.5}}>{c.d}</div></div>
        ))}
      </div>
      {/* Azure Arc */}
      <div style={{marginTop:12, padding:"14px 18px", background:"rgba(0,120,212,0.04)", borderRadius:12, border:"1px solid #0078d420"}}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <span style={{ fontSize:20 }}>🌐</span>
          <div><div style={{ fontWeight:700, fontSize:13, color:"#0078d4" }}>Azure Arc</div><div style={{ fontSize:10, color:"#475569" }}>Extend Azure to any infrastructure</div></div>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["On-Prem Servers","AWS/GCP VMs","Kubernetes","SQL Anywhere","Azure Policy Everywhere","Unified RBAC"].map(t=>(
            <span key={t} style={{ fontSize:9, padding:"3px 8px", background:"#0078d410", border:"1px solid #0078d425", color:"#60a5fa", borderRadius:4, fontFamily:MM }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MigrateModule() {
  const tools = [
    {name:"Azure Migrate",icon:"🔄",color:"#9333ea",desc:"Central hub for discovering, assessing, and migrating on-prem servers, databases, and web apps to Azure.",tags:["Server assessment","Server migration","Database migration","Web app migration"]},
    {name:"Azure Data Box",icon:"📦",color:"#f59e0b",desc:"Physical device shipped to you. Load up to 80TB, ship back. For massive offline data transfers.",tags:["80TB capacity","Encrypted device","Ship & upload","AES 256-bit"]},
    {name:"Azure Arc",icon:"🌐",color:"#0078d4",desc:"Extend Azure management to ANY infrastructure — on-prem, AWS, GCP, edge. One portal for everything.",tags:["Multi-cloud","On-prem servers","Azure Policy anywhere","Unified RBAC"]},
    {name:"AzCopy",icon:"⚡",color:"#10b981",desc:"CLI tool for fast parallel copy to/from Azure Blob and File storage.",tags:["Command-line","Parallel transfers","SAS token auth","Blob & Files"]},
    {name:"Storage Explorer",icon:"🗂️",color:"#3b82f6",desc:"Free desktop GUI to browse and manage all Azure Storage types visually.",tags:["Visual browser","Drag & drop","All storage types","Win/Mac/Linux"]},
    {name:"Azure File Sync",icon:"🔁",color:"#8b5cf6",desc:"Keep on-prem file servers synced with Azure Files. Cloud tiering frees local disk.",tags:["Bi-directional","Cloud tiering","Multi-site","Transparent"]},
  ];
  const [sel, setSel] = useState("Azure Migrate");
  const act = tools.find(t=>t.name===sel);
  return (
    <div style={{ maxWidth:720, margin:"0 auto" }}>
      <SectionLabel color="#9333ea">Migration & Data Transfer</SectionLabel>
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {tools.map(t=>(<button key={t.name} className="card" onClick={()=>setSel(t.name)} style={{padding:"10px 12px",background:sel===t.name?`${t.color}12`:"#0a0d14",border:sel===t.name?`2px solid ${t.color}`:"2px solid #141720",borderRadius:12,fontFamily:F,cursor:"pointer",textAlign:"center",flex:"1 1 90px"}}><div style={{fontSize:20,marginBottom:2}}>{t.icon}</div><div style={{fontSize:9,fontWeight:700,color:sel===t.name?t.color:"#475569"}}>{t.name}</div></button>))}
      </div>
      {act && (
        <div className="fade-in" key={sel} style={{background:"#0d1117",borderRadius:14,padding:18,border:"1px solid #1a1f2e"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:48,height:48,borderRadius:12,background:`${act.color}15`,border:`2px solid ${act.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{act.icon}</div>
            <div><div style={{fontWeight:700,fontSize:17,color:"#e2e8f0"}}>{act.name}</div><span style={{fontFamily:MM,fontSize:10,color:act.color}}>{act.name==="Azure Arc"?"Hybrid Management":"Migration"}</span></div>
          </div>
          <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.7,marginBottom:14}}>{act.desc}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{act.tags.map(f=><span key={f} style={{padding:"4px 10px",background:`${act.color}10`,border:`1px solid ${act.color}20`,borderRadius:6,fontSize:10,color:act.color}}>{f}</span>)}</div>
        </div>
      )}
      <div style={{marginTop:16,padding:"14px 18px",background:"rgba(147,51,234,0.06)",borderRadius:12,border:"1px solid #9333ea20"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#9333ea",marginBottom:6}}>Decision Guide</div>
        <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.7}}>
          <strong style={{color:"#e2e8f0"}}>Small data (GBs):</strong> AzCopy or Storage Explorer · <strong style={{color:"#e2e8f0"}}>Large offline (TBs):</strong> Data Box · <strong style={{color:"#e2e8f0"}}>Full migration:</strong> Azure Migrate · <strong style={{color:"#e2e8f0"}}>Keep synced:</strong> File Sync · <strong style={{color:"#e2e8f0"}}>Multi-cloud:</strong> Arc
        </div>
      </div>
    </div>
  );
}