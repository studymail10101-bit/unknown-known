// @ts-nocheck
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
    { port:443, action:"Allow", dir:"Inbound", label:"HTTPS", proto:"TCP", desc:"Secure web traffic" },
    { port:80, action:"Allow", dir:"Inbound", label:"HTTP", proto:"TCP", desc:"Unencrypted web traffic" },
    { port:22, action:"Deny", dir:"Inbound", label:"SSH", proto:"TCP", desc:"Linux remote shell" },
    { port:3389, action:"Deny", dir:"Inbound", label:"RDP", proto:"TCP", desc:"Windows remote desktop" },
    { port:1433, action:"Deny", dir:"Inbound", label:"SQL", proto:"TCP", desc:"SQL Server database" },
    { port:3306, action:"Deny", dir:"Inbound", label:"MySQL", proto:"TCP", desc:"MySQL database" },
  ]);
  const [selNode, setSelNode] = useState(null);
  const [trafficLog, setTrafficLog] = useState([]);
  const [simRunning, setSimRunning] = useState(true);
  const [activeTab, setActiveTab] = useState("topology");
  const [hoveredSubnet, setHoveredSubnet] = useState(null);
  const [peeringDemo, setPeeringDemo] = useState(false);
  const [dnsQuery, setDnsQuery] = useState("");
  const [dnsResult, setDnsResult] = useState(null);
  const [dnsAnimating, setDnsAnimating] = useState(false);
  const [endpointView, setEndpointView] = useState("public");

  const toggleRule = (i) => {
    setNsgRules(p => p.map((r,j) => j===i ? {...r, action: r.action==="Allow"?"Deny":"Allow"} : r));
    const rule = nsgRules[i];
    const newAction = rule.action === "Allow" ? "Deny" : "Allow";
    addLog(newAction === "Allow" ? "allow" : "deny", `Port ${rule.port} (${rule.label}) → ${newAction.toUpperCase()}`);
  };
  const allowedPorts = nsgRules.filter(r=>r.action==="Allow").map(r=>r.port);
  const deniedPorts = nsgRules.filter(r=>r.action==="Deny").map(r=>r.port);

  const addLog = useCallback((type, msg) => {
    setTrafficLog(p => [{id:Date.now()+Math.random(), type, msg, time: new Date().toLocaleTimeString()}, ...p].slice(0,15));
  }, []);

  // Simulated traffic generator
  useEffect(() => {
    if (!simRunning) return;
    const ports = [443,80,22,3389,1433,3306,8080,53];
    const sources = ["203.0.113.42","198.51.100.7","10.0.1.4","172.16.0.1","8.8.8.8","192.168.1.100"];
    const interval = setInterval(() => {
      const port = ports[Math.floor(Math.random()*ports.length)];
      const src = sources[Math.floor(Math.random()*sources.length)];
      const rule = nsgRules.find(r => r.port === port);
      const allowed = rule ? rule.action === "Allow" : false;
      const label = rule?.label || `Port ${port}`;
      addLog(allowed ? "allow" : "deny", `${src} → :${port} (${label}) ${allowed ? "✓ ALLOWED" : "✗ BLOCKED"}`);
    }, 2200);
    return () => clearInterval(interval);
  }, [simRunning, nsgRules, addLog]);

  const DNS_RECORDS = [
    { name:"app.contoso.com", type:"A", value:"10.0.1.4", ttl:3600, zone:"Public" },
    { name:"api.contoso.com", type:"CNAME", value:"app-service-01.azurewebsites.net", ttl:3600, zone:"Public" },
    { name:"sql.internal", type:"A", value:"10.0.2.10", ttl:300, zone:"Private" },
    { name:"storage.internal", type:"A", value:"10.0.2.20", ttl:300, zone:"Private" },
    { name:"contoso.com", type:"MX", value:"mail.contoso.com", ttl:7200, zone:"Public" },
  ];

  const resolveDns = (query) => {
    setDnsAnimating(true);
    setDnsResult(null);
    const q = query.toLowerCase().trim();
    setTimeout(() => {
      const record = DNS_RECORDS.find(r => r.name.toLowerCase() === q);
      setDnsResult(record || { name:q, type:"NXDOMAIN", value:"Not found", ttl:0, zone:"—" });
      setDnsAnimating(false);
      addLog(record ? "allow" : "deny", `DNS: ${q} → ${record ? record.value : "NXDOMAIN"}`);
    }, 1200);
  };

  const SUBNETS = [
    { name:"Frontend", cidr:"10.0.1.0/24", color:"#3b82f6", nsg:"nsg-frontend", resources:[
      { name:"vm-web-01", type:"VM", ip:"10.0.1.4", status:"Running", icon:"⬢" },
      { name:"vm-web-02", type:"VM", ip:"10.0.1.5", status:"Running", icon:"⬢" },
      { name:"lb-frontend", type:"Load Balancer", ip:"10.0.1.6", status:"Active", icon:"⇄" },
    ]},
    { name:"Backend", cidr:"10.0.2.0/24", color:"#ef4444", nsg:"nsg-backend", resources:[
      { name:"sql-db-01", type:"SQL DB", ip:"10.0.2.10", status:"Online", icon:"◫", privateEP:true },
      { name:"storage-01", type:"Storage", ip:"10.0.2.20", status:"Available", icon:"◨" },
      { name:"redis-01", type:"Cache", ip:"10.0.2.30", status:"Connected", icon:"◇" },
    ]},
    { name:"Management", cidr:"10.0.3.0/24", color:"#8b5cf6", nsg:"nsg-mgmt", resources:[
      { name:"jumpbox-01", type:"VM", ip:"10.0.3.4", status:"Deallocated", icon:"⬢" },
      { name:"bastion-01", type:"Bastion", ip:"10.0.3.5", status:"Active", icon:"🛡️" },
    ]},
  ];

  const tabs = [
    { id:"topology", label:"🗺️ Topology", desc:"Live network map" },
    { id:"nsg", label:"🛡️ NSG Rules", desc:"Firewall control" },
    { id:"dns", label:"🏷️ DNS Lab", desc:"Name resolution" },
    { id:"peering", label:"↔ Peering", desc:"VNet connections" },
    { id:"endpoints", label:"🔒 Endpoints", desc:"Public vs Private" },
  ];

  return (
    <div style={{ maxWidth:820, margin:"0 auto" }}>
      <SectionLabel color="#ffb900">Interactive Network Lab</SectionLabel>

      {/* Tab Navigation */}
      <div style={{ display:"flex", gap:4, marginBottom:18, overflowX:"auto", padding:"2px 0" }}>
        {tabs.map(t => (
          <button key={t.id} className="card" onClick={() => setActiveTab(t.id)}
            style={{ padding:"10px 16px", background: activeTab===t.id ? "#141720" : "#0a0d14", border: activeTab===t.id ? "2px solid #ffb900" : "2px solid #141720", borderRadius:12, fontFamily:F, cursor:"pointer", flex:"1 1 0", minWidth:100, textAlign:"center" }}>
            <div style={{ fontSize:16, marginBottom:2 }}>{t.label.split(" ")[0]}</div>
            <div style={{ fontSize:10, fontWeight:700, color: activeTab===t.id ? "#ffb900" : "#475569" }}>{t.label.split(" ").slice(1).join(" ")}</div>
            <div style={{ fontSize:8, color:"#334155", marginTop:2 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* ======== TOPOLOGY TAB ======== */}
      {activeTab === "topology" && (
        <div className="fade-in">
          {/* Main network diagram — large, interactive */}
          <div style={{ background:"#060910", borderRadius:18, padding:24, border:"1px solid #1a1f2e", marginBottom:14, position:"relative", overflow:"hidden", minHeight:340 }}>
            {/* Background grid */}
            <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", opacity:0.15 }}>
              {Array.from({length:20}).map((_,i) => <line key={`h${i}`} x1="0" y1={i*20} x2="100%" y2={i*20} stroke="#1a1f2e" strokeWidth="0.5"/>)}
              {Array.from({length:30}).map((_,i) => <line key={`v${i}`} x1={i*30} y1="0" x2={i*30} y2="100%" stroke="#1a1f2e" strokeWidth="0.5"/>)}
            </svg>

            {/* Animated traffic packets - allowed */}
            <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:5 }}>
              {simRunning && allowedPorts.length > 0 && [0,1,2,3].map(i => (
                <g key={`allow${i}`}>
                  <circle r="3" fill="#10b981" opacity="0" filter="url(#glowGreen)">
                    <animate attributeName="cx" values="6%;12%;18%;44%" dur={`${2.2+i*0.4}s`} repeatCount="indefinite" begin={`${i*0.55}s`}/>
                    <animate attributeName="cy" values={`${38+i*6}%;${36+i*6}%;${34+i*6}%;${40+i*3}%`} dur={`${2.2+i*0.4}s`} repeatCount="indefinite" begin={`${i*0.55}s`}/>
                    <animate attributeName="opacity" values="0;0.9;0.9;0.9;0" dur={`${2.2+i*0.4}s`} repeatCount="indefinite" begin={`${i*0.55}s`}/>
                  </circle>
                  {/* Packet trail */}
                  <circle r="1.5" fill="#10b981" opacity="0">
                    <animate attributeName="cx" values="6%;12%;18%;44%" dur={`${2.2+i*0.4}s`} repeatCount="indefinite" begin={`${i*0.55+0.08}s`}/>
                    <animate attributeName="cy" values={`${38+i*6}%;${36+i*6}%;${34+i*6}%;${40+i*3}%`} dur={`${2.2+i*0.4}s`} repeatCount="indefinite" begin={`${i*0.55+0.08}s`}/>
                    <animate attributeName="opacity" values="0;0.4;0.4;0.4;0" dur={`${2.2+i*0.4}s`} repeatCount="indefinite" begin={`${i*0.55+0.08}s`}/>
                  </circle>
                </g>
              ))}
              {/* Blocked packets — bounce off NSG */}
              {simRunning && deniedPorts.length > 0 && [0,1].map(i => (
                <g key={`deny${i}`}>
                  <circle r="3" fill="#ef4444" opacity="0">
                    <animate attributeName="cx" values="6%;16%;18%;16%;6%" dur="1.8s" repeatCount="indefinite" begin={`${i*0.9}s`}/>
                    <animate attributeName="cy" values={`${55+i*10}%;${52+i*10}%;${50+i*10}%;${52+i*10}%;${55+i*10}%`} dur="1.8s" repeatCount="indefinite" begin={`${i*0.9}s`}/>
                    <animate attributeName="opacity" values="0;0.8;1;0.8;0" dur="1.8s" repeatCount="indefinite" begin={`${i*0.9}s`}/>
                  </circle>
                  {/* X mark on bounce */}
                  <text fill="#ef4444" fontSize="10" fontWeight="bold" opacity="0">
                    <animate attributeName="x" values="16%;18%;18%" dur="1.8s" repeatCount="indefinite" begin={`${i*0.9}s`}/>
                    <animate attributeName="y" values={`${49+i*10}%;${47+i*10}%;${47+i*10}%`} dur="1.8s" repeatCount="indefinite" begin={`${i*0.9}s`}/>
                    <animate attributeName="opacity" values="0;0;1;0.5;0" dur="1.8s" repeatCount="indefinite" begin={`${i*0.9}s`}/>
                    ✗
                  </text>
                </g>
              ))}
              {/* Internal traffic between subnets */}
              {simRunning && [0,1].map(i => (
                <circle key={`int${i}`} r="2" fill="#ffb900" opacity="0">
                  <animate attributeName="cx" values="52%;62%;72%" dur="2.5s" repeatCount="indefinite" begin={`${i*1.2}s`}/>
                  <animate attributeName="cy" values={`${35+i*5}%;${55}%;${70+i*3}%`} dur="2.5s" repeatCount="indefinite" begin={`${i*1.2}s`}/>
                  <animate attributeName="opacity" values="0;0.6;0.6;0" dur="2.5s" repeatCount="indefinite" begin={`${i*1.2}s`}/>
                </circle>
              ))}
              {/* SVG filters for glow */}
              <defs>
                <filter id="glowGreen"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="glowRed"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
            </svg>

            <div style={{ position:"relative", zIndex:2 }}>
              <div style={{ display:"flex", alignItems:"stretch", gap:0 }}>
                {/* Internet cloud */}
                <div style={{ width:80, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <div className={simRunning ? "pulse-anim" : ""} onClick={() => setSelNode(selNode==="internet"?null:"internet")}
                    style={{ width:60, height:60, borderRadius:"50%", background:"radial-gradient(circle at 30% 30%, #1e293b, #0d1117)", border: selNode==="internet" ? "2px solid #60a5fa" : "2px solid #334155", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, cursor:"pointer", boxShadow: selNode==="internet" ? "0 0 20px #60a5fa30" : "none" }}>
                    🌐
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8" }}>Internet</div>
                  <div style={{ fontFamily:MM, fontSize:8, color:"#334155" }}>0.0.0.0/0</div>
                </div>

                {/* Connection line + port labels */}
                <div style={{ width:60, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative" }}>
                  <div style={{ width:"100%", height:3, background:"linear-gradient(90deg, #475569, #ffb900)", borderRadius:2, position:"relative" }}>
                    <div className={simRunning ? "sparkle-anim" : ""} style={{ position:"absolute", right:-2, top:-3, width:9, height:9, borderRadius:"50%", background:"#ffb900" }}/>
                  </div>
                  <div style={{ fontSize:8, color:"#ffb900", fontFamily:MM, marginTop:4, textAlign:"center", lineHeight:1.3 }}>
                    {allowedPorts.length > 0 ? <span style={{ color:"#10b981" }}>✓ {allowedPorts.join(",")}</span> : <span style={{ color:"#ef4444" }}>✗ ALL BLOCKED</span>}
                  </div>
                </div>

                {/* NSG Shield — interactive */}
                <div style={{ width:56, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
                  onClick={() => setActiveTab("nsg")}>
                  <div className={`card ${deniedPorts.length > 0 ? "glow-box" : ""}`}
                    style={{ width:48, height:60, background:"linear-gradient(180deg, rgba(255,185,0,0.15), rgba(255,185,0,0.05))", border:"2px solid #ffb900", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", cursor:"pointer", position:"relative" }}>
                    <span style={{ fontSize:22 }}>🛡️</span>
                    <span style={{ fontFamily:MM, fontSize:8, color:"#ffb900", fontWeight:700 }}>NSG</span>
                    {/* Rule counts */}
                    <div style={{ position:"absolute", top:-6, right:-6, display:"flex", gap:2 }}>
                      <div style={{ width:16, height:16, borderRadius:"50%", background:"#10b981", fontSize:8, fontFamily:MM, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700 }}>{allowedPorts.length}</div>
                      <div style={{ width:16, height:16, borderRadius:"50%", background:"#ef4444", fontSize:8, fontFamily:MM, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700 }}>{deniedPorts.length}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:7, color:"#475569", marginTop:4, textAlign:"center" }}>Click to edit rules</div>
                </div>

                {/* Arrow into VNet */}
                <div style={{ width:30, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ width:"100%", height:3, background:"linear-gradient(90deg, #ffb900, #0078d4)", borderRadius:2 }} />
                </div>

                {/* VNet container */}
                <div style={{ flex:1, background:"rgba(0,120,212,0.04)", border:"2px dashed #0078d440", borderRadius:18, padding:14, position:"relative" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <span style={{ fontSize:14 }}>⬡</span>
                    <span style={{ fontFamily:MM, fontSize:11, color:"#0078d4", fontWeight:700 }}>VNet: 10.0.0.0/16</span>
                    <div style={{ flex:1 }}/>
                    <span style={{ fontFamily:MM, fontSize:8, color:"#334155" }}>65,536 IPs</span>
                  </div>

                  {/* Subnets — clickable with hover effects */}
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {SUBNETS.map((sub) => {
                      const isHov = hoveredSubnet === sub.name;
                      const isSel = selNode === sub.name;
                      return (
                        <div key={sub.name}
                          onMouseEnter={() => setHoveredSubnet(sub.name)}
                          onMouseLeave={() => setHoveredSubnet(null)}
                          onClick={() => setSelNode(isSel ? null : sub.name)}
                          className="card"
                          style={{ background: isSel ? `${sub.color}10` : isHov ? `${sub.color}06` : "rgba(13,17,23,0.6)", border: isSel ? `2px solid ${sub.color}60` : `1.5px solid ${sub.color}20`, borderRadius:12, padding:12, cursor:"pointer", transition:"all 0.2s" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: isSel ? 10 : 0 }}>
                            <div style={{ width:10, height:10, borderRadius:3, background:sub.color }} />
                            <span style={{ fontFamily:MM, fontSize:10, color:sub.color, fontWeight:700 }}>▤ {sub.name}: {sub.cidr}</span>
                            <div style={{ flex:1 }}/>
                            <span style={{ fontFamily:MM, fontSize:8, color:"#334155" }}>NSG: {sub.nsg}</span>
                            <span style={{ fontFamily:MM, fontSize:9, color:"#475569" }}>{sub.resources.length} resources</span>
                            <span style={{ fontSize:10, color:sub.color, transition:"transform 0.2s", transform: isSel ? "rotate(90deg)" : "rotate(0)" }}>▶</span>
                          </div>
                          {/* Expanded resource list */}
                          {isSel && (
                            <div className="fade-in" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(130px, 1fr))", gap:6 }}>
                              {sub.resources.map(res => (
                                <div key={res.name} style={{ background:"#0a0d14", borderRadius:8, padding:10, border:"1px solid #1a1f2e", textAlign:"center", position:"relative" }}>
                                  {res.privateEP && (
                                    <div style={{ position:"absolute", top:4, right:4, width:8, height:8, borderRadius:"50%", background:"#10b981", boxShadow:"0 0 6px #10b98160" }}/>
                                  )}
                                  <div style={{ fontSize:18, marginBottom:4 }}>{res.icon}</div>
                                  <div style={{ fontFamily:MM, fontSize:9, color:"#e2e8f0", fontWeight:600 }}>{res.name}</div>
                                  <div style={{ fontSize:9, color:"#475569", marginTop:2 }}>{res.type}</div>
                                  <div style={{ fontFamily:MM, fontSize:8, color:sub.color, marginTop:2 }}>{res.ip}</div>
                                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:3, marginTop:4 }}>
                                    <div style={{ width:5, height:5, borderRadius:"50%", background: res.status==="Deallocated" ? "#f59e0b" : "#10b981" }}/>
                                    <span style={{ fontSize:7, color: res.status==="Deallocated" ? "#f59e0b" : "#10b981", fontFamily:MM }}>{res.status}</span>
                                  </div>
                                  {res.privateEP && <div style={{ fontSize:7, color:"#10b981", background:"#10b98110", padding:"1px 4px", borderRadius:3, marginTop:3 }}>🔒 Private Endpoint</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* On-prem connection */}
                <div style={{ width:56, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
                  <div style={{ fontFamily:MM, fontSize:7, color:"#10b981", fontWeight:700, background:"#10b98110", padding:"2px 6px", borderRadius:3 }}>VPN</div>
                  <svg width="4" height="60">
                    <line x1="2" y1="0" x2="2" y2="60" stroke="#10b981" strokeWidth="2" strokeDasharray="4,3">
                      <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite"/>
                    </line>
                  </svg>
                  <div style={{ fontFamily:MM, fontSize:7, color:"#8b5cf6", fontWeight:700, background:"#8b5cf610", padding:"2px 6px", borderRadius:3 }}>ER</div>
                </div>

                <div style={{ width:70, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
                  onClick={() => setSelNode(selNode==="onprem"?null:"onprem")}>
                  <div className="card" style={{ width:52, height:52, borderRadius:10, background:"linear-gradient(135deg, #1e293b, #141720)", border: selNode==="onprem" ? "2px solid #f59e0b" : "2px solid #334155", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, cursor:"pointer" }}>
                    🏢
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", marginTop:4 }}>On-Prem</div>
                  <div style={{ fontFamily:MM, fontSize:8, color:"#334155" }}>192.168.0.0/16</div>
                </div>
              </div>
            </div>

            {/* Sim toggle */}
            <div style={{ position:"absolute", top:10, right:10, display:"flex", alignItems:"center", gap:6, zIndex:10 }}>
              <span style={{ fontSize:8, color:"#475569", fontFamily:MM }}>TRAFFIC SIM</span>
              <div onClick={() => setSimRunning(p => !p)}
                style={{ width:36, height:18, borderRadius:9, background: simRunning ? "#10b981" : "#334155", cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
                <div style={{ position:"absolute", top:2, left: simRunning ? 20 : 2, width:14, height:14, borderRadius:7, background:"#fff", transition:"left 0.2s" }}/>
              </div>
            </div>
          </div>

          {/* Info panel for selected node */}
          {selNode && selNode !== "internet" && selNode !== "onprem" && (
            <div className="fade-in" style={{ padding:14, background:"#0d1117", borderRadius:12, border:"1px solid #1a1f2e", marginBottom:14 }}>
              {(() => {
                const sub = SUBNETS.find(s => s.name === selNode);
                if (!sub) return null;
                return (
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <div style={{ width:12, height:12, borderRadius:4, background:sub.color }}/>
                      <span style={{ fontWeight:700, fontSize:14, color:"#e2e8f0" }}>{sub.name} Subnet</span>
                      <span style={{ fontFamily:MM, fontSize:10, color:sub.color }}>{sub.cidr}</span>
                      <div style={{ flex:1 }}/>
                      <span style={{ fontFamily:MM, fontSize:9, color:"#475569" }}>254 usable IPs • NSG: {sub.nsg}</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                      <div style={{ padding:10, background:"#080b12", borderRadius:8, textAlign:"center" }}>
                        <div style={{ fontFamily:MM, fontSize:20, fontWeight:700, color:sub.color }}>{sub.resources.length}</div>
                        <div style={{ fontSize:9, color:"#475569" }}>Resources</div>
                      </div>
                      <div style={{ padding:10, background:"#080b12", borderRadius:8, textAlign:"center" }}>
                        <div style={{ fontFamily:MM, fontSize:20, fontWeight:700, color:"#10b981" }}>{sub.resources.filter(r=>r.status!=="Deallocated").length}</div>
                        <div style={{ fontSize:9, color:"#475569" }}>Active</div>
                      </div>
                      <div style={{ padding:10, background:"#080b12", borderRadius:8, textAlign:"center" }}>
                        <div style={{ fontFamily:MM, fontSize:20, fontWeight:700, color: sub.resources.some(r=>r.privateEP) ? "#10b981" : "#334155" }}>{sub.resources.filter(r=>r.privateEP).length}</div>
                        <div style={{ fontSize:9, color:"#475569" }}>Private EPs</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Traffic log — live feed */}
          <div style={{ background:"#050810", borderRadius:12, border:"1px solid #1a1f2e", overflow:"hidden" }}>
            <div style={{ padding:"8px 14px", borderBottom:"1px solid #1a1f2e", display:"flex", alignItems:"center", gap:8 }}>
              <div className={simRunning ? "pulse-anim" : ""} style={{ width:6, height:6, borderRadius:"50%", background: simRunning ? "#10b981" : "#334155" }}/>
              <span style={{ fontFamily:MM, fontSize:10, color:"#475569" }}>TRAFFIC LOG</span>
              <div style={{ flex:1 }}/>
              <span style={{ fontSize:8, color:"#252a3a", fontFamily:MM }}>{trafficLog.length} events</span>
            </div>
            <div style={{ maxHeight:120, overflowY:"auto", padding:"4px 0" }}>
              {trafficLog.length === 0 ? (
                <div style={{ padding:16, textAlign:"center", fontSize:10, color:"#252a3a" }}>Waiting for traffic...</div>
              ) : trafficLog.map(log => (
                <div key={log.id} className="fade-in" style={{ display:"flex", alignItems:"center", gap:8, padding:"3px 14px", fontSize:9 }}>
                  <span style={{ fontFamily:MM, color:"#252a3a", fontSize:8, flexShrink:0 }}>{log.time}</span>
                  <span style={{ color: log.type==="allow" ? "#10b981" : "#ef4444", fontFamily:MM, fontSize:10, flexShrink:0 }}>{log.type==="allow" ? "✓" : "✗"}</span>
                  <span style={{ color:"#64748b", fontFamily:MM }}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======== NSG TAB ======== */}
      {activeTab === "nsg" && (
        <div className="fade-in">
          <div style={{ display:"flex", gap:14, marginBottom:16, alignItems:"center" }}>
            {/* Visual firewall gauge */}
            <div style={{ position:"relative", width:80, height:80, flexShrink:0 }}>
              <svg width="80" height="80" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#1a1f2e" strokeWidth="10"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke={allowedPorts.length === 0 ? "#10b981" : deniedPorts.length === 0 ? "#ef4444" : "#ffb900"} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={2*Math.PI*38} strokeDashoffset={2*Math.PI*38 - (deniedPorts.length / nsgRules.length) * 2*Math.PI*38}
                  transform="rotate(-90 50 50)" style={{ transition:"stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)" }}/>
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontFamily:MM, fontSize:20, fontWeight:700, color: deniedPorts.length === nsgRules.length ? "#10b981" : "#ffb900" }}>{Math.round(deniedPorts.length/nsgRules.length*100)}%</span>
                <span style={{ fontSize:7, color:"#475569" }}>Blocked</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>Network Security Group</div>
              <div style={{ fontSize:11, color:"#64748b" }}>Click any rule to toggle Allow/Deny. Watch traffic respond in real-time.</div>
              <div style={{ display:"flex", gap:6, marginTop:6 }}>
                <span style={{ fontSize:9, padding:"2px 8px", background:"#10b98110", color:"#10b981", borderRadius:4, fontFamily:MM }}>✓ {allowedPorts.length} allowed</span>
                <span style={{ fontSize:9, padding:"2px 8px", background:"#ef444410", color:"#ef4444", borderRadius:4, fontFamily:MM }}>✗ {deniedPorts.length} denied</span>
              </div>
            </div>
          </div>

          {/* Rules — visual toggle cards */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
            {nsgRules.map((r, i) => {
              const on = r.action==="Allow";
              return (
                <div key={i} className="card" onClick={() => toggleRule(i)}
                  style={{ padding:"14px 16px", background: on ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)", border:`2px solid ${on ? "#10b98140" : "#ef444440"}`, borderRadius:12, cursor:"pointer", position:"relative", overflow:"hidden" }}>
                  {/* Top color bar */}
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background: on ? "#10b981" : "#ef4444" }}/>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    {/* Toggle visual */}
                    <div style={{ width:40, height:22, borderRadius:11, background: on ? "#10b981" : "#ef4444", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
                      <div style={{ position:"absolute", top:2, left: on ? 20 : 2, width:18, height:18, borderRadius:9, background:"#fff", transition:"left 0.2s", boxShadow:"0 2px 4px rgba(0,0,0,0.3)" }}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{r.label}</span>
                        <span style={{ fontFamily:MM, fontSize:10, color: on ? "#10b981" : "#ef4444", fontWeight:700 }}>{on ? "ALLOW" : "DENY"}</span>
                      </div>
                      <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{r.desc}</div>
                      <div style={{ fontFamily:MM, fontSize:9, color:"#334155", marginTop:2 }}>:{r.port} {r.proto} {r.dir}</div>
                    </div>
                    {/* Visual indicator */}
                    <div style={{ fontSize:24, opacity:0.6 }}>{on ? "🟢" : "🔴"}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual: What happens when a packet arrives */}
          <div style={{ padding:16, background:"#080b12", borderRadius:14, border:"1px solid #1a1f2e" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#ffb900", marginBottom:12 }}>📦 How NSG Evaluates Traffic</div>
            <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap", justifyContent:"center" }}>
              {[
                { label:"Packet Arrives", icon:"📨", color:"#94a3b8" },
                { label:"Check Priority", icon:"📋", color:"#3b82f6" },
                { label:"Match Rule?", icon:"🔍", color:"#ffb900" },
                { label:"Allow / Deny", icon:"⚖️", color:"#10b981" },
                { label:"Log Result", icon:"📝", color:"#8b5cf6" },
              ].map((step, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ textAlign:"center", padding:"8px 12px", background:`${step.color}08`, border:`1px solid ${step.color}25`, borderRadius:10, minWidth:70 }}>
                    <div style={{ fontSize:18, marginBottom:2 }}>{step.icon}</div>
                    <div style={{ fontSize:8, fontWeight:700, color:step.color }}>{step.label}</div>
                  </div>
                  {i < 4 && <span style={{ color:"#334155", fontSize:14 }}>→</span>}
                </div>
              ))}
            </div>
            <div style={{ marginTop:10, fontSize:10, color:"#475569", textAlign:"center" }}>Rules are evaluated by <strong style={{ color:"#ffb900" }}>priority number</strong> (lowest = first). First match wins. Default: deny all inbound.</div>
          </div>
        </div>
      )}

      {/* ======== DNS TAB ======== */}
      {activeTab === "dns" && (
        <div className="fade-in">
          <div style={{ padding:18, background:"#0d1117", borderRadius:14, border:"1px solid #1a1f2e", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <span style={{ fontSize:22 }}>🏷️</span>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:"#a78bfa" }}>DNS Resolution Lab</div>
                <div style={{ fontSize:11, color:"#475569" }}>Type a hostname to see how Azure DNS resolves it</div>
              </div>
            </div>
            {/* Search box */}
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              <input
                value={dnsQuery}
                onChange={e => setDnsQuery(e.target.value)}
                onKeyDown={e => e.key==="Enter" && dnsQuery && resolveDns(dnsQuery)}
                placeholder="e.g. app.contoso.com"
                style={{ flex:1, padding:"10px 14px", background:"#080b12", border:"1.5px solid #1a1f2e", borderRadius:10, color:"#e2e8f0", fontFamily:MM, fontSize:12, outline:"none" }}
              />
              <button className="card" onClick={() => dnsQuery && resolveDns(dnsQuery)}
                style={{ padding:"10px 20px", background:"#a78bfa15", border:"1.5px solid #a78bfa40", borderRadius:10, color:"#a78bfa", fontFamily:F, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                Resolve
              </button>
            </div>
            {/* Quick picks */}
            <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:14 }}>
              {DNS_RECORDS.map(r => (
                <button key={r.name} className="card" onClick={() => { setDnsQuery(r.name); resolveDns(r.name); }}
                  style={{ padding:"4px 10px", background:"#141720", border:"1px solid #1a1f2e", borderRadius:6, fontFamily:MM, fontSize:9, color:"#64748b", cursor:"pointer" }}>
                  {r.name}
                </button>
              ))}
            </div>
            {/* Animation / Result */}
            {dnsAnimating && (
              <div style={{ textAlign:"center", padding:20 }}>
                <div className="pulse-anim" style={{ fontSize:28, marginBottom:8 }}>🔍</div>
                <div style={{ fontFamily:MM, fontSize:11, color:"#a78bfa" }}>Querying DNS servers...</div>
                <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:8 }}>
                  {[0,1,2].map(i => (
                    <div key={i} className="sparkle-anim" style={{ width:6, height:6, borderRadius:"50%", background:"#a78bfa", animationDelay:`${i*0.3}s` }}/>
                  ))}
                </div>
              </div>
            )}
            {dnsResult && !dnsAnimating && (
              <div className="fade-in" style={{ padding:14, background:"#080b12", borderRadius:12, border: dnsResult.type==="NXDOMAIN" ? "1.5px solid #ef444440" : "1.5px solid #10b98140" }}>
                {/* Visual flow */}
                <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"center", marginBottom:14, flexWrap:"wrap" }}>
                  <div style={{ padding:"8px 14px", background:"#141720", borderRadius:8, textAlign:"center" }}>
                    <div style={{ fontSize:14, marginBottom:2 }}>🌐</div>
                    <div style={{ fontFamily:MM, fontSize:8, color:"#94a3b8" }}>{dnsResult.name}</div>
                  </div>
                  <svg width="60" height="20">
                    <line x1="0" y1="10" x2="60" y2="10" stroke={dnsResult.type==="NXDOMAIN" ? "#ef4444" : "#a78bfa"} strokeWidth="2" strokeDasharray="4,3">
                      <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite"/>
                    </line>
                  </svg>
                  <div style={{ padding:"8px 14px", background:"#a78bfa08", border:"1px solid #a78bfa25", borderRadius:8, textAlign:"center" }}>
                    <div style={{ fontSize:14, marginBottom:2 }}>🏷️</div>
                    <div style={{ fontFamily:MM, fontSize:8, color:"#a78bfa" }}>Azure DNS</div>
                  </div>
                  <svg width="60" height="20">
                    <line x1="0" y1="10" x2="60" y2="10" stroke={dnsResult.type==="NXDOMAIN" ? "#ef4444" : "#10b981"} strokeWidth="2" strokeDasharray="4,3">
                      <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite"/>
                    </line>
                  </svg>
                  <div style={{ padding:"8px 14px", background: dnsResult.type==="NXDOMAIN" ? "#ef444408" : "#10b98108", border: `1px solid ${dnsResult.type==="NXDOMAIN" ? "#ef444425" : "#10b98125"}`, borderRadius:8, textAlign:"center" }}>
                    <div style={{ fontSize:14, marginBottom:2 }}>{dnsResult.type==="NXDOMAIN" ? "❌" : "✅"}</div>
                    <div style={{ fontFamily:MM, fontSize:8, color: dnsResult.type==="NXDOMAIN" ? "#ef4444" : "#10b981" }}>{dnsResult.value}</div>
                  </div>
                </div>
                {/* Record details */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                  {[{l:"Type",v:dnsResult.type,c:"#a78bfa"},{l:"Value",v:dnsResult.value,c:"#10b981"},{l:"TTL",v:dnsResult.ttl ? `${dnsResult.ttl}s` : "—",c:"#ffb900"},{l:"Zone",v:dnsResult.zone,c:"#3b82f6"}].map(f=>(
                    <div key={f.l} style={{ padding:"8px 10px", background:"#0d1117", borderRadius:8, textAlign:"center" }}>
                      <div style={{ fontSize:8, color:"#475569", textTransform:"uppercase", letterSpacing:1, marginBottom:2 }}>{f.l}</div>
                      <div style={{ fontFamily:MM, fontSize:11, color:f.c, fontWeight:600 }}>{f.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* DNS zone types comparison */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ padding:"14px 16px", background:"#0a0d14", borderRadius:12, border:"1px solid #3b82f630", borderTop:"3px solid #3b82f6" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:16 }}>🌍</span>
                <span style={{ fontWeight:700, fontSize:13, color:"#3b82f6" }}>Public DNS Zone</span>
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.7, marginBottom:8 }}>Resolves names from the internet. Anyone can query. Used for websites, APIs, mail.</div>
              <div style={{ fontFamily:MM, fontSize:9, color:"#3b82f6", padding:"6px 10px", background:"#3b82f608", borderRadius:6 }}>
                app.contoso.com → 52.168.1.100
              </div>
            </div>
            <div style={{ padding:"14px 16px", background:"#0a0d14", borderRadius:12, border:"1px solid #10b98130", borderTop:"3px solid #10b981" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:16 }}>🔒</span>
                <span style={{ fontWeight:700, fontSize:13, color:"#10b981" }}>Private DNS Zone</span>
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.7, marginBottom:8 }}>Only resolves inside linked VNets. Not visible to internet. Internal service discovery.</div>
              <div style={{ fontFamily:MM, fontSize:9, color:"#10b981", padding:"6px 10px", background:"#10b98108", borderRadius:6 }}>
                sql.internal → 10.0.2.10
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======== PEERING TAB ======== */}
      {activeTab === "peering" && (
        <div className="fade-in">
          <div style={{ padding:20, background:"#060910", borderRadius:16, border:"1px solid #1a1f2e", marginBottom:14, position:"relative" }}>
            {/* Toggle peering */}
            <div style={{ position:"absolute", top:12, right:12, display:"flex", alignItems:"center", gap:6, zIndex:5 }}>
              <span style={{ fontSize:9, color:"#475569", fontFamily:MM }}>PEERING</span>
              <div onClick={() => setPeeringDemo(p => !p)}
                style={{ width:36, height:18, borderRadius:9, background: peeringDemo ? "#fbbf24" : "#334155", cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
                <div style={{ position:"absolute", top:2, left: peeringDemo ? 20 : 2, width:14, height:14, borderRadius:7, background:"#fff", transition:"left 0.2s" }}/>
              </div>
            </div>

            <div style={{ display:"flex", gap:20, justifyContent:"center", alignItems:"center" }}>
              {/* VNet A */}
              <div style={{ flex:1, maxWidth:260, background:"rgba(0,120,212,0.06)", border:"2px dashed #0078d450", borderRadius:16, padding:16 }}>
                <div style={{ fontFamily:MM, fontSize:11, color:"#0078d4", fontWeight:700, marginBottom:10 }}>⬡ VNet-Prod (East US)</div>
                <div style={{ fontFamily:MM, fontSize:9, color:"#334155", marginBottom:8 }}>10.0.0.0/16</div>
                <div style={{ display:"flex", gap:6 }}>
                  {[{n:"vm-web-01",i:"⬢"},{n:"sql-db-01",i:"◫"}].map(r=>(
                    <div key={r.n} style={{ flex:1, background:"#0a0d14", borderRadius:8, padding:8, textAlign:"center", border:"1px solid #1a1f2e" }}>
                      <div style={{ fontSize:16 }}>{r.i}</div>
                      <div style={{ fontFamily:MM, fontSize:7, color:"#94a3b8" }}>{r.n}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peering connection */}
              <div style={{ width:120, position:"relative", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                {peeringDemo ? (
                  <>
                    <svg width="120" height="50" style={{ overflow:"visible" }}>
                      {/* Bidirectional arrows */}
                      <line x1="5" y1="18" x2="115" y2="18" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="6,4">
                        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite"/>
                      </line>
                      <line x1="115" y1="32" x2="5" y2="32" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="6,4">
                        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite"/>
                      </line>
                      {/* Animated packets */}
                      {[0,1,2].map(i=>(
                        <g key={i}>
                          <circle r="4" fill="#fbbf24">
                            <animate attributeName="cx" from="5" to="115" dur="1.6s" repeatCount="indefinite" begin={`${i*0.5}s`}/>
                            <animate attributeName="cy" values="18" dur="1.6s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0;0.9;0.9;0" dur="1.6s" repeatCount="indefinite" begin={`${i*0.5}s`}/>
                          </circle>
                          <circle r="4" fill="#60a5fa">
                            <animate attributeName="cx" from="115" to="5" dur="1.6s" repeatCount="indefinite" begin={`${i*0.5+0.2}s`}/>
                            <animate attributeName="cy" values="32" dur="1.6s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0;0.9;0.9;0" dur="1.6s" repeatCount="indefinite" begin={`${i*0.5+0.2}s`}/>
                          </circle>
                        </g>
                      ))}
                    </svg>
                    <div style={{ fontFamily:MM, fontSize:9, color:"#fbbf24", fontWeight:700, background:"#fbbf2415", padding:"3px 10px", borderRadius:6 }}>↔ PEERED</div>
                    <div style={{ fontSize:8, color:"#10b981", textAlign:"center" }}>MS Backbone · Low latency · No gateway needed</div>
                  </>
                ) : (
                  <>
                    <svg width="120" height="50">
                      <line x1="5" y1="25" x2="115" y2="25" stroke="#334155" strokeWidth="2" strokeDasharray="4,6"/>
                      <text x="60" y="22" textAnchor="middle" fill="#ef4444" fontSize="16">✗</text>
                    </svg>
                    <div style={{ fontFamily:MM, fontSize:9, color:"#ef4444", fontWeight:700, background:"#ef444410", padding:"3px 10px", borderRadius:6 }}>NOT PEERED</div>
                    <div style={{ fontSize:8, color:"#ef4444", textAlign:"center" }}>VNets isolated · No connectivity</div>
                  </>
                )}
              </div>

              {/* VNet B */}
              <div style={{ flex:1, maxWidth:260, background:"rgba(139,92,246,0.06)", border:"2px dashed #8b5cf650", borderRadius:16, padding:16 }}>
                <div style={{ fontFamily:MM, fontSize:11, color:"#8b5cf6", fontWeight:700, marginBottom:10 }}>⬡ VNet-Dev (West US)</div>
                <div style={{ fontFamily:MM, fontSize:9, color:"#334155", marginBottom:8 }}>10.1.0.0/16</div>
                <div style={{ display:"flex", gap:6 }}>
                  {[{n:"vm-dev-01",i:"⬢"},{n:"cosmos-dev",i:"◫"}].map(r=>(
                    <div key={r.n} style={{ flex:1, background:"#0a0d14", borderRadius:8, padding:8, textAlign:"center", border:"1px solid #1a1f2e" }}>
                      <div style={{ fontSize:16 }}>{r.i}</div>
                      <div style={{ fontFamily:MM, fontSize:7, color:"#94a3b8" }}>{r.n}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Peering rules */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { t:"Non-Transitive", d:"A↔B and B↔C does NOT mean A↔C. Must peer directly.", c:"#ef4444", i:"⚠️" },
              { t:"Cross-Region OK", d:"Global peering works. VNets in different regions can peer.", c:"#10b981", i:"🌍" },
              { t:"No IP Overlap", d:"CIDR ranges must not overlap between peered VNets.", c:"#ffb900", i:"🔢" },
            ].map(r => (
              <div key={r.t} style={{ padding:"12px 14px", background:"#0d1117", borderRadius:10, border:"1px solid #1a1f2e", borderTop:`3px solid ${r.c}` }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{r.i}</div>
                <div style={{ fontSize:12, fontWeight:700, color:r.c, marginBottom:4 }}>{r.t}</div>
                <div style={{ fontSize:10, color:"#64748b", lineHeight:1.6 }}>{r.d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======== ENDPOINTS TAB ======== */}
      {activeTab === "endpoints" && (
        <div className="fade-in">
          <div style={{ display:"flex", gap:6, marginBottom:16 }}>
            {[{id:"public",l:"🌍 Public Endpoint",c:"#ef4444"},{id:"private",l:"🔒 Private Endpoint",c:"#10b981"}].map(e=>(
              <button key={e.id} className="card" onClick={() => setEndpointView(e.id)}
                style={{ flex:1, padding:"14px", background: endpointView===e.id ? `${e.c}08` : "#0a0d14", border: endpointView===e.id ? `2px solid ${e.c}` : "2px solid #141720", borderRadius:14, fontFamily:F, cursor:"pointer", textAlign:"center" }}>
                <div style={{ fontSize:16 }}>{e.l.split(" ")[0]}</div>
                <div style={{ fontSize:12, fontWeight:700, color: endpointView===e.id ? e.c : "#475569" }}>{e.l.split(" ").slice(1).join(" ")}</div>
              </button>
            ))}
          </div>

          {/* Animated comparison */}
          <div style={{ padding:20, background:"#060910", borderRadius:16, border:"1px solid #1a1f2e", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:0, justifyContent:"center" }}>
              {/* App in VNet */}
              <div style={{ width:80, textAlign:"center" }}>
                <div style={{ width:48, height:48, borderRadius:10, background:"#3b82f615", border:"2px solid #3b82f640", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, margin:"0 auto" }}>▣</div>
                <div style={{ fontFamily:MM, fontSize:8, color:"#3b82f6", marginTop:4 }}>App Service</div>
                <div style={{ fontFamily:MM, fontSize:7, color:"#334155" }}>10.0.1.4</div>
              </div>

              {/* Connection path */}
              <div style={{ width:200, position:"relative" }}>
                <svg width="200" height="60" style={{ overflow:"visible" }}>
                  {endpointView === "public" ? (
                    <>
                      {/* Through internet */}
                      <path d="M 10 30 Q 60 -10 100 30 Q 140 70 190 30" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="6,4">
                        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.5s" repeatCount="indefinite"/>
                      </path>
                      <text x="100" y="8" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="'Fira Code'">☁ Public Internet</text>
                      {[0,1].map(i=>(
                        <circle key={i} r="3" fill="#ef4444" opacity="0">
                          <animateMotion dur="2s" repeatCount="indefinite" begin={`${i*1}s`}>
                            <mpath href="#pubPath"/>
                          </animateMotion>
                          <animate attributeName="opacity" values="0;0.9;0.9;0" dur="2s" repeatCount="indefinite" begin={`${i*1}s`}/>
                        </circle>
                      ))}
                      <path id="pubPath" d="M 10 30 Q 60 -10 100 30 Q 140 70 190 30" fill="none" stroke="none"/>
                    </>
                  ) : (
                    <>
                      {/* Direct private link */}
                      <line x1="10" y1="30" x2="190" y2="30" stroke="#10b981" strokeWidth="3" strokeDasharray="6,4">
                        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite"/>
                      </line>
                      <text x="100" y="22" textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="'Fira Code'">🔒 MS Backbone (Private)</text>
                      {[0,1,2].map(i=>(
                        <circle key={i} r="3" fill="#10b981" opacity="0">
                          <animate attributeName="cx" from="10" to="190" dur="1.5s" repeatCount="indefinite" begin={`${i*0.5}s`}/>
                          <animate attributeName="cy" values="30" dur="1.5s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" values="0;0.9;0.9;0" dur="1.5s" repeatCount="indefinite" begin={`${i*0.5}s`}/>
                        </circle>
                      ))}
                    </>
                  )}
                </svg>
              </div>

              {/* Azure SQL */}
              <div style={{ width:80, textAlign:"center" }}>
                <div style={{ width:48, height:48, borderRadius:10, background: endpointView==="private" ? "#10b98115" : "#ef444415", border: `2px solid ${endpointView==="private" ? "#10b98140" : "#ef444440"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, margin:"0 auto" }}>◫</div>
                <div style={{ fontFamily:MM, fontSize:8, color: endpointView==="private" ? "#10b981" : "#ef4444", marginTop:4 }}>Azure SQL</div>
                <div style={{ fontFamily:MM, fontSize:7, color:"#334155" }}>{endpointView==="private" ? "10.0.2.10" : "sql.database.azure.com"}</div>
              </div>
            </div>
          </div>

          {/* Side by side comparison */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ padding:"14px 16px", background:"#0a0d14", borderRadius:12, border: endpointView==="public" ? "2px solid #ef444440" : "1px solid #1a1f2e", opacity: endpointView==="public" ? 1 : 0.5, transition:"all 0.3s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:18 }}>🌍</span>
                <span style={{ fontWeight:700, fontSize:13, color:"#ef4444" }}>Public Endpoint</span>
              </div>
              {[
                { label:"Path", value:"Via public internet", bad:true },
                { label:"IP", value:"Public IP assigned", bad:true },
                { label:"Exposure", value:"Visible to internet", bad:true },
                { label:"Security", value:"Firewall rules needed", bad:true },
                { label:"Cost", value:"No extra charge" },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #1a1f2e08" }}>
                  <span style={{ fontSize:10, color:"#475569" }}>{r.label}</span>
                  <span style={{ fontSize:10, color: r.bad ? "#f87171" : "#94a3b8", fontFamily:MM }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:"14px 16px", background:"#0a0d14", borderRadius:12, border: endpointView==="private" ? "2px solid #10b98140" : "1px solid #1a1f2e", opacity: endpointView==="private" ? 1 : 0.5, transition:"all 0.3s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:18 }}>🔒</span>
                <span style={{ fontWeight:700, fontSize:13, color:"#10b981" }}>Private Endpoint</span>
              </div>
              {[
                { label:"Path", value:"MS backbone only", good:true },
                { label:"IP", value:"Private VNet IP", good:true },
                { label:"Exposure", value:"VNet-only access", good:true },
                { label:"Security", value:"NSG + no internet", good:true },
                { label:"Cost", value:"~$7.30/mo per EP" },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #1a1f2e08" }}>
                  <span style={{ fontSize:10, color:"#475569" }}>{r.label}</span>
                  <span style={{ fontSize:10, color: r.good ? "#10b981" : "#94a3b8", fontFamily:MM }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop:10, padding:"8px 14px", background:"rgba(255,185,0,0.04)", borderRadius:8, borderLeft:"3px solid #ffb900" }}>
            <div style={{ fontSize:10, color:"#fbbf24", fontWeight:700 }}>📝 Exam Tip</div>
            <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>Private Endpoints give PaaS services a <strong style={{ color:"#10b981" }}>private IP inside your VNet</strong>. Traffic never leaves Microsoft's network. This is the Zero Trust approach.</div>
          </div>
        </div>
      )}

      {/* Connectivity comparison — always visible at bottom */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:18 }}>
        <div style={{ padding:"14px 16px", background:"#0a0d14", borderRadius:12, border:"1px solid #10b98130", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg, #10b981, transparent)" }} />
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}><span style={{ fontSize:16 }}>🔐</span><span style={{ fontSize:13, fontWeight:700, color:"#10b981" }}>VPN Gateway</span></div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
            {["Encrypted","Public Internet","~1.25 Gbps","IPSec/IKE"].map(t=><span key={t} style={{ fontSize:9, padding:"2px 7px", background:"#10b98110", color:"#10b981", borderRadius:4, fontFamily:MM }}>{t}</span>)}
          </div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>IPSec tunnel over internet. Site-to-Site or Point-to-Site. Cheaper but slower.</div>
        </div>
        <div style={{ padding:"14px 16px", background:"#0a0d14", borderRadius:12, border:"1px solid #8b5cf630", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg, #8b5cf6, transparent)" }} />
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}><span style={{ fontSize:16 }}>⚡</span><span style={{ fontSize:13, fontWeight:700, color:"#8b5cf6" }}>ExpressRoute</span></div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
            {["Private","Dedicated Fiber","100 Gbps","BGP"].map(t=><span key={t} style={{ fontSize:9, padding:"2px 7px", background:"#8b5cf610", color:"#8b5cf6", borderRadius:4, fontFamily:MM }}>{t}</span>)}
          </div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>Private connection via provider. Never touches public internet. Enterprise-grade.</div>
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
  const [tab, setTab] = useState("calc");
  const tabs = [
    { id:"calc", label:"💰 Pricing Calculator", desc:"Build & estimate" },
    { id:"models", label:"📊 Pricing Models", desc:"PAYG vs Reserved" },
    { id:"tco", label:"🔄 TCO Comparison", desc:"On-prem vs Cloud" },
    { id:"optimize", label:"⚡ Cost Optimization", desc:"Save money" },
    { id:"billing", label:"📋 Billing & Scopes", desc:"How billing works" },
  ];

  return (
    <div style={{ maxWidth:820, margin:"0 auto" }}>
      <SectionLabel color="#ffd700">Azure Cost Management Lab</SectionLabel>
      {/* Tab Navigation */}
      <div style={{ display:"flex", gap:4, marginBottom:20, overflowX:"auto", padding:"2px 0" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"8px 14px", borderRadius:10, border: tab===t.id ? "1px solid #ffd700" : "1px solid #1a1f2e",
            background: tab===t.id ? "rgba(255,215,0,0.08)" : "#0d1117", cursor:"pointer",
            display:"flex", flexDirection:"column", alignItems:"flex-start", gap:2, minWidth:120,
            transition:"all 0.2s ease"
          }}>
            <span style={{ fontSize:12, fontWeight:700, color: tab===t.id ? "#ffd700" : "#64748b" }}>{t.label}</span>
            <span style={{ fontSize:9, color:"#475569" }}>{t.desc}</span>
          </button>
        ))}
      </div>
      {tab==="calc" && <CalcTab />}
      {tab==="models" && <ModelsTab />}
      {tab==="tco" && <TCOTab />}
      {tab==="optimize" && <OptimizeTab />}
      {tab==="billing" && <BillingTab />}
    </div>
  );
}

/* ── Pricing Calculator Tab ── */
function CalcTab() {
  const [services, setServices] = useState([
    { id:1, type:"vm", name:"Web Server", size:"D2s_v3", count:2, hours:730, commit:"payg" },
    { id:2, type:"storage", name:"App Data", tier:"Hot", gb:500 },
    { id:3, type:"db", name:"SQL Database", tier:"S1", dtu:20 },
  ]);
  const [showAdd, setShowAdd] = useState(false);

  const vmPrices = { "B1s":0.012, "B2s":0.042, "B2ms":0.084, "D2s_v3":0.096, "D4s_v3":0.192, "D8s_v3":0.384, "E2s_v3":0.126, "F2s_v2":0.085 };
  const storagePrices = { "Hot":0.018, "Cool":0.01, "Cold":0.0036, "Archive":0.00099 };
  const dbPrices = { "Basic":4.99, "S0":15, "S1":30, "S2":75, "S3":150, "P1":465 };
  const commitDisc = { payg:1, savings:0.78, reserved1:0.6, reserved3:0.4 };

  const calcCost = (s) => {
    if (s.type==="vm") return s.count * (vmPrices[s.size]||0.096) * s.hours * (commitDisc[s.commit]||1);
    if (s.type==="storage") return s.gb * (storagePrices[s.tier]||0.018);
    if (s.type==="db") return dbPrices[s.tier]||30;
    return 0;
  };
  const total = services.reduce((a,s) => a+calcCost(s), 0);
  const payGTotal = services.reduce((a,s) => {
    if (s.type==="vm") return a + s.count*(vmPrices[s.size]||0.096)*s.hours;
    return a + calcCost(s);
  }, 0);
  const saved = payGTotal - total;

  const updateService = (id, updates) => setServices(services.map(s => s.id===id ? {...s,...updates} : s));
  const removeService = (id) => setServices(services.filter(s => s.id!==id));
  const addService = (type) => {
    const id = Date.now();
    if (type==="vm") setServices([...services, { id, type:"vm", name:"New VM", size:"B2s", count:1, hours:730, commit:"payg" }]);
    else if (type==="storage") setServices([...services, { id, type:"storage", name:"New Storage", tier:"Hot", gb:100 }]);
    else if (type==="db") setServices([...services, { id, type:"db", name:"New Database", tier:"S0", dtu:10 }]);
    setShowAdd(false);
  };

  const typeColors = { vm:"#60a5fa", storage:"#ff8c00", db:"#a78bfa" };
  const typeIcons = { vm:"⬡", storage:"◈", db:"⊟" };

  return (
    <div>
      {/* Service cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
        {services.map(s => (
          <div key={s.id} style={{ background:"#0d1117", borderRadius:14, padding:16, border:`1px solid ${typeColors[s.type]}30`, position:"relative" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:18 }}>{typeIcons[s.type]}</span>
                <div>
                  <input value={s.name} onChange={e=>updateService(s.id,{name:e.target.value})} style={{ background:"transparent", border:"none", color:"#e2e8f0", fontWeight:700, fontSize:13, outline:"none", width:160 }} />
                  <div style={{ fontSize:9, color:typeColors[s.type], textTransform:"uppercase", fontWeight:700, letterSpacing:1 }}>{s.type==="vm"?"Virtual Machine":s.type==="storage"?"Blob Storage":"SQL Database"}</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:MM, fontSize:20, fontWeight:700, color:typeColors[s.type] }}>${calcCost(s).toFixed(2)}</div>
                  <div style={{ fontSize:9, color:"#475569" }}>/month</div>
                </div>
                <button onClick={()=>removeService(s.id)} style={{ background:"#ef444420", color:"#ef4444", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", fontSize:12 }}>✕</button>
              </div>
            </div>
            {/* Controls per type */}
            {s.type==="vm" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <div style={{ fontSize:10, color:"#64748b", marginBottom:6 }}>VM Size</div>
                  <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                    {Object.entries(vmPrices).map(([sz,p])=>(
                      <button key={sz} onClick={()=>updateService(s.id,{size:sz})} style={{
                        padding:"3px 7px", borderRadius:5, fontSize:8, fontFamily:MM, cursor:"pointer",
                        background:s.size===sz?"#0078d4":"#141720", color:s.size===sz?"#fff":"#64748b",
                        border:s.size===sz?"1px solid #0078d4":"1px solid #1a1f2e"
                      }}>{sz}<br/>${p}/hr</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:10, color:"#64748b" }}>Count</span>
                    <span style={{ fontFamily:MM, fontSize:11, color:"#e2e8f0" }}>{s.count}</span>
                  </div>
                  <input type="range" min={1} max={20} value={s.count} onChange={e=>updateService(s.id,{count:+e.target.value})} style={{ width:"100%", accentColor:"#60a5fa" }} />
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, marginTop:8 }}>
                    <span style={{ fontSize:10, color:"#64748b" }}>Hours/mo</span>
                    <span style={{ fontFamily:MM, fontSize:11, color:"#e2e8f0" }}>{s.hours}h</span>
                  </div>
                  <input type="range" min={100} max={730} step={10} value={s.hours} onChange={e=>updateService(s.id,{hours:+e.target.value})} style={{ width:"100%", accentColor:"#60a5fa" }} />
                  <div style={{ fontSize:10, color:"#64748b", marginTop:8, marginBottom:4 }}>Commitment</div>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {[{id:"payg",l:"PAYG"},{id:"savings",l:"Savings -22%"},{id:"reserved1",l:"RI 1yr -40%"},{id:"reserved3",l:"RI 3yr -60%"}].map(c=>(
                      <button key={c.id} onClick={()=>updateService(s.id,{commit:c.id})} style={{
                        padding:"3px 8px", borderRadius:5, fontSize:9, cursor:"pointer",
                        background:s.commit===c.id?"#10b98118":"#141720", color:s.commit===c.id?"#10b981":"#64748b",
                        border:s.commit===c.id?"1px solid #10b98140":"1px solid #1a1f2e"
                      }}>{c.l}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {s.type==="storage" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <div style={{ fontSize:10, color:"#64748b", marginBottom:6 }}>Access Tier</div>
                  <div style={{ display:"flex", gap:4 }}>
                    {Object.entries(storagePrices).map(([t,p])=>(
                      <button key={t} onClick={()=>updateService(s.id,{tier:t})} style={{
                        padding:"4px 10px", borderRadius:6, fontSize:9, fontFamily:MM, cursor:"pointer",
                        background:s.tier===t?"#ff8c0020":"#141720", color:s.tier===t?"#ff8c00":"#64748b",
                        border:s.tier===t?"1px solid #ff8c0040":"1px solid #1a1f2e",
                        display:"flex", flexDirection:"column", alignItems:"center", gap:2
                      }}>{t}<span style={{fontSize:8}}>${p}/GB</span></button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:10, color:"#64748b" }}>Size (GB)</span>
                    <span style={{ fontFamily:MM, fontSize:11, color:"#e2e8f0" }}>{s.gb} GB</span>
                  </div>
                  <input type="range" min={1} max={10000} step={50} value={s.gb} onChange={e=>updateService(s.id,{gb:+e.target.value})} style={{ width:"100%", accentColor:"#ff8c00" }} />
                </div>
              </div>
            )}
            {s.type==="db" && (
              <div>
                <div style={{ fontSize:10, color:"#64748b", marginBottom:6 }}>Service Tier</div>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {Object.entries(dbPrices).map(([t,p])=>(
                    <button key={t} onClick={()=>updateService(s.id,{tier:t})} style={{
                      padding:"5px 12px", borderRadius:6, fontSize:10, fontFamily:MM, cursor:"pointer",
                      background:s.tier===t?"#a78bfa18":"#141720", color:s.tier===t?"#a78bfa":"#64748b",
                      border:s.tier===t?"1px solid #a78bfa40":"1px solid #1a1f2e",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:2
                    }}>{t}<span style={{fontSize:8}}>${p}/mo</span></button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add service */}
      {showAdd ? (
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {[{t:"vm",l:"⬡ Add VM",c:"#60a5fa"},{t:"storage",l:"◈ Add Storage",c:"#ff8c00"},{t:"db",l:"⊟ Add Database",c:"#a78bfa"}].map(a=>(
            <button key={a.t} onClick={()=>addService(a.t)} style={{
              flex:1, padding:"10px", borderRadius:10, background:`${a.c}10`, border:`1px dashed ${a.c}40`,
              color:a.c, fontSize:12, fontWeight:700, cursor:"pointer"
            }}>{a.l}</button>
          ))}
          <button onClick={()=>setShowAdd(false)} style={{ padding:"10px 16px", borderRadius:10, background:"#1a1f2e", border:"1px solid #334155", color:"#64748b", fontSize:12, cursor:"pointer" }}>Cancel</button>
        </div>
      ) : (
        <button onClick={()=>setShowAdd(true)} style={{
          width:"100%", padding:"10px", borderRadius:10, background:"transparent", border:"1px dashed #334155",
          color:"#64748b", fontSize:12, cursor:"pointer", marginBottom:16
        }}>+ Add Service</button>
      )}

      {/* Cost Summary */}
      <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #ffd70030" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#ffd700", marginBottom:12 }}>📊 Cost Breakdown</div>
        {/* Visual bar */}
        {total > 0 && <div style={{ display:"flex", height:14, borderRadius:7, overflow:"hidden", marginBottom:14, gap:1 }}>
          {services.map((s,i) => {
            const c = calcCost(s);
            if (c <= 0) return null;
            return <div key={s.id} style={{
              flex:c, background:typeColors[s.type], borderRadius: i===0?"7px 0 0 7px":i===services.length-1?"0 7px 7px 0":"0",
              minWidth:3, transition:"flex 0.4s ease", position:"relative", display:"flex", alignItems:"center", justifyContent:"center"
            }}>
              {(c/total*100)>12 && <span style={{ fontSize:8, fontWeight:700, color:"#000" }}>{(c/total*100).toFixed(0)}%</span>}
            </div>;
          })}
        </div>}
        {/* Line items */}
        {services.map(s=>(
          <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:"1px solid #1a1f2e" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:typeColors[s.type] }} />
              <span style={{ fontSize:11, color:"#94a3b8" }}>{s.name}</span>
              <span style={{ fontSize:9, color:"#475569" }}>({s.type==="vm"?`${s.count}× ${s.size}`:s.type==="storage"?`${s.gb}GB ${s.tier}`:s.tier})</span>
            </div>
            <span style={{ fontFamily:MM, fontSize:13, color:typeColors[s.type] }}>${calcCost(s).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ borderTop:"2px solid #ffd70030", marginTop:10, paddingTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontWeight:700, fontSize:15, color:"#e2e8f0" }}>Monthly Total</span>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:MM, fontSize:32, fontWeight:700, color:"#ffd700" }}>${total.toFixed(2)}</div>
            <div style={{ fontFamily:MM, fontSize:11, color:"#475569" }}>${(total*12).toFixed(2)}/year</div>
            {saved>0 && <div style={{ fontFamily:MM, fontSize:11, color:"#10b981" }}>💡 Saving ${saved.toFixed(2)}/mo with commitments</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Pricing Models Tab ── */
function ModelsTab() {
  const [activeModel, setActiveModel] = useState("payg");
  const [simHours, setSimHours] = useState(400);
  const hourlyRate = 0.096; // D2s_v3
  const models = [
    { id:"payg", label:"Pay-As-You-Go", color:"#ef4444", icon:"💳", desc:"Pay only for what you use. No upfront. Cancel anytime.", best:"Unpredictable or short-term workloads", calc: simHours * hourlyRate },
    { id:"reserved", label:"Reserved Instance (1yr)", color:"#10b981", icon:"📋", desc:"Commit to 1 or 3 years for up to 72% savings. Locked to region + size.", best:"Steady-state production workloads", calc: 730 * hourlyRate * 0.6 },
    { id:"savings", label:"Savings Plan", color:"#3b82f6", icon:"💎", desc:"Commit to $/hr spend (flexible across regions/sizes). Up to 65% off.", best:"Flexible workloads across regions", calc: 730 * hourlyRate * 0.78 },
    { id:"spot", label:"Spot VMs", color:"#f59e0b", icon:"⚡", desc:"Use unused Azure capacity at up to 90% discount. Can be evicted with 30s notice.", best:"Batch jobs, CI/CD, fault-tolerant workloads", calc: simHours * hourlyRate * 0.1 },
  ];

  const active = models.find(m=>m.id===activeModel);
  const paygCost = simHours * hourlyRate;

  return (
    <div>
      {/* Model selector cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
        {models.map(m => (
          <div key={m.id} onClick={()=>setActiveModel(m.id)} style={{
            background: activeModel===m.id ? `${m.color}10` : "#0d1117",
            border: activeModel===m.id ? `2px solid ${m.color}` : "1px solid #1a1f2e",
            borderRadius:14, padding:16, cursor:"pointer", transition:"all 0.2s ease"
          }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{m.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color: activeModel===m.id ? m.color : "#94a3b8", marginBottom:4 }}>{m.label}</div>
            <div style={{ fontSize:10, color:"#475569", lineHeight:1.5 }}>{m.desc}</div>
            <div style={{ marginTop:10, padding:"6px 10px", background:`${m.color}15`, borderRadius:8, display:"inline-block" }}>
              <span style={{ fontFamily:MM, fontSize:14, fontWeight:700, color:m.color }}>${m.calc.toFixed(2)}</span>
              <span style={{ fontSize:9, color:"#64748b" }}>/mo</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive comparison */}
      <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #1a1f2e", marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#ffd700", marginBottom:12 }}>📐 Visual Cost Comparison (D2s_v3 @ ${hourlyRate}/hr)</div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:10, color:"#64748b" }}>Usage Hours/Month</span>
          <span style={{ fontFamily:MM, fontSize:11, color:"#e2e8f0" }}>{simHours}h / 730h</span>
        </div>
        <input type="range" min={50} max={730} step={10} value={simHours} onChange={e=>setSimHours(+e.target.value)} style={{ width:"100%", accentColor:"#ffd700", marginBottom:16 }} />

        {/* Bar chart comparison */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {models.map(m => {
            const cost = m.id==="payg" ? simHours*hourlyRate : m.id==="reserved" ? 730*hourlyRate*0.6 : m.id==="savings" ? 730*hourlyRate*0.78 : simHours*hourlyRate*0.1;
            const maxCost = 730 * hourlyRate;
            const pct = (cost / maxCost) * 100;
            const saving = ((paygCost - cost) / paygCost * 100);
            return (
              <div key={m.id}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontSize:10, color: activeModel===m.id ? m.color : "#64748b", fontWeight: activeModel===m.id ? 700:400 }}>{m.icon} {m.label}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontFamily:MM, fontSize:12, color:m.color, fontWeight:700 }}>${cost.toFixed(2)}</span>
                    {m.id!=="payg" && saving>0 && <span style={{ fontSize:9, color:"#10b981", fontFamily:MM }}>-{saving.toFixed(0)}%</span>}
                  </div>
                </div>
                <div style={{ height:10, background:"#141720", borderRadius:5, overflow:"hidden" }}>
                  <div style={{
                    width:`${Math.max(pct,2)}%`, height:"100%", background: activeModel===m.id ? m.color : `${m.color}60`,
                    borderRadius:5, transition:"width 0.5s ease"
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Best for callout */}
      {active && (
        <div style={{ background:`${active.color}08`, borderRadius:14, padding:16, border:`1px solid ${active.color}30` }}>
          <div style={{ fontSize:11, fontWeight:700, color:active.color, marginBottom:6 }}>✦ Best For</div>
          <div style={{ fontSize:12, color:"#94a3b8" }}>{active.best}</div>
          {active.id==="spot" && (
            <div style={{ marginTop:10, padding:"8px 12px", background:"#f59e0b10", borderRadius:8, border:"1px solid #f59e0b30" }}>
              <div style={{ fontSize:10, color:"#f59e0b", fontWeight:700 }}>⚠️ Eviction Warning</div>
              <div style={{ fontSize:10, color:"#64748b", marginTop:4 }}>Spot VMs can be reclaimed with 30 seconds notice when Azure needs capacity. Not for production!</div>
            </div>
          )}
          {active.id==="reserved" && (
            <div style={{ marginTop:10, padding:"8px 12px", background:"#10b98110", borderRadius:8, border:"1px solid #10b98130" }}>
              <div style={{ fontSize:10, color:"#10b981", fontWeight:700 }}>🔒 Commitment Lock</div>
              <div style={{ fontSize:10, color:"#64748b", marginTop:4 }}>You pay whether you use it or not. Can exchange for different size/region but cannot cancel.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── TCO Comparison Tab ── */
function TCOTab() {
  const [servers, setServers] = useState(10);
  const [years, setYears] = useState(3);
  const [showDetail, setShowDetail] = useState(false);

  const onPrem = {
    hardware: servers * 8000,
    licensing: servers * 2500 * years,
    power: servers * 150 * 12 * years,
    cooling: servers * 80 * 12 * years,
    admin: servers * 500 * 12 * years,
    space: servers * 200 * 12 * years,
    network: 1500 * 12 * years,
  };
  const onPremTotal = Object.values(onPrem).reduce((a,b)=>a+b, 0);

  const azure = {
    compute: servers * 70 * 12 * years,
    storage: servers * 15 * 12 * years,
    networking: 200 * 12 * years,
    admin: servers * 100 * 12 * years,
  };
  const azureTotal = Object.values(azure).reduce((a,b)=>a+b, 0);
  const savings = onPremTotal - azureTotal;
  const pctSaved = (savings / onPremTotal * 100);

  const onPremCategories = [
    { key:"hardware", label:"Hardware", color:"#ef4444", icon:"🖥️" },
    { key:"licensing", label:"Licensing", color:"#f59e0b", icon:"📄" },
    { key:"power", label:"Electricity", color:"#eab308", icon:"⚡" },
    { key:"cooling", label:"Cooling", color:"#06b6d4", icon:"❄️" },
    { key:"admin", label:"IT Staff", color:"#a78bfa", icon:"👤" },
    { key:"space", label:"Datacenter Space", color:"#64748b", icon:"🏢" },
    { key:"network", label:"Network", color:"#3b82f6", icon:"🌐" },
  ];
  const azureCategories = [
    { key:"compute", label:"Compute", color:"#60a5fa", icon:"⬡" },
    { key:"storage", label:"Storage", color:"#ff8c00", icon:"◈" },
    { key:"networking", label:"Networking", color:"#10b981", icon:"🌐" },
    { key:"admin", label:"Mgmt Staff", color:"#a78bfa", icon:"👤" },
  ];

  return (
    <div>
      {/* Controls */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
        <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #1a1f2e" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:11, color:"#64748b" }}>🖥️ Number of Servers</span>
            <span style={{ fontFamily:MM, fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{servers}</span>
          </div>
          <input type="range" min={1} max={100} value={servers} onChange={e=>setServers(+e.target.value)} style={{ width:"100%", accentColor:"#ffd700" }} />
        </div>
        <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #1a1f2e" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:11, color:"#64748b" }}>📅 Time Period</span>
            <span style={{ fontFamily:MM, fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{years} year{years>1?"s":""}</span>
          </div>
          <input type="range" min={1} max={5} value={years} onChange={e=>setYears(+e.target.value)} style={{ width:"100%", accentColor:"#ffd700" }} />
        </div>
      </div>

      {/* Visual comparison */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 60px 1fr", gap:10, marginBottom:16 }}>
        {/* On-prem */}
        <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #ef444440" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#ef4444", marginBottom:4 }}>🏢 On-Premises</div>
          <div style={{ fontFamily:MM, fontSize:28, fontWeight:700, color:"#ef4444", marginBottom:12 }}>${(onPremTotal/1000).toFixed(0)}K</div>
          {/* Stacked bar */}
          <div style={{ display:"flex", flexDirection:"column", gap:2, marginBottom:10 }}>
            {onPremCategories.map(c => {
              const val = onPrem[c.key];
              const pct = val/onPremTotal*100;
              return (
                <div key={c.key} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:60, fontSize:8, color:"#64748b", textAlign:"right" }}>{c.icon} {c.label}</div>
                  <div style={{ flex:1, height:8, background:"#141720", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:c.color, borderRadius:4, transition:"width 0.4s" }} />
                  </div>
                  <div style={{ fontFamily:MM, fontSize:8, color:c.color, width:45, textAlign:"right" }}>${(val/1000).toFixed(1)}K</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* VS */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#475569" }}>VS</div>
          <svg width="40" height="40" viewBox="0 0 40 40"><path d="M10 20 L30 20 M25 15 L30 20 L25 25" stroke="#ffd700" strokeWidth="2" fill="none"/></svg>
          {savings > 0 && <div style={{ fontFamily:MM, fontSize:11, color:"#10b981", fontWeight:700 }}>Save<br/>{pctSaved.toFixed(0)}%</div>}
        </div>
        {/* Azure */}
        <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #10b98140" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#10b981", marginBottom:4 }}>☁️ Azure Cloud</div>
          <div style={{ fontFamily:MM, fontSize:28, fontWeight:700, color:"#10b981", marginBottom:12 }}>${(azureTotal/1000).toFixed(0)}K</div>
          <div style={{ display:"flex", flexDirection:"column", gap:2, marginBottom:10 }}>
            {azureCategories.map(c => {
              const val = azure[c.key];
              const pct = val/azureTotal*100;
              return (
                <div key={c.key} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:60, fontSize:8, color:"#64748b", textAlign:"right" }}>{c.icon} {c.label}</div>
                  <div style={{ flex:1, height:8, background:"#141720", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:c.color, borderRadius:4, transition:"width 0.4s" }} />
                  </div>
                  <div style={{ fontFamily:MM, fontSize:8, color:c.color, width:45, textAlign:"right" }}>${(val/1000).toFixed(1)}K</div>
                </div>
              );
            })}
          </div>
          <div style={{ padding:"8px", background:"#10b98108", borderRadius:8, border:"1px solid #10b98120", marginTop:8 }}>
            <div style={{ fontSize:9, color:"#64748b" }}>Hidden costs eliminated:</div>
            <div style={{ fontSize:9, color:"#10b981", marginTop:2 }}>✓ No hardware refresh ✓ No cooling ✓ No space rental ✓ Built-in redundancy</div>
          </div>
        </div>
      </div>

      {/* Savings callout */}
      {savings > 0 && (
        <div style={{ background:"linear-gradient(135deg, #10b98108, #ffd70008)", borderRadius:14, padding:16, border:"1px solid #10b98130", textAlign:"center" }}>
          <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Total Savings over {years} year{years>1?"s":""}</div>
          <div style={{ fontFamily:MM, fontSize:36, fontWeight:700, color:"#10b981" }}>${(savings/1000).toFixed(0)}K</div>
          <div style={{ fontSize:10, color:"#64748b" }}>That's ${(savings/years/12).toFixed(0)}/month you keep</div>
        </div>
      )}
    </div>
  );
}

/* ── Cost Optimization Tab ── */
function OptimizeTab() {
  const [applied, setApplied] = useState([]);
  const tips = [
    { id:"rightsize", title:"Right-size VMs", icon:"📏", save:150, desc:"CPU avg 5% on dev VMs → downsize D4s to B2s", difficulty:"Easy", impact:85 },
    { id:"reserved", title:"Reserved Instances", icon:"📋", save:280, desc:"3 production VMs running 24/7 → commit for 40% off", difficulty:"Easy", impact:95 },
    { id:"autoscale", title:"Auto-scale Rules", icon:"📈", save:120, desc:"Add scale-in rules for evening/weekend low traffic", difficulty:"Medium", impact:70 },
    { id:"spot", title:"Spot VMs for Batch", icon:"⚡", save:200, desc:"Move nightly data processing to Spot VMs", difficulty:"Medium", impact:80 },
    { id:"lifecycle", title:"Storage Lifecycle", icon:"📦", save:90, desc:"Move 80% of blobs untouched 30d+ to Cool tier", difficulty:"Easy", impact:60 },
    { id:"deallocate", title:"Deallocate Dev/Test", icon:"🌙", save:180, desc:"Auto-shutdown dev VMs 7PM–7AM + weekends", difficulty:"Easy", impact:90 },
    { id:"advisor", title:"Follow Advisor", icon:"💡", save:95, desc:"Apply all Azure Advisor cost recommendations", difficulty:"Easy", impact:75 },
    { id:"hybrid", title:"Hybrid Benefit", icon:"🔑", save:160, desc:"Bring existing Windows/SQL licenses to Azure", difficulty:"Easy", impact:88 },
  ];

  const totalSaveable = tips.reduce((a,t)=>a+t.save, 0);
  const totalSaved = tips.filter(t=>applied.includes(t.id)).reduce((a,t)=>a+t.save, 0);
  const toggle = (id) => setApplied(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);

  return (
    <div>
      {/* Savings meter */}
      <div style={{ background:"#0d1117", borderRadius:14, padding:20, border:"1px solid #1a1f2e", marginBottom:16, textAlign:"center" }}>
        <div style={{ fontSize:11, color:"#64748b", marginBottom:8 }}>💰 Monthly Savings Unlocked</div>
        <div style={{ fontFamily:MM, fontSize:42, fontWeight:700, color: totalSaved > 0 ? "#10b981" : "#334155" }}>${totalSaved}</div>
        <div style={{ fontSize:10, color:"#475569", marginBottom:12 }}>of ${totalSaveable} possible</div>
        {/* Progress bar */}
        <div style={{ height:10, background:"#141720", borderRadius:5, overflow:"hidden", maxWidth:400, margin:"0 auto" }}>
          <div style={{
            width:`${(totalSaved/totalSaveable)*100}%`, height:"100%",
            background:"linear-gradient(90deg, #10b981, #ffd700)", borderRadius:5,
            transition:"width 0.5s ease"
          }} />
        </div>
        <div style={{ fontFamily:MM, fontSize:11, color:"#ffd700", marginTop:6 }}>{(totalSaved/totalSaveable*100).toFixed(0)}% optimized</div>
      </div>

      {/* Tip cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {tips.map(t => {
          const isApplied = applied.includes(t.id);
          return (
            <div key={t.id} onClick={()=>toggle(t.id)} style={{
              background: isApplied ? "#10b98108" : "#0d1117",
              borderRadius:12, padding:14, cursor:"pointer",
              border: isApplied ? "1px solid #10b98140" : "1px solid #1a1f2e",
              transition:"all 0.2s ease", opacity: isApplied ? 0.8 : 1
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:18 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color: isApplied ? "#10b981" : "#e2e8f0", textDecoration: isApplied ? "line-through" : "none" }}>{t.title}</div>
                    <div style={{ fontSize:9, color: t.difficulty==="Easy" ? "#10b981" : "#f59e0b" }}>{t.difficulty}</div>
                  </div>
                </div>
                <div style={{ fontFamily:MM, fontSize:16, fontWeight:700, color: isApplied ? "#10b981" : "#ffd700" }}>
                  {isApplied ? "✓" : `-$${t.save}`}
                </div>
              </div>
              <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5, marginBottom:8 }}>{t.desc}</div>
              {/* Impact bar */}
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:8, color:"#475569" }}>Impact</span>
                <div style={{ flex:1, height:4, background:"#141720", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ width:`${t.impact}%`, height:"100%", background: isApplied ? "#10b981" : "#ffd700", borderRadius:2 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Billing & Scopes Tab ── */
function BillingTab() {
  const [activeScope, setActiveScope] = useState("ea");
  const scopes = [
    { id:"ea", label:"Enterprise Agreement", icon:"🏛️", color:"#60a5fa",
      desc:"Large orgs with $100K+/yr spend. Upfront commitment for best discounts.",
      flow:["Enterprise","Department","Account","Subscription","Resource Group","Resource"],
      features:["Monetary commitment discounts","Centralized billing","Custom pricing","Azure Prepayment credits"] },
    { id:"csp", label:"Cloud Solution Provider", icon:"🤝", color:"#a78bfa",
      desc:"Buy through a Microsoft partner who manages billing and support.",
      flow:["CSP Partner","Customer Tenant","Subscription","Resource Group","Resource"],
      features:["Partner manages billing","Combined with partner services","Partner-set pricing","Partner support included"] },
    { id:"payg", label:"Pay-As-You-Go", icon:"💳", color:"#f59e0b",
      desc:"Credit card billing. Best for individuals, small projects, and learning.",
      flow:["Billing Account","Billing Profile","Invoice Section","Subscription","Resource Group","Resource"],
      features:["No commitment","Credit card billing","Per-minute pricing","Free tier eligible"] },
  ];

  const active = scopes.find(s=>s.id===activeScope);

  const concepts = [
    { term:"Subscription", def:"Billing + access boundary. Resources billed to one subscription.", icon:"📋", color:"#60a5fa" },
    { term:"Resource Group", def:"Logical container. Resources share same lifecycle. Can't nest.", icon:"📁", color:"#10b981" },
    { term:"Cost Management", def:"Built-in tool: budgets, alerts, forecasts, and advisor recommendations.", icon:"📊", color:"#ffd700" },
    { term:"Tags", def:"Key-value metadata for cost allocation. E.g., CostCenter=Marketing", icon:"🏷️", color:"#a78bfa" },
    { term:"Budget Alert", def:"Set spending thresholds. Get email/webhook at 50%, 80%, 100%.", icon:"🔔", color:"#ef4444" },
    { term:"Azure Advisor", def:"Free personalized recommendations for cost, security, performance.", icon:"💡", color:"#06b6d4" },
  ];

  return (
    <div>
      {/* Scope selector */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {scopes.map(s => (
          <button key={s.id} onClick={()=>setActiveScope(s.id)} style={{
            flex:1, padding:"12px", borderRadius:12, cursor:"pointer",
            background: activeScope===s.id ? `${s.color}10` : "#0d1117",
            border: activeScope===s.id ? `2px solid ${s.color}` : "1px solid #1a1f2e",
            textAlign:"center", transition:"all 0.2s ease"
          }}>
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div style={{ fontSize:11, fontWeight:700, color: activeScope===s.id ? s.color : "#64748b", marginTop:4 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Active scope detail */}
      {active && (
        <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:`1px solid ${active.color}30`, marginBottom:16 }}>
          <div style={{ fontSize:12, color:"#94a3b8", marginBottom:14 }}>{active.desc}</div>
          {/* Billing hierarchy flow */}
          <div style={{ fontSize:10, fontWeight:700, color:active.color, marginBottom:8 }}>Billing Hierarchy</div>
          <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap", marginBottom:14 }}>
            {active.flow.map((step,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{
                  padding:"6px 12px", borderRadius:8,
                  background: i===0 ? `${active.color}20` : "#141720",
                  border: `1px solid ${i===0 ? active.color : "#1a1f2e"}`,
                  fontSize:10, fontWeight: i===0?700:400, color: i===0 ? active.color : "#94a3b8"
                }}>{step}</div>
                {i < active.flow.length-1 && <span style={{ color:"#334155", fontSize:12 }}>→</span>}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {active.features.map((f,i) => (
              <div key={i} style={{ padding:"4px 10px", borderRadius:6, background:`${active.color}10`, border:`1px solid ${active.color}20`, fontSize:9, color:active.color }}>✓ {f}</div>
            ))}
          </div>
        </div>
      )}

      {/* Key concepts */}
      <div style={{ fontSize:12, fontWeight:700, color:"#ffd700", marginBottom:10 }}>📖 Key Billing Concepts</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {concepts.map(c => (
          <div key={c.term} style={{ background:"#0d1117", borderRadius:10, padding:12, border:"1px solid #1a1f2e" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <span style={{ fontSize:16 }}>{c.icon}</span>
              <span style={{ fontSize:12, fontWeight:700, color:c.color }}>{c.term}</span>
            </div>
            <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>{c.def}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonitorModule() {
  const [tab, setTab] = useState("dash");
  const tabs = [
    { id:"dash", label:"📊 Live Dashboard", desc:"Metrics & charts" },
    { id:"alerts", label:"🔔 Alert Rules", desc:"Configure triggers" },
    { id:"logs", label:"📝 Log Analytics", desc:"KQL query lab" },
    { id:"health", label:"💚 Service Health", desc:"Status & incidents" },
    { id:"advisor", label:"💡 Advisor", desc:"Recommendations" },
  ];

  return (
    <div style={{ maxWidth:820, margin:"0 auto" }}>
      <SectionLabel color="#0078d4">Azure Monitor & Alerts Lab</SectionLabel>
      <div style={{ display:"flex", gap:4, marginBottom:20, overflowX:"auto", padding:"2px 0" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"8px 14px", borderRadius:10, border: tab===t.id ? "1px solid #0078d4" : "1px solid #1a1f2e",
            background: tab===t.id ? "rgba(0,120,212,0.08)" : "#0d1117", cursor:"pointer",
            display:"flex", flexDirection:"column", alignItems:"flex-start", gap:2, minWidth:120,
            transition:"all 0.2s ease"
          }}>
            <span style={{ fontSize:12, fontWeight:700, color: tab===t.id ? "#0078d4" : "#64748b" }}>{t.label}</span>
            <span style={{ fontSize:9, color:"#475569" }}>{t.desc}</span>
          </button>
        ))}
      </div>
      {tab==="dash" && <MonitorDashTab />}
      {tab==="alerts" && <MonitorAlertsTab />}
      {tab==="logs" && <MonitorLogsTab />}
      {tab==="health" && <MonitorHealthTab />}
      {tab==="advisor" && <MonitorAdvisorTab />}
    </div>
  );
}

/* ── Live Dashboard Tab ── */
function MonitorDashTab() {
  const [metric, setMetric] = useState("cpu");
  const [resource, setResource] = useState("vm-prod-web");
  const [timeRange, setTimeRange] = useState("24h");
  const [tick, setTick] = useState(0);

  useEffect(() => { const iv = setInterval(()=>setTick(t=>t+1), 2000); return ()=>clearInterval(iv); }, []);

  const resources = [
    { id:"vm-prod-web", name:"vm-prod-web", type:"VM", icon:"⬡", status:"running", cpu:72, mem:68, disk:45, net:12 },
    { id:"vm-dev-01", name:"vm-dev-01", type:"VM", icon:"⬡", status:"running", cpu:5, mem:32, disk:20, net:1 },
    { id:"app-frontend", name:"app-frontend", type:"App Service", icon:"◎", status:"running", cpu:38, mem:55, disk:15, net:45 },
    { id:"sql-prod", name:"sql-prod", type:"SQL DB", icon:"⊟", status:"warning", cpu:82, mem:90, disk:78, net:8 },
    { id:"storage-main", name:"storage-main", type:"Storage", icon:"◈", status:"running", cpu:0, mem:0, disk:62, net:25 },
  ];

  const res = resources.find(r=>r.id===resource) || resources[0];

  // Generate time-series data with some randomness based on tick
  const genData = (base, variance) => Array.from({length:24}, (_,i) => {
    const hour = i;
    const dayPattern = Math.sin((hour-6)*Math.PI/12)*0.3;
    const noise = Math.sin(tick*0.5+i*1.3)*variance*0.3;
    return Math.max(0, Math.min(100, base + dayPattern*base + noise));
  });

  const cpuData = genData(res.cpu, 15);
  const memData = genData(res.mem, 8);
  const diskData = genData(res.disk, 3);
  const netData = genData(res.net, 20);

  const metricMap = { cpu:{ data:cpuData, label:"CPU %", color:"#3b82f6", current:res.cpu },
    mem:{ data:memData, label:"Memory %", color:"#a78bfa", current:res.mem },
    disk:{ data:diskData, label:"Disk %", color:"#ff8c00", current:res.disk },
    net:{ data:netData, label:"Network MB/s", color:"#10b981", current:res.net } };
  const m = metricMap[metric];

  // SVG line chart
  const chartW = 600, chartH = 120;
  const points = m.data.map((v,i) => `${(i/(m.data.length-1))*chartW},${chartH - (v/100)*chartH}`).join(" ");
  const areaPoints = `0,${chartH} ${points} ${chartW},${chartH}`;

  return (
    <div>
      {/* Resource selector */}
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto" }}>
        {resources.map(r => (
          <button key={r.id} onClick={()=>setResource(r.id)} style={{
            padding:"8px 12px", borderRadius:10, cursor:"pointer", minWidth:110,
            background: resource===r.id ? "#0078d410" : "#0d1117",
            border: resource===r.id ? "1px solid #0078d4" : "1px solid #1a1f2e",
            display:"flex", alignItems:"center", gap:6, transition:"all 0.2s"
          }}>
            <div style={{ width:8, height:8, borderRadius:"50%",
              background: r.status==="running" ? "#10b981" : r.status==="warning" ? "#f59e0b" : "#ef4444",
              boxShadow: r.status==="warning" ? "0 0 6px #f59e0b" : "none"
            }} />
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:10, fontWeight:700, color: resource===r.id ? "#e2e8f0" : "#94a3b8" }}>{r.icon} {r.name}</div>
              <div style={{ fontSize:8, color:"#475569" }}>{r.type}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:14 }}>
        {[
          { key:"cpu", label:"CPU", value:`${res.cpu}%`, color:"#3b82f6", icon:"⚙️" },
          { key:"mem", label:"Memory", value:`${res.mem}%`, color:"#a78bfa", icon:"🧠" },
          { key:"disk", label:"Disk", value:`${res.disk}%`, color:"#ff8c00", icon:"💾" },
          { key:"net", label:"Network", value:`${res.net} MB/s`, color:"#10b981", icon:"🌐" },
        ].map(s => (
          <div key={s.key} onClick={()=>setMetric(s.key)} style={{
            background: metric===s.key ? `${s.color}10` : "#0d1117",
            border: metric===s.key ? `2px solid ${s.color}` : "1px solid #1a1f2e",
            borderRadius:12, padding:12, cursor:"pointer", textAlign:"center", transition:"all 0.2s"
          }}>
            <div style={{ fontSize:16, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontFamily:MM, fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:9, color:"#64748b", marginTop:2 }}>{s.label}</div>
            {/* Mini gauge */}
            <div style={{ height:4, background:"#141720", borderRadius:2, overflow:"hidden", marginTop:6 }}>
              <div style={{ width:`${parseInt(s.value)||0}%`, maxWidth:"100%", height:"100%", background: parseInt(s.value)>80 ? "#ef4444" : parseInt(s.value)>60 ? "#f59e0b" : s.color, borderRadius:2, transition:"width 0.5s" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Time range selector */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:12, fontWeight:700, color:m.color }}>{m.label} — {res.name}</span>
        <div style={{ display:"flex", gap:3 }}>
          {["1h","6h","24h","7d"].map(t => (
            <button key={t} onClick={()=>setTimeRange(t)} style={{
              padding:"3px 10px", borderRadius:5, fontSize:9, fontFamily:MM, cursor:"pointer",
              background: timeRange===t ? "#0078d420" : "transparent",
              color: timeRange===t ? "#0078d4" : "#475569",
              border: timeRange===t ? "1px solid #0078d4" : "1px solid #1a1f2e"
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* SVG Line Chart */}
      <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #1a1f2e", marginBottom:14 }}>
        <svg width="100%" viewBox={`0 0 ${chartW} ${chartH+20}`} preserveAspectRatio="none" style={{ overflow:"visible" }}>
          {/* Grid lines */}
          {[0,25,50,75,100].map(v => (
            <g key={v}>
              <line x1={0} y1={chartH-(v/100)*chartH} x2={chartW} y2={chartH-(v/100)*chartH} stroke="#1a1f2e" strokeWidth={v===0?1:0.5} strokeDasharray={v>0?"4,4":""} />
              <text x={chartW+4} y={chartH-(v/100)*chartH+3} fill="#334155" fontSize="8" fontFamily="Fira Code">{v}%</text>
            </g>
          ))}
          {/* 70% alert threshold */}
          <line x1={0} y1={chartH-0.7*chartH} x2={chartW} y2={chartH-0.7*chartH} stroke="#ef4444" strokeWidth={1} strokeDasharray="6,3" opacity={0.6} />
          <text x={4} y={chartH-0.7*chartH-4} fill="#ef4444" fontSize="8" fontFamily="Fira Code" opacity={0.8}>⚠ Alert threshold</text>
          {/* Area fill */}
          <polygon points={areaPoints} fill={`${m.color}15`} />
          {/* Line */}
          <polyline points={points} fill="none" stroke={m.color} strokeWidth={2} strokeLinejoin="round" />
          {/* Data points */}
          {m.data.map((v,i) => {
            const x = (i/(m.data.length-1))*chartW;
            const y = chartH-(v/100)*chartH;
            const isAlert = v > 70;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={isAlert?4:2.5} fill={isAlert?"#ef4444":m.color} stroke="#0d1117" strokeWidth={1}>
                  {isAlert && <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite"/>}
                </circle>
                {(i%4===0||isAlert) && <text x={x} y={chartH+14} fill="#475569" fontSize="7" fontFamily="Fira Code" textAnchor="middle">{String(i).padStart(2,"0")}:00</text>}
              </g>
            );
          })}
        </svg>

        {/* Alert banner if threshold exceeded */}
        {m.data.some(v=>v>70) && (
          <div style={{ marginTop:10, padding:"8px 12px", background:"#ef444410", borderRadius:8, border:"1px solid #ef444430", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>🔔</span>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:"#ef4444" }}>Alert: {m.label} exceeded 70% threshold</div>
              <div style={{ fontSize:9, color:"#64748b" }}>Triggered {m.data.filter(v=>v>70).length} times in the last {timeRange}</div>
            </div>
          </div>
        )}
      </div>

      {/* Live pulse indicator */}
      <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end" }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:"#10b981", animation:"pulse 2s infinite" }} />
        <span style={{ fontSize:9, color:"#475569", fontFamily:MM }}>Live — refreshing every 2s</span>
      </div>
    </div>
  );
}

/* ── Alert Rules Tab ── */
function MonitorAlertsTab() {
  const [alerts, setAlerts] = useState([
    { id:1, name:"High CPU Alert", metric:"CPU %", resource:"vm-prod-web", condition:">", threshold:70, window:"5min", severity:1, enabled:true, fired:true, lastFired:"2 min ago" },
    { id:2, name:"Memory Warning", metric:"Memory %", resource:"sql-prod", condition:">", threshold:85, window:"10min", severity:2, enabled:true, fired:true, lastFired:"18 min ago" },
    { id:3, name:"Disk Space Critical", metric:"Disk %", resource:"storage-main", condition:">", threshold:90, window:"15min", severity:0, enabled:true, fired:false, lastFired:"3 days ago" },
    { id:4, name:"Low Network Throughput", metric:"Network MB/s", resource:"app-frontend", condition:"<", threshold:5, window:"10min", severity:3, enabled:false, fired:false, lastFired:"Never" },
  ]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const severityMap = [
    { label:"Critical", color:"#ef4444", icon:"🔴" },
    { label:"Error", color:"#f97316", icon:"🟠" },
    { label:"Warning", color:"#f59e0b", icon:"🟡" },
    { label:"Info", color:"#3b82f6", icon:"🔵" },
  ];

  const toggleAlert = (id) => setAlerts(alerts.map(a => a.id===id ? {...a, enabled:!a.enabled} : a));

  // Simulated alert flow diagram
  const flowSteps = [
    { label:"Metric\nData", icon:"📊", color:"#3b82f6" },
    { label:"Evaluation\nRule", icon:"⚙️", color:"#a78bfa" },
    { label:"Condition\nMet?", icon:"❓", color:"#f59e0b" },
    { label:"Action\nGroup", icon:"📣", color:"#ef4444" },
    { label:"Notify\nTeam", icon:"📧", color:"#10b981" },
  ];

  return (
    <div>
      {/* Alert flow diagram */}
      <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #1a1f2e", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#0078d4", marginBottom:12 }}>🔄 How Azure Alerts Work</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
          {flowSteps.map((s,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{
                width:80, height:70, borderRadius:12, background:`${s.color}10`, border:`1px solid ${s.color}40`,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4
              }}>
                <span style={{ fontSize:20 }}>{s.icon}</span>
                <span style={{ fontSize:8, color:s.color, textAlign:"center", fontWeight:700, lineHeight:1.3, whiteSpace:"pre-line" }}>{s.label}</span>
              </div>
              {i < flowSteps.length-1 && (
                <svg width="30" height="20" viewBox="0 0 30 20">
                  <defs><marker id={`ah${i}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill={s.color} /></marker></defs>
                  <line x1="0" y1="10" x2="24" y2="10" stroke={s.color} strokeWidth="1.5" markerEnd={`url(#ah${i})`} strokeDasharray={i===2?"4,2":""}>
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite" />
                  </line>
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alert rules list */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {alerts.map(a => {
          const sev = severityMap[a.severity];
          return (
            <div key={a.id} style={{
              background: a.fired && a.enabled ? `${sev.color}06` : "#0d1117",
              borderRadius:12, padding:14, border: a.fired && a.enabled ? `1px solid ${sev.color}40` : "1px solid #1a1f2e",
              opacity: a.enabled ? 1 : 0.5, transition:"all 0.2s"
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {a.fired && a.enabled && <span style={{ fontSize:14 }}>🔔</span>}
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#e2e8f0" }}>{a.name}</div>
                    <div style={{ fontSize:9, color:"#475569" }}>{a.resource}</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:9, fontFamily:MM, color:sev.color, background:`${sev.color}15`, padding:"2px 8px", borderRadius:4 }}>{sev.icon} {sev.label}</span>
                  {/* Toggle */}
                  <div onClick={()=>toggleAlert(a.id)} style={{
                    width:36, height:20, borderRadius:10, cursor:"pointer",
                    background: a.enabled ? "#0078d4" : "#1a1f2e", padding:2,
                    transition:"background 0.2s", display:"flex", alignItems: "center"
                  }}>
                    <div style={{
                      width:16, height:16, borderRadius:"50%", background:"#fff",
                      transform: a.enabled ? "translateX(16px)" : "translateX(0)",
                      transition:"transform 0.2s"
                    }} />
                  </div>
                </div>
              </div>
              {/* Rule visualization */}
              <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                <span style={{ fontSize:9, padding:"3px 8px", background:"#3b82f610", border:"1px solid #3b82f630", borderRadius:4, color:"#60a5fa", fontFamily:MM }}>WHEN {a.metric}</span>
                <span style={{ fontSize:12, color:"#ffd700" }}>{a.condition}</span>
                <span style={{ fontSize:9, padding:"3px 8px", background:"#ef444410", border:"1px solid #ef444430", borderRadius:4, color:"#ef4444", fontFamily:MM, fontWeight:700 }}>{a.threshold}{a.metric.includes("%")?"%":""}</span>
                <span style={{ fontSize:9, color:"#475569" }}>for</span>
                <span style={{ fontSize:9, padding:"3px 8px", background:"#a78bfa10", border:"1px solid #a78bfa30", borderRadius:4, color:"#a78bfa", fontFamily:MM }}>{a.window}</span>
                {a.fired && a.enabled && (
                  <span style={{ fontSize:9, color:"#ef4444", fontFamily:MM, marginLeft:"auto" }}>🔥 Fired {a.lastFired}</span>
                )}
                {!a.fired && a.enabled && (
                  <span style={{ fontSize:9, color:"#10b981", fontFamily:MM, marginLeft:"auto" }}>✓ OK — last fired {a.lastFired}</span>
                )}
              </div>
              {/* Visual threshold gauge */}
              <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ flex:1, height:6, background:"#141720", borderRadius:3, position:"relative", overflow:"visible" }}>
                  {/* Current value indicator */}
                  <div style={{
                    position:"absolute", left:`${Math.min(a.threshold+(a.fired?10:-20), 100)}%`, top:-3,
                    width:12, height:12, borderRadius:"50%", background: a.fired ? sev.color : "#10b981",
                    border:"2px solid #0d1117", transition:"left 0.5s",
                  }} />
                  {/* Threshold line */}
                  <div style={{
                    position:"absolute", left:`${a.threshold}%`, top:-6, width:2, height:18,
                    background:sev.color, borderRadius:1
                  }} />
                  <div style={{
                    width:`${Math.min(a.threshold+(a.fired?10:-20), 100)}%`,
                    height:"100%", borderRadius:3, transition:"width 0.5s",
                    background: a.fired ? `linear-gradient(90deg, ${sev.color}40, ${sev.color})` : `linear-gradient(90deg, #10b98140, #10b981)`
                  }} />
                </div>
                <span style={{ fontSize:8, fontFamily:MM, color:"#475569", minWidth:50 }}>Threshold: {a.threshold}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action groups callout */}
      <div style={{ marginTop:14, background:"#0d1117", borderRadius:12, padding:14, border:"1px solid #1a1f2e" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#10b981", marginBottom:8 }}>📣 Action Groups — What Happens When Alert Fires</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[
            { icon:"📧", label:"Email", desc:"Send to team" },
            { icon:"📱", label:"SMS", desc:"Text on-call" },
            { icon:"🔗", label:"Webhook", desc:"POST to URL" },
            { icon:"🎫", label:"ITSM", desc:"Create ticket" },
            { icon:"⚡", label:"Logic App", desc:"Run workflow" },
            { icon:"🤖", label:"Azure Function", desc:"Run code" },
          ].map(a => (
            <div key={a.label} style={{
              padding:"8px 12px", borderRadius:8, background:"#14172050", border:"1px solid #1a1f2e",
              display:"flex", alignItems:"center", gap:6, flex:"1", minWidth:100
            }}>
              <span style={{ fontSize:16 }}>{a.icon}</span>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:"#e2e8f0" }}>{a.label}</div>
                <div style={{ fontSize:8, color:"#475569" }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Log Analytics Tab ── */
function MonitorLogsTab() {
  const [query, setQuery] = useState("Heartbeat | where TimeGenerated > ago(1h) | summarize count() by Computer");
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);

  const sampleQueries = [
    { name:"Heartbeat Count", q:"Heartbeat | where TimeGenerated > ago(1h) | summarize count() by Computer", icon:"💓" },
    { name:"Error Events", q:"Event | where EventLevelName == 'Error' | top 10 by TimeGenerated", icon:"❌" },
    { name:"CPU Perf", q:"Perf | where CounterName == '% Processor Time' | summarize avg(CounterValue) by Computer, bin(TimeGenerated, 5m)", icon:"⚙️" },
    { name:"Security Signin", q:"SigninLogs | where ResultType != 0 | project TimeGenerated, UserPrincipalName, ResultType, Location", icon:"🔐" },
    { name:"Network Flows", q:"AzureNetworkAnalytics_CL | summarize TotalBytes=sum(BytesSent_d) by DestIP_s | top 5 by TotalBytes", icon:"🌐" },
  ];

  const sampleResults = {
    "Heartbeat": [
      { Computer:"vm-prod-web", Count:58, Status:"Healthy" },
      { Computer:"vm-dev-01", Count:56, Status:"Healthy" },
      { Computer:"sql-prod", Count:42, Status:"Degraded" },
      { Computer:"app-frontend", Count:60, Status:"Healthy" },
    ],
    "Error": [
      { TimeGenerated:"10:32:15", Source:"Application", EventID:1001, Message:"Unhandled exception in web handler" },
      { TimeGenerated:"10:28:44", Source:"System", EventID:7034, Message:"Service terminated unexpectedly" },
      { TimeGenerated:"09:55:12", Source:"Application", EventID:1001, Message:"Database connection timeout" },
    ],
    "CPU": [
      { Computer:"vm-prod-web", AvgCPU:"72.4%", Trend:"↑" },
      { Computer:"sql-prod", AvgCPU:"82.1%", Trend:"↑↑" },
      { Computer:"vm-dev-01", AvgCPU:"5.2%", Trend:"→" },
      { Computer:"app-frontend", AvgCPU:"38.7%", Trend:"↓" },
    ],
  };

  const runQuery = () => {
    setRunning(true);
    setTimeout(() => {
      if (query.includes("Heartbeat")) setResults({ type:"Heartbeat", data:sampleResults["Heartbeat"] });
      else if (query.includes("Error")) setResults({ type:"Error", data:sampleResults["Error"] });
      else setResults({ type:"CPU", data:sampleResults["CPU"] });
      setRunning(false);
    }, 800);
  };

  // KQL syntax highlighting (basic)
  const highlightKQL = (q) => {
    const keywords = ["where","summarize","count","by","top","project","bin","ago","sum","avg"];
    const parts = q.split(/(\s+|\|)/);
    return parts.map((p,i) => {
      if (p==="|") return <span key={i} style={{ color:"#ffd700", fontWeight:700 }}> | </span>;
      if (keywords.includes(p.toLowerCase())) return <span key={i} style={{ color:"#c586c0" }}>{p}</span>;
      if (p.match(/^["'].*["']$/)) return <span key={i} style={{ color:"#ce9178" }}>{p}</span>;
      if (p.match(/^\d+[hmd]?$/)) return <span key={i} style={{ color:"#b5cea8" }}>{p}</span>;
      if (p.match(/^[A-Z][a-zA-Z_]+$/)) return <span key={i} style={{ color:"#4ec9b0" }}>{p}</span>;
      return <span key={i}>{p}</span>;
    });
  };

  return (
    <div>
      {/* Sample query chips */}
      <div style={{ display:"flex", gap:4, marginBottom:12, flexWrap:"wrap" }}>
        {sampleQueries.map(sq => (
          <button key={sq.name} onClick={()=>{setQuery(sq.q);setResults(null)}} style={{
            padding:"5px 10px", borderRadius:8, background: query===sq.q ? "#0078d410" : "#0d1117",
            border: query===sq.q ? "1px solid #0078d4" : "1px solid #1a1f2e",
            color: query===sq.q ? "#0078d4" : "#64748b", fontSize:10, cursor:"pointer",
            display:"flex", alignItems:"center", gap:4
          }}><span>{sq.icon}</span>{sq.name}</button>
        ))}
      </div>

      {/* Query editor */}
      <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #1a1f2e", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:10, fontWeight:700, color:"#0078d4" }}>📝 KQL Query Editor</span>
            <span style={{ fontSize:8, color:"#475569", fontFamily:MM }}>Kusto Query Language</span>
          </div>
          <button onClick={runQuery} disabled={running} style={{
            padding:"6px 16px", borderRadius:8, background: running ? "#1a1f2e" : "#0078d4",
            color:"#fff", border:"none", fontSize:10, fontWeight:700, cursor: running ? "wait" : "pointer",
            display:"flex", alignItems:"center", gap:4
          }}>{running ? "⏳ Running..." : "▶ Run Query"}</button>
        </div>
        {/* Editor area */}
        <div style={{ background:"#0a0e14", borderRadius:8, padding:12, fontFamily:MM, fontSize:11, color:"#d4d4d4", minHeight:60, border:"1px solid #1a1f2e", position:"relative" }}>
          <div style={{ position:"absolute", left:4, top:12, color:"#334155", fontSize:9, userSelect:"none" }}>1</div>
          <textarea value={query} onChange={e=>setQuery(e.target.value)} spellCheck={false} style={{
            width:"100%", minHeight:50, background:"transparent", border:"none", outline:"none",
            color:"#d4d4d4", fontFamily:MM, fontSize:11, resize:"vertical", paddingLeft:16
          }} />
        </div>
        <div style={{ marginTop:6, display:"flex", gap:8, fontSize:8, color:"#475569" }}>
          <span>💡 <strong style={{color:"#c586c0"}}>Purple</strong> = keyword</span>
          <span><strong style={{color:"#4ec9b0"}}>Teal</strong> = table</span>
          <span><strong style={{color:"#ffd700"}}>Gold</strong> = pipe</span>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div style={{ background:"#0d1117", borderRadius:14, padding:16, border:"1px solid #10b98130" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#10b981" }}>✓ Results — {results.data.length} rows</span>
            <span style={{ fontSize:9, color:"#475569", fontFamily:MM }}>0.24s elapsed</span>
          </div>
          {/* Results table */}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10, fontFamily:MM }}>
              <thead>
                <tr>
                  {Object.keys(results.data[0]).map(k => (
                    <th key={k} style={{ textAlign:"left", padding:"6px 10px", borderBottom:"1px solid #1a1f2e", color:"#64748b", fontWeight:700, fontSize:9 }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.data.map((row,i) => (
                  <tr key={i} style={{ borderBottom:"1px solid #0a0e14" }}>
                    {Object.entries(row).map(([k,v],j) => (
                      <td key={j} style={{ padding:"5px 10px", color: String(v).includes("↑↑") ? "#ef4444" : String(v).includes("↑") ? "#f59e0b" : String(v).includes("Degraded") ? "#f59e0b" : "#e2e8f0" }}>{String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log workspace concept */}
      <div style={{ marginTop:14, padding:"12px 16px", background:"#0078d408", borderRadius:12, border:"1px solid #0078d420" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#0078d4", marginBottom:6 }}>📖 Log Analytics Workspace</div>
        <div style={{ fontSize:10, color:"#64748b", lineHeight:1.6 }}>
          A central store for ALL your log data. Resources send logs via <strong style={{color:"#60a5fa"}}>Diagnostic Settings</strong>. 
          Query with <strong style={{color:"#c586c0"}}>KQL</strong> (Kusto Query Language). 
          Data retention: 30 days free, up to 730 days paid. Powers <strong style={{color:"#10b981"}}>Alerts</strong>, <strong style={{color:"#f59e0b"}}>Workbooks</strong>, and <strong style={{color:"#a78bfa"}}>Sentinel SIEM</strong>.
        </div>
      </div>
    </div>
  );
}

/* ── Service Health Tab ── */
function MonitorHealthTab() {
  const [view, setView] = useState("status");

  const services = [
    { name:"Virtual Machines", region:"East US", status:"healthy", uptime:"99.99%", icon:"⬡" },
    { name:"App Service", region:"East US", status:"degraded", uptime:"99.87%", icon:"◎", issue:"Increased latency for deployments" },
    { name:"SQL Database", region:"East US", status:"healthy", uptime:"99.99%", icon:"⊟" },
    { name:"Storage Accounts", region:"East US", status:"healthy", uptime:"99.99%", icon:"◈" },
    { name:"Key Vault", region:"East US", status:"healthy", uptime:"99.99%", icon:"🔑" },
    { name:"Azure AD", region:"Global", status:"healthy", uptime:"99.99%", icon:"◉" },
    { name:"Azure Monitor", region:"East US", status:"healthy", uptime:"99.99%", icon:"📊" },
    { name:"Load Balancer", region:"East US", status:"maintenance", uptime:"99.95%", icon:"⚖️", issue:"Planned maintenance window: 2AM-4AM" },
  ];

  const incidents = [
    { id:1, title:"App Service Deployment Delays", status:"Active", severity:"Warning", start:"Today 09:15", services:["App Service"], desc:"Some customers may experience delays when deploying to App Service in East US.", color:"#f59e0b" },
    { id:2, title:"Load Balancer Maintenance", status:"Planned", severity:"Info", start:"Tomorrow 02:00", services:["Load Balancer"], desc:"Scheduled maintenance. Failover to secondary will occur automatically.", color:"#3b82f6" },
    { id:3, title:"Storage Throttling Resolved", status:"Resolved", severity:"Warning", start:"Yesterday 14:30", services:["Storage Accounts"], desc:"Intermittent throttling on blob operations. Root cause: capacity spike.", color:"#10b981" },
  ];

  const statusColor = (s) => s==="healthy"?"#10b981":s==="degraded"?"#f59e0b":"#3b82f6";

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[{id:"status",l:"📊 Service Status"},{id:"incidents",l:"⚡ Incidents"},{id:"types",l:"📖 Health Types"}].map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)} style={{
            padding:"6px 14px", borderRadius:8, fontSize:10, fontWeight:700, cursor:"pointer",
            background: view===v.id ? "#0078d410" : "#0d1117",
            border: view===v.id ? "1px solid #0078d4" : "1px solid #1a1f2e",
            color: view===v.id ? "#0078d4" : "#64748b"
          }}>{v.l}</button>
        ))}
      </div>

      {view==="status" && (
        <div>
          {/* Overall health banner */}
          <div style={{ background:"#10b98108", borderRadius:14, padding:16, border:"1px solid #10b98130", marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:48, height:48, borderRadius:"50%", background:"#10b98120", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:24 }}>✓</span>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#10b981" }}>All Core Services Operational</div>
              <div style={{ fontSize:10, color:"#64748b" }}>1 service degraded · 1 planned maintenance · East US Region</div>
            </div>
          </div>
          {/* Service grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {services.map(s => (
              <div key={s.name} style={{
                background:"#0d1117", borderRadius:10, padding:12, border:"1px solid #1a1f2e",
                borderLeft:`3px solid ${statusColor(s.status)}`
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:14 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:"#e2e8f0" }}>{s.name}</div>
                      <div style={{ fontSize:8, color:"#475569" }}>{s.region}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:statusColor(s.status),
                        boxShadow: s.status!=="healthy" ? `0 0 6px ${statusColor(s.status)}` : "none"
                      }} />
                      <span style={{ fontSize:9, fontWeight:700, color:statusColor(s.status), textTransform:"capitalize" }}>{s.status}</span>
                    </div>
                    <span style={{ fontSize:8, fontFamily:MM, color:"#475569" }}>{s.uptime} SLA</span>
                  </div>
                </div>
                {s.issue && <div style={{ marginTop:6, fontSize:9, color:statusColor(s.status), padding:"4px 8px", background:`${statusColor(s.status)}10`, borderRadius:4 }}>⚡ {s.issue}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {view==="incidents" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {incidents.map(inc => (
            <div key={inc.id} style={{
              background:"#0d1117", borderRadius:12, padding:16, border:`1px solid ${inc.color}30`,
              borderLeft:`4px solid ${inc.color}`
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{inc.title}</div>
                <span style={{ fontSize:9, fontFamily:MM, padding:"2px 8px", borderRadius:4,
                  background:`${inc.color}15`, color:inc.color
                }}>{inc.status}</span>
              </div>
              <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.5, marginBottom:8 }}>{inc.desc}</div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:8, color:"#475569", fontFamily:MM }}>📅 {inc.start}</span>
                {inc.services.map(s => (
                  <span key={s} style={{ fontSize:8, padding:"2px 6px", background:"#141720", border:"1px solid #1a1f2e", borderRadius:3, color:"#94a3b8", fontFamily:MM }}>{s}</span>
                ))}
              </div>
              {/* Timeline dots */}
              <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:10 }}>
                {["Detected","Investigating", inc.status==="Resolved"?"Resolved":"Mitigating"].map((step,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{ width:10, height:10, borderRadius:"50%",
                      background: (inc.status==="Resolved" || i===0) ? inc.color : i<=1 ? `${inc.color}60` : "#1a1f2e",
                      border: `1px solid ${inc.color}`
                    }} />
                    <span style={{ fontSize:8, color: i===0 ? inc.color : "#475569" }}>{step}</span>
                    {i<2 && <div style={{ width:20, height:1, background: i===0 ? inc.color : "#1a1f2e" }} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view==="types" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { title:"Service Issues", icon:"🔴", color:"#ef4444", desc:"Active problems affecting Azure services in your regions. Real-time impact on your resources." },
            { title:"Planned Maintenance", icon:"🔧", color:"#3b82f6", desc:"Scheduled updates that may affect your services. Advance notice with recommended actions." },
            { title:"Health Advisories", icon:"📋", color:"#f59e0b", desc:"Service changes requiring action: retirements, deprecations, or quota limits." },
            { title:"Security Advisories", icon:"🔒", color:"#a78bfa", desc:"Security-related notifications for vulnerabilities affecting Azure services." },
          ].map(t => (
            <div key={t.title} style={{ background:"#0d1117", borderRadius:12, padding:16, border:"1px solid #1a1f2e", borderTop:`3px solid ${t.color}` }}>
              <span style={{ fontSize:22 }}>{t.icon}</span>
              <div style={{ fontSize:12, fontWeight:700, color:t.color, marginTop:6, marginBottom:4 }}>{t.title}</div>
              <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Advisor Tab ── */
function MonitorAdvisorTab() {
  const [filter, setFilter] = useState("all");
  const [dismissed, setDismissed] = useState([]);

  const recs = [
    { id:1, cat:"Cost", color:"#10b981", icon:"💰", title:"Right-size vm-dev-01", desc:"CPU avg 5% over 14 days. Downsize D4s_v3 → B2s. Save $150/mo.", impact:"$150/mo", confidence:95 },
    { id:2, cat:"Cost", color:"#10b981", icon:"💰", title:"Delete unused public IPs", desc:"3 public IPs not associated with any resource for 30+ days.", impact:"$10/mo", confidence:100 },
    { id:3, cat:"Security", color:"#ef4444", icon:"🔒", title:"Enable MFA for admins", desc:"3 admin accounts lack multi-factor authentication. High risk.", impact:"Critical", confidence:100 },
    { id:4, cat:"Security", color:"#ef4444", icon:"🔒", title:"Rotate storage keys", desc:"storage-main access keys haven't been rotated in 180 days.", impact:"High Risk", confidence:90 },
    { id:5, cat:"Reliability", color:"#3b82f6", icon:"◎", title:"Use availability zones", desc:"vm-prod-web is in a single zone. Deploy 2+ zones for 99.99% SLA.", impact:"99.99% SLA", confidence:85 },
    { id:6, cat:"Reliability", color:"#3b82f6", icon:"◎", title:"Enable backup for SQL", desc:"sql-prod has no backup policy configured. Data loss risk.", impact:"Data Safety", confidence:100 },
    { id:7, cat:"Performance", color:"#f59e0b", icon:"⚡", title:"Enable accelerated networking", desc:"sql-prod-01 throughput 40% below capability. Free to enable.", impact:"+40% throughput", confidence:80 },
    { id:8, cat:"Operational", color:"#a78bfa", icon:"🔧", title:"Update TLS to 1.2+", desc:"2 App Services using deprecated TLS 1.0. Security + compliance.", impact:"Compliance", confidence:100 },
  ];

  const categories = ["all","Cost","Security","Reliability","Performance","Operational"];
  const filtered = filter==="all" ? recs : recs.filter(r=>r.cat===filter);
  const visible = filtered.filter(r=>!dismissed.includes(r.id));
  const catCounts = {};
  recs.forEach(r => { catCounts[r.cat] = (catCounts[r.cat]||0)+1; });

  // Score
  const totalScore = Math.round(((recs.length - recs.filter(r=>!dismissed.includes(r.id)).length) / recs.length) * 100);

  return (
    <div>
      {/* Score gauge */}
      <div style={{ background:"#0d1117", borderRadius:14, padding:20, border:"1px solid #1a1f2e", marginBottom:16, textAlign:"center" }}>
        <div style={{ fontSize:11, color:"#64748b", marginBottom:8 }}>Advisor Score</div>
        <div style={{ position:"relative", width:120, height:60, margin:"0 auto", overflow:"hidden" }}>
          <svg width="120" height="60" viewBox="0 0 120 60">
            <path d="M10,55 A50,50 0 0,1 110,55" fill="none" stroke="#1a1f2e" strokeWidth="8" strokeLinecap="round" />
            <path d="M10,55 A50,50 0 0,1 110,55" fill="none" stroke={totalScore>70?"#10b981":totalScore>40?"#f59e0b":"#ef4444"} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${totalScore*1.57} 157`} style={{ transition:"stroke-dasharray 0.8s ease" }} />
          </svg>
          <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", fontFamily:MM, fontSize:24, fontWeight:700,
            color: totalScore>70?"#10b981":totalScore>40?"#f59e0b":"#ef4444"
          }}>{totalScore}%</div>
        </div>
        <div style={{ fontSize:10, color:"#475569", marginTop:4 }}>{dismissed.length} of {recs.length} recommendations applied</div>
      </div>

      {/* Category filters */}
      <div style={{ display:"flex", gap:4, marginBottom:14, flexWrap:"wrap" }}>
        {categories.map(c => {
          const catColor = c==="Cost"?"#10b981":c==="Security"?"#ef4444":c==="Reliability"?"#3b82f6":c==="Performance"?"#f59e0b":c==="Operational"?"#a78bfa":"#0078d4";
          return (
            <button key={c} onClick={()=>setFilter(c)} style={{
              padding:"5px 12px", borderRadius:8, fontSize:10, cursor:"pointer",
              background: filter===c ? `${catColor}15` : "#0d1117",
              border: filter===c ? `1px solid ${catColor}` : "1px solid #1a1f2e",
              color: filter===c ? catColor : "#64748b",
              display:"flex", alignItems:"center", gap:4
            }}>
              {c==="all"?"All":c}
              {c!=="all" && <span style={{ fontFamily:MM, fontSize:8, background:`${catColor}20`, padding:"1px 4px", borderRadius:3 }}>{catCounts[c]||0}</span>}
            </button>
          );
        })}
      </div>

      {/* Recommendation cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {visible.map(r => (
          <div key={r.id} style={{
            background:"#0d1117", borderRadius:12, padding:14,
            borderLeft:`4px solid ${r.color}`, border:"1px solid #1a1f2e",
            display:"flex", alignItems:"center", gap:12
          }}>
            <span style={{ fontSize:22 }}>{r.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#e2e8f0" }}>{r.title}</span>
                <span style={{ fontFamily:MM, fontSize:8, color:r.color, background:`${r.color}15`, padding:"1px 6px", borderRadius:3 }}>{r.cat}</span>
              </div>
              <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.5, marginBottom:6 }}>{r.desc}</div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:9, color:r.color, fontWeight:700 }}>Impact: {r.impact}</span>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ fontSize:8, color:"#475569" }}>Confidence</span>
                  <div style={{ width:40, height:4, background:"#141720", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ width:`${r.confidence}%`, height:"100%", background:r.color, borderRadius:2 }} />
                  </div>
                  <span style={{ fontSize:8, fontFamily:MM, color:"#475569" }}>{r.confidence}%</span>
                </div>
              </div>
            </div>
            <button onClick={()=>setDismissed([...dismissed, r.id])} style={{
              padding:"6px 12px", borderRadius:8, background:"#10b98110", border:"1px solid #10b98130",
              color:"#10b981", fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap"
            }}>✓ Apply</button>
          </div>
        ))}
        {visible.length===0 && (
          <div style={{ textAlign:"center", padding:40, color:"#475569" }}>
            <span style={{ fontSize:32 }}>🎉</span>
            <div style={{ fontSize:14, fontWeight:700, color:"#10b981", marginTop:8 }}>All recommendations applied!</div>
            <div style={{ fontSize:11, marginTop:4 }}>Your environment is well-optimized for {filter==="all"?"all categories":filter}.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function MigrateModule() {
  const [tab,setTab]=useState("journey");
  const tabs=[{id:"journey",label:"Migration Journey",icon:"🗺️"},{id:"tools",label:"Tool Deep-Dive",icon:"🔧"},{id:"assess",label:"Assessment Lab",icon:"📊"},{id:"databox",label:"Data Transfer Sim",icon:"📦"},{id:"arc",label:"Azure Arc Demo",icon:"🌐"}];
  return (
    <div style={{maxWidth:820,margin:"0 auto"}}>
      <SectionLabel color="#9333ea">Migration Tools — Interactive Lab</SectionLabel>
      <div style={{display:"flex",gap:4,marginBottom:18,flexWrap:"wrap"}}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 14px",background:tab===t.id?"#9333ea18":"#0a0d14",border:tab===t.id?"2px solid #9333ea":"2px solid #141720",borderRadius:10,fontFamily:F,fontSize:11,fontWeight:700,color:tab===t.id?"#9333ea":"#64748b",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><span>{t.icon}</span>{t.label}</button>)}
      </div>
      <div className="fade-in" key={tab}>
        <div>{tab==="journey"&&<MigrateJourneyTab/>}</div>
        <div>{tab==="tools"&&<MigrateToolsTab/>}</div>
        <div>{tab==="assess"&&<MigrateAssessTab/>}</div>
        <div>{tab==="databox"&&<MigrateDataBoxTab/>}</div>
        <div>{tab==="arc"&&<MigrateArcTab/>}</div>
      </div>
    </div>
  );
}

/* ── Tab 1: Migration Journey ── */
function MigrateJourneyTab() {
  const [activePhase,setActivePhase]=useState(0);
  const [completed,setCompleted]=useState<number[]>([]);
  const phases=[
    {name:"Discover",icon:"🔍",color:"#3b82f6",desc:"Identify all on-premises workloads — servers, databases, apps, dependencies.",tasks:["Install Azure Migrate appliance on-prem","Scan network for VMs and databases","Map application dependencies","Inventory all workloads"],tools:["Azure Migrate Discovery","Service Map","Dependency Agent"]},
    {name:"Assess",icon:"📊",color:"#f59e0b",desc:"Evaluate readiness, right-size resources, estimate Azure costs.",tasks:["Run readiness assessments per VM","Get cost estimates for Azure equivalents","Identify compatibility issues","Review recommended SKU sizes"],tools:["Azure Migrate Assessment","TCO Calculator","Azure Pricing Calculator"]},
    {name:"Plan",icon:"📝",color:"#8b5cf6",desc:"Design target architecture, migration waves, and rollback strategies.",tasks:["Group workloads into migration waves","Design target VNet and landing zone","Plan downtime windows","Create rollback procedures"],tools:["Cloud Adoption Framework","Azure Landing Zones","Well-Architected Framework"]},
    {name:"Migrate",icon:"🚀",color:"#10b981",desc:"Execute migration — replicate, test, cutover. Agentless or agent-based.",tasks:["Set up replication for Wave 1","Run test migrations","Validate in Azure","Perform production cutover"],tools:["Azure Migrate: Server Migration","Database Migration Service","App Service Migration Assistant"]},
    {name:"Optimize",icon:"⚡",color:"#e74856",desc:"Post-migration — right-size, enable monitoring, apply governance.",tasks:["Review Azure Advisor recommendations","Enable Azure Monitor and alerts","Apply RBAC and policies","Implement Reserved Instances"],tools:["Azure Advisor","Azure Monitor","Cost Management","Azure Policy"]},
  ];
  const p=phases[activePhase];
  const completePhase=(i:number)=>{if(!completed.includes(i))setCompleted([...completed,i]);if(activePhase<4)setActivePhase(activePhase+1);};
  return (
    <div>
      {/* Journey timeline */}
      <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:24,position:"relative"}}>
        {phases.map((ph,i)=>{
          const done=completed.includes(i);const active=i===activePhase;
          return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative",cursor:"pointer"}} onClick={()=>setActivePhase(i)}>
            {i>0&&<div style={{position:"absolute",top:20,right:"50%",width:"100%",height:3,background:completed.includes(i-1)?`${phases[i-1].color}`:"#1e293b",zIndex:0,transition:"background 0.5s"}}/>}
            <div style={{width:40,height:40,borderRadius:"50%",background:done?ph.color:active?`${ph.color}30`:"#0d1117",border:`3px solid ${done||active?ph.color:"#1e293b"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,zIndex:1,transition:"all 0.3s",animation:active?"pulse 2s infinite":"none",boxShadow:active?`0 0 20px ${ph.color}40`:"none"}}>{done?"✓":ph.icon}</div>
            <div style={{fontSize:10,fontWeight:700,color:done||active?ph.color:"#475569",marginTop:6,fontFamily:F}}>{ph.name}</div>
          </div>;
        })}
      </div>
      {/* Active phase detail */}
      <div className="fade-in" key={activePhase} style={{background:"#0d1117",borderRadius:16,padding:20,border:`2px solid ${p.color}25`}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:52,height:52,borderRadius:14,background:`${p.color}15`,border:`2px solid ${p.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{p.icon}</div>
          <div><div style={{fontWeight:800,fontSize:18,color:"#e2e8f0"}}>{p.name} Phase</div><div style={{fontSize:12,color:"#94a3b8"}}>{p.desc}</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:p.color,marginBottom:8}}>✅ Key Tasks</div>
            {p.tasks.map((t,i)=><div key={i} style={{fontSize:12,color:"#94a3b8",padding:"6px 10px",background:"#141720",borderRadius:8,marginBottom:4,borderLeft:`3px solid ${p.color}`,display:"flex",alignItems:"center",gap:6}}><span style={{color:p.color,fontSize:10}}>▸</span>{t}</div>)}
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:p.color,marginBottom:8}}>🛠️ Tools Used</div>
            {p.tools.map((t,i)=><div key={i} style={{fontSize:12,color:"#e2e8f0",padding:"8px 12px",background:`${p.color}08`,borderRadius:8,marginBottom:4,border:`1px solid ${p.color}20`}}>{t}</div>)}
          </div>
        </div>
        <button onClick={()=>completePhase(activePhase)} style={{width:"100%",padding:"10px",background:completed.includes(activePhase)?`${p.color}20`:p.color,color:completed.includes(activePhase)?p.color:"#fff",border:"none",borderRadius:10,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>{completed.includes(activePhase)?"✓ Phase Complete":"Mark Phase Complete →"}</button>
      </div>
      {/* Progress */}
      <div style={{marginTop:14,display:"flex",alignItems:"center",gap:10}}>
        <div style={{flex:1,height:8,background:"#141720",borderRadius:4,overflow:"hidden"}}><div style={{width:`${(completed.length/5)*100}%`,height:"100%",background:"linear-gradient(90deg,#9333ea,#e74856)",borderRadius:4,transition:"width 0.5s"}}/></div>
        <span style={{fontSize:11,fontWeight:700,color:"#9333ea",fontFamily:MM}}>{completed.length}/5</span>
      </div>
    </div>
  );
}

/* ── Tab 2: Tool Deep-Dive ── */
function MigrateToolsTab() {
  const [sel,setSel]=useState("migrate");
  const tools=[
    {id:"migrate",name:"Azure Migrate",icon:"🔄",color:"#9333ea",cat:"Full Migration",features:[
      {name:"Discovery",desc:"Agentless scan of VMware/Hyper-V/physical servers",icon:"🔍"},
      {name:"Assessment",desc:"Readiness scores + Azure VM size recommendations",icon:"📊"},
      {name:"Server Migration",desc:"Agentless replication to Azure VMs",icon:"🖥️"},
      {name:"Database Migration",desc:"DMS for SQL Server → Azure SQL",icon:"🗄️"},
      {name:"Web App Migration",desc:"Assess & migrate .NET/Java apps to App Service",icon:"🌐"},
    ],flow:["Install Appliance","Discover VMs","Assess Readiness","Replicate","Test Migrate","Cutover"]},
    {id:"dms",name:"Database Migration Service",icon:"🗄️",color:"#3b82f6",cat:"Database",features:[
      {name:"Online Migration",desc:"Near-zero downtime with continuous sync",icon:"🔄"},
      {name:"Offline Migration",desc:"Full backup-restore for planned downtime",icon:"⏹️"},
      {name:"SQL Server → Azure SQL",desc:"Managed Instance or SQL Database",icon:"📊"},
      {name:"MySQL/PostgreSQL",desc:"Migrate open-source DBs to Azure equivalents",icon:"🐘"},
      {name:"MongoDB → Cosmos DB",desc:"NoSQL migration with schema mapping",icon:"🍃"},
    ],flow:["Create DMS Instance","Configure Source","Configure Target","Map Schemas","Run Migration","Cutover"]},
    {id:"databox",name:"Azure Data Box",icon:"📦",color:"#f59e0b",cat:"Offline Transfer",features:[
      {name:"Data Box (80 TB)",desc:"Rugged device, NAS interface, AES encrypted",icon:"📦"},
      {name:"Data Box Disk (8 TB)",desc:"SSD disks shipped to you, up to 5 per order",icon:"💿"},
      {name:"Data Box Heavy (1 PB)",desc:"Petabyte-scale device on wheels",icon:"🏗️"},
      {name:"Import/Export",desc:"Ship your own drives to Azure datacenter",icon:"📮"},
      {name:"Encryption",desc:"AES 256-bit, NIST 800-88 wipe after upload",icon:"🔐"},
    ],flow:["Order Device","Receive & Connect","Copy Data","Ship Back","Azure Upload","Verify & Wipe"]},
    {id:"arc",name:"Azure Arc",icon:"🌐",color:"#0078d4",cat:"Hybrid/Multi-Cloud",features:[
      {name:"Arc-enabled Servers",desc:"Manage any server from Azure portal",icon:"🖥️"},
      {name:"Arc-enabled Kubernetes",desc:"Attach any K8s cluster to Azure",icon:"☸️"},
      {name:"Arc-enabled SQL",desc:"Azure SQL management for SQL Server anywhere",icon:"🗄️"},
      {name:"Azure Policy Anywhere",desc:"Enforce governance on non-Azure resources",icon:"📋"},
      {name:"GitOps with Flux",desc:"Automated K8s deployments via Git",icon:"🔄"},
    ],flow:["Install Arc Agent","Register in Azure","Apply Policies","Enable Monitoring","Manage Centrally","Extend Services"]},
    {id:"filesync",name:"Azure File Sync",icon:"🔁",color:"#8b5cf6",cat:"Hybrid Storage",features:[
      {name:"Cloud Tiering",desc:"Hot files local, cold files in Azure. Transparent.",icon:"🌡️"},
      {name:"Multi-Site Sync",desc:"Sync Azure Files to multiple on-prem servers",icon:"🔗"},
      {name:"Rapid DR",desc:"Reinstall File Sync agent, files stream back",icon:"⚡"},
      {name:"Azure Backup Integration",desc:"Cloud snapshots of synced shares",icon:"💾"},
      {name:"Namespace Caching",desc:"Full namespace visible locally, data fetched on access",icon:"📁"},
    ],flow:["Create Storage Sync Service","Install Agent on Server","Register Server","Create Sync Group","Add Server Endpoint","Enable Cloud Tiering"]},
  ];
  const t=tools.find(x=>x.id===sel)!;
  return (
    <div>
      <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>
        {tools.map(x=><button key={x.id} onClick={()=>setSel(x.id)} style={{padding:"8px 14px",background:sel===x.id?`${x.color}15`:"#0a0d14",border:sel===x.id?`2px solid ${x.color}`:"2px solid #141720",borderRadius:10,fontFamily:F,fontSize:11,fontWeight:700,color:sel===x.id?x.color:"#64748b",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>{x.icon}</span>{x.name}</button>)}
      </div>
      <div className="fade-in" key={sel} style={{background:"#0d1117",borderRadius:16,padding:20,border:`1px solid ${t.color}20`}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
          <div style={{width:48,height:48,borderRadius:14,background:`${t.color}15`,border:`2px solid ${t.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{t.icon}</div>
          <div><div style={{fontWeight:800,fontSize:17,color:"#e2e8f0"}}>{t.name}</div><span style={{fontFamily:MM,fontSize:10,color:t.color}}>{t.cat}</span></div>
        </div>
        {/* Features grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"16px 0"}}>
          {t.features.map((f,i)=><div key={i} style={{padding:"10px 12px",background:`${t.color}06`,borderRadius:10,border:`1px solid ${t.color}15`}}>
            <div style={{fontSize:14,marginBottom:2}}>{f.icon} <span style={{fontWeight:700,fontSize:12,color:"#e2e8f0"}}>{f.name}</span></div>
            <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.5}}>{f.desc}</div>
          </div>)}
        </div>
        {/* Animated step flow */}
        <div style={{fontSize:11,fontWeight:700,color:t.color,marginBottom:8}}>Step-by-Step Flow</div>
        <MigrateStepFlow steps={t.flow} color={t.color}/>
      </div>
    </div>
  );
}

function MigrateStepFlow({steps,color}:{steps:string[],color:string}) {
  const [active,setActive]=useState(0);
  useEffect(()=>{const iv=setInterval(()=>setActive(p=>(p+1)%steps.length),2000);return()=>clearInterval(iv);},[steps.length]);
  return (
    <div style={{display:"flex",alignItems:"center",gap:0,flexWrap:"wrap"}}>
      {steps.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center"}}>
        <div style={{padding:"8px 14px",background:i===active?`${color}25`:i<active?`${color}10`:"#141720",border:`2px solid ${i<=active?color:"#1e293b"}`,borderRadius:10,fontSize:11,fontWeight:i===active?700:500,color:i<=active?"#e2e8f0":"#475569",transition:"all 0.4s",boxShadow:i===active?`0 0 15px ${color}30`:"none",fontFamily:F}}>{i+1}. {s}</div>
        {i<steps.length-1&&<div style={{width:20,height:2,background:i<active?color:"#1e293b",transition:"background 0.4s"}}/>}
      </div>)}
    </div>
  );
}

/* ── Tab 3: Assessment Lab ── */
function MigrateAssessTab() {
  const [servers,setServers]=useState([
    {name:"web-server-01",os:"Windows 2019",cpu:4,ram:16,disk:200,db:false,ready:null as null|string,size:"",cost:0},
    {name:"sql-server-01",os:"Windows 2019",cpu:8,ram:32,disk:500,db:true,ready:null as null|string,size:"",cost:0},
    {name:"app-server-01",os:"Ubuntu 20.04",cpu:2,ram:8,disk:100,db:false,ready:null as null|string,size:"",cost:0},
    {name:"legacy-app-01",os:"Windows 2008 R2",cpu:4,ram:8,disk:150,db:false,ready:null as null|string,size:"",cost:0},
    {name:"file-server-01",os:"Windows 2016",cpu:2,ram:4,disk:2000,db:false,ready:null as null|string,size:"",cost:0},
    {name:"mongo-server-01",os:"CentOS 7",cpu:4,ram:16,disk:300,db:true,ready:null as null|string,size:"",cost:0},
  ]);
  const [assessed,setAssessed]=useState(false);
  const [showDetail,setShowDetail]=useState<number|null>(null);

  const runAssessment=()=>{
    setServers(prev=>prev.map(s=>{
      const isLegacy=s.os.includes("2008")||s.os.includes("CentOS");
      const ready=isLegacy?"conditional":"ready";
      const sizes:{[k:string]:string}={"2-8":"B2s","4-16":"D4s_v5","4-8":"B4ms","8-32":"D8s_v5","2-4":"B2ms"};
      const key=`${s.cpu}-${s.ram}`;
      const size=sizes[key]||"D4s_v5";
      const costMap:{[k:string]:number}={"B2s":30,"D4s_v5":140,"B4ms":120,"D8s_v5":280,"B2ms":60};
      return {...s,ready,size,cost:costMap[size]||100};
    }));
    setAssessed(true);
  };

  const totalCost=servers.reduce((a,s)=>a+s.cost,0);
  const readyCount=servers.filter(s=>s.ready==="ready").length;
  const condCount=servers.filter(s=>s.ready==="conditional").length;

  return (
    <div>
      <div style={{background:"#0d1117",borderRadius:16,padding:18,border:"1px solid #1a1f2e",marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",marginBottom:12}}>🏢 On-Premises Server Inventory</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:11}}>
            <thead><tr style={{borderBottom:"2px solid #1e293b"}}>
              {["Server","OS","vCPU","RAM","Disk","DB",assessed?"Readiness":"",assessed?"Azure Size":"",assessed?"Est. Cost":""].filter(Boolean).map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:"#64748b",fontWeight:600}}>{h}</th>)}
            </tr></thead>
            <tbody>{servers.map((s,i)=><tr key={i} style={{borderBottom:"1px solid #141720",cursor:assessed?"pointer":"default",background:showDetail===i?"#141720":"transparent"}} onClick={()=>assessed&&setShowDetail(showDetail===i?null:i)}>
              <td style={{padding:"8px 10px",color:"#e2e8f0",fontWeight:600,fontFamily:MM,fontSize:11}}>{s.name}</td>
              <td style={{padding:"8px 10px",color:"#94a3b8"}}>{s.os}</td>
              <td style={{padding:"8px 10px",color:"#94a3b8"}}>{s.cpu}</td>
              <td style={{padding:"8px 10px",color:"#94a3b8"}}>{s.ram} GB</td>
              <td style={{padding:"8px 10px",color:"#94a3b8"}}>{s.disk} GB</td>
              <td style={{padding:"8px 10px"}}>{s.db?<span style={{color:"#3b82f6"}}>✓ Yes</span>:<span style={{color:"#475569"}}>No</span>}</td>
              {assessed&&<td style={{padding:"8px 10px"}}><span style={{padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:s.ready==="ready"?"#10b98120":"#f59e0b20",color:s.ready==="ready"?"#10b981":"#f59e0b"}}>{s.ready==="ready"?"✓ Ready":"⚠ Conditional"}</span></td>}
              {assessed&&<td style={{padding:"8px 10px",color:"#9333ea",fontFamily:MM,fontWeight:600}}>{s.size}</td>}
              {assessed&&<td style={{padding:"8px 10px",color:"#10b981",fontFamily:MM,fontWeight:600}}>${s.cost}/mo</td>}
            </tr>)}</tbody>
          </table>
        </div>
        {/* Detail panel */}
        {assessed&&showDetail!==null&&(()=>{
          const s=servers[showDetail];const isLegacy=s.os.includes("2008")||s.os.includes("CentOS");
          return <div className="fade-in" style={{marginTop:12,padding:14,background:"#141720",borderRadius:12,border:`1px solid ${isLegacy?"#f59e0b":"#10b981"}20`}}>
            <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0",marginBottom:8}}>Assessment Detail: {s.name}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <div style={{padding:"10px",background:"#0d1117",borderRadius:8}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Recommended Service</div>
                <div style={{fontSize:13,fontWeight:700,color:"#9333ea"}}>{s.db?"Azure SQL MI":"Azure VM"}</div>
              </div>
              <div style={{padding:"10px",background:"#0d1117",borderRadius:8}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Migration Method</div>
                <div style={{fontSize:13,fontWeight:700,color:"#3b82f6"}}>{s.db?"DMS Online":"Agentless"}</div>
              </div>
              <div style={{padding:"10px",background:"#0d1117",borderRadius:8}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Est. Downtime</div>
                <div style={{fontSize:13,fontWeight:700,color:"#10b981"}}>{s.db?"< 10 min":"< 30 min"}</div>
              </div>
            </div>
            {isLegacy&&<div style={{marginTop:10,padding:"8px 12px",background:"#f59e0b10",borderRadius:8,border:"1px solid #f59e0b20",fontSize:11,color:"#f59e0b"}}>⚠ <strong>Issue:</strong> {s.os} is nearing/past end-of-support. Recommend OS upgrade before or during migration, or use Azure Extended Security Updates (ESU).</div>}
          </div>;
        })()}
        {!assessed?<button onClick={runAssessment} style={{marginTop:14,width:"100%",padding:"12px",background:"#9333ea",color:"#fff",border:"none",borderRadius:10,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>🔍 Run Azure Migrate Assessment</button>
        :<div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <div style={{padding:"12px",background:"#10b98110",borderRadius:10,textAlign:"center",border:"1px solid #10b98125"}}><div style={{fontSize:22,fontWeight:800,color:"#10b981"}}>{readyCount}</div><div style={{fontSize:10,color:"#10b981"}}>Ready</div></div>
          <div style={{padding:"12px",background:"#f59e0b10",borderRadius:10,textAlign:"center",border:"1px solid #f59e0b25"}}><div style={{fontSize:22,fontWeight:800,color:"#f59e0b"}}>{condCount}</div><div style={{fontSize:10,color:"#f59e0b"}}>Conditional</div></div>
          <div style={{padding:"12px",background:"#9333ea10",borderRadius:10,textAlign:"center",border:"1px solid #9333ea25"}}><div style={{fontSize:22,fontWeight:800,color:"#9333ea"}}>${totalCost}</div><div style={{fontSize:10,color:"#9333ea"}}>Est. Monthly</div></div>
        </div>}
      </div>
    </div>
  );
}

/* ── Tab 4: Data Transfer Simulation ── */
function MigrateDataBoxTab() {
  const [method,setMethod]=useState<string|null>(null);
  const [dataSize,setDataSize]=useState(500);
  const [transferring,setTransferring]=useState(false);
  const [progress,setProgress]=useState(0);
  const [complete,setComplete]=useState(false);

  const methods=[
    {id:"azcopy",name:"AzCopy",icon:"⚡",color:"#10b981",maxTB:10,speedGbps:10,desc:"CLI tool, parallel upload over internet",best:"Small-Medium (< 10 TB)",time:(gb:number)=>Math.round(gb/1.25)},
    {id:"databox",name:"Data Box",icon:"📦",color:"#f59e0b",maxTB:80000,speedGbps:0,desc:"80TB device shipped to you, physical transfer",best:"Large (10-80 TB)",time:(gb:number)=>Math.round(5+gb/10000)},
    {id:"heavy",name:"Data Box Heavy",icon:"🏗️",color:"#e74856",maxTB:1000000,speedGbps:0,desc:"1PB device, for massive migrations",best:"Massive (100+ TB)",time:(gb:number)=>Math.round(10+gb/50000)},
    {id:"explorer",name:"Storage Explorer",icon:"🗂️",color:"#3b82f6",maxTB:5,speedGbps:1,desc:"GUI drag-and-drop, visual browser",best:"Small (< 5 TB)",time:(gb:number)=>Math.round(gb/0.125)},
  ];

  const recommended=dataSize>80000?"heavy":dataSize>10000?"databox":dataSize>5000?"azcopy":"explorer";

  const startTransfer=()=>{
    if(!method)return;
    setTransferring(true);setProgress(0);setComplete(false);
    const m=methods.find(x=>x.id===method)!;
    const totalTime=Math.min(m.time(dataSize),100);
    const steps=20;
    let step=0;
    const iv=setInterval(()=>{
      step++;setProgress(Math.min(Math.round((step/steps)*100),100));
      if(step>=steps){clearInterval(iv);setComplete(true);setTransferring(false);}
    },150);
  };

  return (
    <div>
      <div style={{background:"#0d1117",borderRadius:16,padding:20,border:"1px solid #1a1f2e",marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",marginBottom:14}}>📊 How much data are you moving?</div>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:6}}>
          <input type="range" min={1} max={500000} value={dataSize} onChange={e=>setDataSize(+e.target.value)} style={{flex:1,accentColor:"#9333ea"}}/>
          <div style={{fontFamily:MM,fontSize:16,fontWeight:700,color:"#9333ea",minWidth:100,textAlign:"right"}}>{dataSize>=1000?`${(dataSize/1000).toFixed(1)} TB`:`${dataSize} GB`}</div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#475569",fontFamily:MM}}><span>1 GB</span><span>500 TB</span></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {methods.map(m=>{
          const isRec=m.id===recommended;const isSel=method===m.id;
          return <div key={m.id} onClick={()=>{setMethod(m.id);setComplete(false);setProgress(0);}} style={{padding:"14px",background:isSel?`${m.color}12`:"#0d1117",border:`2px solid ${isSel?m.color:"#1a1f2e"}`,borderRadius:14,cursor:"pointer",position:"relative",transition:"all 0.3s"}}>
            {isRec&&<div style={{position:"absolute",top:-8,right:8,background:"#9333ea",color:"#fff",padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:700}}>RECOMMENDED</div>}
            <div style={{fontSize:22,marginBottom:4}}>{m.icon}</div>
            <div style={{fontWeight:700,fontSize:13,color:"#e2e8f0"}}>{m.name}</div>
            <div style={{fontSize:10,color:"#94a3b8",marginBottom:6}}>{m.desc}</div>
            <div style={{fontSize:10,color:m.color,fontWeight:600}}>Best for: {m.best}</div>
            <div style={{fontSize:10,color:"#64748b",fontFamily:MM,marginTop:4}}>Est: {m.time(dataSize)>=1440?`${Math.round(m.time(dataSize)/1440)} days`:m.time(dataSize)>=60?`${Math.round(m.time(dataSize)/60)} hrs`:`${m.time(dataSize)} sec`}</div>
          </div>;
        })}
      </div>

      {method&&<div style={{background:"#0d1117",borderRadius:16,padding:18,border:"1px solid #1a1f2e"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0",marginBottom:12}}>Transfer Simulation</div>
        {/* Visual transfer animation */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:60,height:60,borderRadius:14,background:"#1e293b",border:"2px solid #334155",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}><span style={{fontSize:20}}>🏢</span><span style={{fontSize:8,color:"#64748b"}}>On-Prem</span></div>
          <div style={{flex:1,position:"relative",height:40}}>
            <div style={{position:"absolute",top:"50%",left:0,right:0,height:4,background:"#141720",borderRadius:2,transform:"translateY(-50%)"}}/>
            <div style={{position:"absolute",top:"50%",left:0,width:`${progress}%`,height:4,background:methods.find(x=>x.id===method)!.color,borderRadius:2,transform:"translateY(-50%)",transition:"width 0.2s"}}/>
            {transferring&&<div style={{position:"absolute",top:"50%",left:`${progress}%`,transform:"translate(-50%,-50%)",fontSize:16,animation:"float 0.8s infinite"}}>📡</div>}
            <div style={{position:"absolute",top:0,right:"50%",transform:"translateX(50%)",fontSize:10,fontWeight:700,color:"#9333ea",fontFamily:MM}}>{progress}%</div>
          </div>
          <div style={{width:60,height:60,borderRadius:14,background:complete?"#10b98115":"#9333ea10",border:`2px solid ${complete?"#10b981":"#9333ea"}30`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",transition:"all 0.3s"}}><span style={{fontSize:20}}>☁️</span><span style={{fontSize:8,color:complete?"#10b981":"#64748b"}}>Azure</span></div>
        </div>
        {!transferring&&!complete&&<button onClick={startTransfer} style={{width:"100%",padding:"10px",background:"#9333ea",color:"#fff",border:"none",borderRadius:10,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>▶ Start Transfer</button>}
        {complete&&<div style={{textAlign:"center",padding:"12px",background:"#10b98110",borderRadius:10,border:"1px solid #10b98125"}}><div style={{fontSize:16,fontWeight:800,color:"#10b981"}}>✓ Transfer Complete!</div><div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{dataSize>=1000?`${(dataSize/1000).toFixed(1)} TB`:`${dataSize} GB`} successfully migrated to Azure Blob Storage</div></div>}
      </div>}
    </div>
  );
}

/* ── Tab 5: Azure Arc Demo ── */
function MigrateArcTab() {
  const [resources,setResources]=useState([
    {name:"prod-web-01",loc:"On-Premises",type:"Windows Server",icon:"🖥️",connected:false,policy:false,monitor:false},
    {name:"k8s-cluster-aws",loc:"AWS",type:"Kubernetes",icon:"☸️",connected:false,policy:false,monitor:false},
    {name:"db-server-gcp",loc:"GCP",type:"Linux Server",icon:"🐧",connected:false,policy:false,monitor:false},
    {name:"edge-device-01",loc:"Edge",type:"IoT Server",icon:"📡",connected:false,policy:false,monitor:false},
  ]);
  const [step,setStep]=useState(0);

  const connectAll=()=>{setResources(r=>r.map(x=>({...x,connected:true})));setStep(1);};
  const applyPolicies=()=>{setResources(r=>r.map(x=>({...x,policy:true})));setStep(2);};
  const enableMonitor=()=>{setResources(r=>r.map(x=>({...x,monitor:true})));setStep(3);};

  const connectedCount=resources.filter(r=>r.connected).length;
  const policyCount=resources.filter(r=>r.policy).length;
  const monitorCount=resources.filter(r=>r.monitor).length;

  return (
    <div>
      <div style={{background:"#0d1117",borderRadius:16,padding:20,border:"1px solid #0078d420",marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>🌐 Azure Arc — Manage Everything from Azure</div>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>Connect servers from ANY location to Azure management. Apply policies, enable monitoring — one portal.</div>

        {/* Central hub visual */}
        <div style={{position:"relative",height:280,marginBottom:16}}>
          {/* Azure portal center */}
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:90,height:90,borderRadius:"50%",background:"#0078d418",border:"3px solid #0078d4",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",zIndex:2,boxShadow:"0 0 30px #0078d430",animation:step>0?"glow 2s infinite":"none"}}>
            <span style={{fontSize:24}}>☁️</span>
            <span style={{fontSize:8,fontWeight:700,color:"#0078d4"}}>Azure Portal</span>
          </div>
          {/* Resource nodes around */}
          {resources.map((r,i)=>{
            const angle=(i/resources.length)*Math.PI*2-Math.PI/2;
            const radius=110;
            const x=50+Math.cos(angle)*(radius/3.5);
            const y=50+Math.sin(angle)*(radius/2.8);
            const locColors:{[k:string]:string}={"On-Premises":"#f59e0b","AWS":"#ff9900","GCP":"#4285f4","Edge":"#10b981"};
            return <div key={i} style={{position:"absolute",left:`${x}%`,top:`${y}%`,transform:"translate(-50%,-50%)",zIndex:1}}>
              {/* Connection line */}
              {r.connected&&<svg style={{position:"absolute",width:200,height:200,top:"-100%",left:"-100%",pointerEvents:"none",overflow:"visible"}}>
                <line x1="50%" y1="50%" x2={`${(50-x)/Math.abs(50-x)*40+50}%`} y2={`${(50-y)/Math.abs(50-y)*40+50}%`} stroke="#0078d4" strokeWidth="2" strokeDasharray="6 3" opacity="0.5"/>
              </svg>}
              <div style={{width:80,height:80,borderRadius:14,background:r.connected?`${locColors[r.loc]}12`:"#141720",border:`2px solid ${r.connected?locColors[r.loc]:"#1e293b"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",transition:"all 0.5s",boxShadow:r.connected?`0 0 15px ${locColors[r.loc]}20`:"none"}}>
                <span style={{fontSize:20}}>{r.icon}</span>
                <span style={{fontSize:8,fontWeight:700,color:r.connected?"#e2e8f0":"#475569",textAlign:"center",lineHeight:1.2}}>{r.name.length>12?r.name.slice(0,12):r.name}</span>
                <span style={{fontSize:7,color:locColors[r.loc],fontWeight:600}}>{r.loc}</span>
              </div>
              {/* Status badges */}
              <div style={{display:"flex",gap:2,marginTop:4,justifyContent:"center"}}>
                {r.connected&&<span style={{width:14,height:14,borderRadius:"50%",background:"#0078d425",border:"1px solid #0078d4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7}}>🔗</span>}
                {r.policy&&<span style={{width:14,height:14,borderRadius:"50%",background:"#10b98125",border:"1px solid #10b981",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7}}>📋</span>}
                {r.monitor&&<span style={{width:14,height:14,borderRadius:"50%",background:"#9333ea25",border:"1px solid #9333ea",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7}}>📊</span>}
              </div>
            </div>;
          })}
        </div>

        {/* Action steps */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
          <button onClick={connectAll} disabled={step>=1} style={{padding:"12px",background:step>=1?"#0078d410":"#0078d4",color:step>=1?"#0078d4":"#fff",border:`1px solid #0078d430`,borderRadius:10,fontFamily:F,fontWeight:700,fontSize:11,cursor:step>=1?"default":"pointer",opacity:step>=1?0.7:1}}>
            {step>=1?"✓ Connected":"1. Connect All"}
          </button>
          <button onClick={applyPolicies} disabled={step<1||step>=2} style={{padding:"12px",background:step>=2?"#10b98110":step>=1?"#10b981":"#141720",color:step>=2?"#10b981":step>=1?"#fff":"#475569",border:`1px solid ${step>=1?"#10b981":"#1e293b"}30`,borderRadius:10,fontFamily:F,fontWeight:700,fontSize:11,cursor:step===1?"pointer":"default",opacity:step<1?0.4:step>=2?0.7:1}}>
            {step>=2?"✓ Policies Applied":"2. Apply Policies"}
          </button>
          <button onClick={enableMonitor} disabled={step<2||step>=3} style={{padding:"12px",background:step>=3?"#9333ea10":step>=2?"#9333ea":"#141720",color:step>=3?"#9333ea":step>=2?"#fff":"#475569",border:`1px solid ${step>=2?"#9333ea":"#1e293b"}30`,borderRadius:10,fontFamily:F,fontWeight:700,fontSize:11,cursor:step===2?"pointer":"default",opacity:step<2?0.4:step>=3?0.7:1}}>
            {step>=3?"✓ Monitoring On":"3. Enable Monitoring"}
          </button>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <div style={{padding:"10px",background:"#0078d408",borderRadius:10,textAlign:"center",border:"1px solid #0078d420"}}><div style={{fontSize:20,fontWeight:800,color:"#0078d4"}}>{connectedCount}</div><div style={{fontSize:9,color:"#64748b"}}>Arc-Connected</div></div>
          <div style={{padding:"10px",background:"#10b98108",borderRadius:10,textAlign:"center",border:"1px solid #10b98120"}}><div style={{fontSize:20,fontWeight:800,color:"#10b981"}}>{policyCount}</div><div style={{fontSize:9,color:"#64748b"}}>Policy Compliant</div></div>
          <div style={{padding:"10px",background:"#9333ea08",borderRadius:10,textAlign:"center",border:"1px solid #9333ea20"}}><div style={{fontSize:20,fontWeight:800,color:"#9333ea"}}>{monitorCount}</div><div style={{fontSize:9,color:"#64748b"}}>Monitored</div></div>
        </div>
      </div>
    </div>
  );
}