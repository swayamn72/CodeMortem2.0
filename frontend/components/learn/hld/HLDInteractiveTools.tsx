"use client";

import { useState, useEffect, useRef } from "react";
import LineExplainer from "@/components/shared/LineExplainer";
import { TEMPLATE_LINES } from "./registry/part5-template";

// ═════════════════════════════════════════════════════════════════════════════
// Shared tree data (10 nodes)
//
//           1 (val=10)
//         /   \
//       2(5)   3(8)
//      / \    / \
//    4(3) 5(7) 6(12) 7(2)
//   /        /     \
//  8(6)     9(9)   10(4)
//
// sz:    [-, 10, 4, 5, 2, 1, 2, 2, 1, 1, 1]
// depth: [-, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3]
// par:   [-, 0, 1, 1, 2, 2, 3, 3, 4, 6, 7] 
// heavy: [-, 3, 4, 6, 8,-1, 9, 10,-1,-1,-1]
// pos:   [-, 0, 6, 1, 7, 9, 2, 4, 8, 3, 5] 
// head:  [-, 1, 2, 1, 2, 5, 1, 7, 2, 1, 7] 
// val:   [-,10, 5, 8, 3, 7,12, 2, 6, 9, 4]
// ═════════════════════════════════════════════════════════════════════════════

const PAR   = [0, 0, 1, 1, 2, 2, 3, 3, 4, 6, 7];
const DEPTH = [0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3];
const SZ    = [0,10, 4, 5, 2, 1, 2, 2, 1, 1, 1];
const HEAVY = [0, 3, 4, 6, 8,-1, 9, 10,-1,-1,-1];
const POS   = [0, 0, 6, 1, 7, 9, 2, 4, 8, 3, 5];
const HEAD  = [0, 1, 2, 1, 2, 5, 1, 7, 2, 1, 7];
const VAL   = [0,10, 5, 8, 3, 7,12, 2, 6, 9, 4];
const EDGES: [number,number][] = [[1,2],[1,3],[2,4],[2,5],[3,6],[3,7],[4,8],[6,9],[7,10]];
const ALL_NODES = [1,2,3,4,5,6,7,8,9,10];

// Chain → colour
const CHAIN_COL: Record<number, string> = {
  1: "#ff2d55",
  2: "#00f0ff",
  5: "#ffd700",
  7: "#aa00e6",
};
function chainCol(node: number) { return CHAIN_COL[HEAD[node]] ?? "#888"; }
function isHeavyEdge(u: number, v: number) { return HEAVY[u]===v || HEAVY[v]===u; }

// Node SVG positions
const NP: Record<number,[number,number]> = {
  1:[200,34], 2:[100,94], 3:[300,94], 
  4:[60,154], 5:[140,154], 6:[260,154], 7:[340,154],
  8:[60,214], 9:[260,214], 10:[340,214],
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 14,
  padding: "1.4rem 1.6rem",
  marginTop: "1.5rem",
};
const stepBtn = (active: boolean): React.CSSProperties => ({
  padding: "6px 18px",
  borderRadius: 6,
  border: `1px solid ${active ? "var(--cm-red)" : "rgba(255,255,255,0.12)"}`,
  background: active ? "rgba(255,45,85,0.15)" : "rgba(255,255,255,0.04)",
  color: active ? "var(--cm-red)" : "var(--text-secondary)",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  transition: "all 0.18s",
});
const tag = (color: string): React.CSSProperties => ({
  display:"inline-flex", alignItems:"center", gap:5,
  fontSize:11, fontWeight:700, letterSpacing:"0.5px",
  padding:"2px 10px", borderRadius:999,
  background: color+"22", border:`1px solid ${color}55`, color,
});

// ── Reusable SVG tree ─────────────────────────────────────────────────────────
function TreeSvg({
  nodeColor, edgeStyle = "default", showLabel = "node", size = 400,
  pulseNodes = [],
  onNodeClick,
}: {
  nodeColor: (n: number) => { fill: string; stroke: string; text: string };
  edgeStyle?: "default" | "heavylight" | "redblue";
  showLabel?: "node" | "sz" | "pos" | "val";
  size?: number;
  pulseNodes?: number[];
  onNodeClick?: (n: number) => void;
}) {
  const R = 22;
  return (
    <svg viewBox={`0 0 400 258`} style={{ width: size, maxWidth: "100%", display: "block" }}>
      {EDGES.map(([u,v]) => {
        const [x1,y1]=NP[u], [x2,y2]=NP[v];
        const heavy = isHeavyEdge(u,v);
        let stroke = "#3a3a4e";
        let sw = 2;
        let dash: string|undefined = undefined;
        if (edgeStyle === "heavylight") {
          if (heavy) { stroke = chainCol(v); sw = 4.5; }
          else { stroke = "#444"; sw = 1.5; dash = "6 4"; }
        } else if (edgeStyle === "redblue") {
          if (heavy) { stroke = "var(--cm-red)"; sw = 4.5; }
          else { stroke = "var(--cm-cyan)"; sw = 1.5; dash = "6 4"; }
        }
        return <line key={`e${u}${v}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={stroke} strokeWidth={sw} strokeDasharray={dash}
          style={{transition:"all 0.35s"}} />;
      })}
      {ALL_NODES.map(n => {
        const [cx,cy]=NP[n];
        const {fill,stroke,text} = nodeColor(n);
        const pulse = pulseNodes.includes(n);
        const lbl = showLabel==="sz" ? SZ[n]
          : showLabel==="pos" ? POS[n]
          : showLabel==="val" ? VAL[n]
          : n;
        return (
          <g key={n} onClick={onNodeClick ? () => onNodeClick(n) : undefined} style={{cursor: onNodeClick ? "pointer" : "default"}}>
            {pulse && <circle cx={cx} cy={cy} r={R+5}
              fill="none" stroke={stroke} strokeWidth={2} opacity={0.35}
              style={{animation:"hld-pulse 1.2s ease-in-out infinite"}}/>}
            {/* Base opaque circle to block lines underneath from showing through translucent fills */}
            <circle cx={cx} cy={cy} r={R} fill="#101017" stroke="none" />
            <circle cx={cx} cy={cy} r={R} fill={fill} stroke={stroke}
              strokeWidth={2} style={{transition:"all 0.35s"}}/>
            <text x={cx} y={cy+5} textAnchor="middle"
              fill={text} fontSize={13} fontWeight={700}
              fontFamily="var(--font-mono,monospace)"
              style={{transition:"all 0.35s",userSelect:"none"}}>
              {lbl}
            </text>
          </g>
        );
      })}
      <style>{`@keyframes hld-pulse{0%,100%{r:27;opacity:.35}50%{r:32;opacity:.15}}`}</style>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VIZ 1 — Naive Path Query (lesson: hld-l0-bottleneck)
// Shows the O(N) step-by-step traversal from node 5 to node 9
// ═════════════════════════════════════════════════════════════════════════════

const NAIVE_STEPS = [
  { visited:[5],          msg:"Start at node 5. We need to reach node 9.", ops:1 },
  { visited:[5,2],        msg:"Go up: 5 → parent 2. Still haven't reached 9.", ops:2 },
  { visited:[5,2,1],      msg:"Go up: 2 → parent 1 (root). Still not 9.", ops:3 },
  { visited:[5,2,1,3],    msg:"Go down: 1 → child 3. Closer to 9.", ops:4 },
  { visited:[5,2,1,3,6],  msg:"Go down: 3 → child 6.", ops:5 },
  { visited:[5,2,1,3,6,9],msg:"Arrived at 9! Path found in 6 steps.", ops:6 },
];

export function NaivePathViz() {
  const [step, setStep] = useState(0);
  const s = NAIVE_STEPS[step];
  return (
    <div style={card}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem",flexWrap:"wrap",gap:8}}>
        <h3 style={{margin:0,fontSize:"0.95rem",fontWeight:700,color:"var(--cm-red)"}}>
          🐢 Naive Path Query: node 5 → node 9
        </h3>
        <span style={tag("#ff2d55")}>{s.ops} step{s.ops>1?"s":""} / O(N) worst case</span>
      </div>

      <TreeSvg
        edgeStyle="default"
        showLabel="node"
        size={440}
        nodeColor={n => {
          if (n === 5) return {fill:"rgba(255,215,0,0.25)",stroke:"#ffd700",text:"#ffd700"};
          if (n === 9) return {fill:"rgba(0,255,136,0.25)",stroke:"#00ff88",text:"#00ff88"};
          if (s.visited.includes(n) && n!==5 && n!==9)
            return {fill:"rgba(255,45,85,0.2)",stroke:"#ff2d55",text:"#ff2d55"};
          return {fill:"#12121e",stroke:"#3a3a5a",text:"#666"};
        }}
        pulseNodes={s.visited.slice(-1)}
      />

      <div style={{
        marginTop:"0.75rem", padding:"0.8rem 1rem",
        background:"rgba(255,45,85,0.07)", border:"1px solid rgba(255,45,85,0.2)",
        borderRadius:8, fontSize:"0.875rem", color:"var(--text-secondary)", lineHeight:1.6,
        minHeight:44,
      }}>
        {s.msg}
      </div>

      <div style={{display:"flex",gap:8,marginTop:"1rem",alignItems:"center"}}>
        <button style={stepBtn(step>0)} disabled={step===0}
          onClick={()=>setStep(p=>p-1)}>← Back</button>
        <button style={stepBtn(step<NAIVE_STEPS.length-1)} disabled={step===NAIVE_STEPS.length-1}
          onClick={()=>setStep(p=>p+1)}>Next →</button>
        <button style={{...stepBtn(false),marginLeft:"auto"}} onClick={()=>setStep(0)}>Reset</button>
        <span style={{fontSize:12,color:"var(--text-muted)"}}>
          {step+1}/{NAIVE_STEPS.length}
        </span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VIZ 2 — Heavy-Light Tree (lesson: hld-l0-guarantee)
// Shows subtree sizes, heavy vs light edges, and the 4 chains
// ═════════════════════════════════════════════════════════════════════════════

type HLMode = "sizes" | "edges" | "chains";

export function HeavyLightTreeViz() {
  const [mode, setMode] = useState<HLMode>("sizes");

  const nodeColor = (n: number): {fill:string;stroke:string;text:string} => {
    if (mode === "chains") {
      const c = chainCol(n);
      return {fill: c+"22", stroke: c, text: c};
    }
    return {fill:"#12121e", stroke:"#4a4a6a", text:"#ccc"};
  };

  const CHAINS = [
    {head:1, nodes:[1,3,6,9], label:"Chain A (head=1)", col:"#ff2d55"},
    {head:2, nodes:[2,4,8],   label:"Chain B (head=2)", col:"#00f0ff"},
    {head:7, nodes:[7,10],    label:"Chain C (head=7)", col:"#aa00e6"},
    {head:5, nodes:[5],       label:"Chain D (head=5)", col:"#ffd700"},
  ];

  return (
    <div style={card}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem",flexWrap:"wrap",gap:8}}>
        <h3 style={{margin:0,fontSize:"0.95rem",fontWeight:700,color:"var(--cm-red)"}}>
          Heavy-Light Decomposition
        </h3>
        <div style={{display:"flex",gap:6}}>
          {(["sizes","edges","chains"] as HLMode[]).map(m=>(
            <button key={m} style={stepBtn(mode===m)} onClick={()=>setMode(m)}>
              {m==="sizes"?"Subtree Sizes":m==="edges"?"Heavy Edges":"Chains"}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:"1rem",alignItems:"flex-start",flexWrap:"wrap"}}>
        <div style={{flex:"0 0 auto"}}>
          <TreeSvg
            edgeStyle={mode==="sizes"?"default":mode==="edges"?"redblue":"heavylight"}
            showLabel={mode==="sizes"?"sz":"node"}
            nodeColor={nodeColor}
            size={420}
          />
        </div>

        <div style={{flex:1,minWidth:180,display:"flex",flexDirection:"column",gap:"0.6rem",paddingTop:8}}>
          {mode==="sizes" && (
            <>
              <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:4,fontWeight:700,letterSpacing:"0.5px"}}>
                SUBTREE SIZES
              </div>
              <div style={{maxHeight: 280, overflowY: "auto", paddingRight: 8}}>
                {ALL_NODES.map(n=>(
                  <div key={n} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{width:20,height:20,borderRadius:"50%",background:"#12121e",
                      border:"1.5px solid #4a4a6a",display:"flex",alignItems:"center",
                      justifyContent:"center",fontSize:10,fontWeight:700,color:"#ccc",flexShrink:0}}>
                      {n}
                    </span>
                    <div style={{flex:1,height:6,background:"#1a1a2e",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(SZ[n]/10)*100}%`,
                        background:"linear-gradient(90deg,#ff2d55,#ff8c00)",
                        borderRadius:3,transition:"width 0.5s"}}/>
                    </div>
                    <span style={{fontSize:11,fontFamily:"monospace",color:"var(--cm-red)",
                      fontWeight:700,minWidth:16,textAlign:"right"}}>
                      {SZ[n]}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{marginTop:8,padding:"0.6rem 0.8rem",background:"rgba(255,45,85,0.07)",
                borderRadius:8,fontSize:12,color:"var(--text-secondary)",lineHeight:1.6,
                border:"1px solid rgba(255,45,85,0.15)"}}>
                <strong style={{color:"var(--cm-red)"}}>Heavy child</strong> = child with the largest subtree size.
              </div>
            </>
          )}

          {mode==="edges" && (
            <>
              <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:4,fontWeight:700,letterSpacing:"0.5px"}}>
                EDGE CLASSIFICATION
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:4,background:"#ff2d55",borderRadius:2}}/>
                  <span style={{fontSize:12,color:"var(--text-secondary)"}}>
                    <strong style={{color:"var(--cm-red)"}}>Heavy edge</strong> — leads to heavy child
                  </span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:2,background:"var(--cm-cyan)",borderRadius:2,
                    backgroundImage:"repeating-linear-gradient(90deg,var(--cm-cyan) 0 5px,transparent 5px 9px)"}}/>
                  <span style={{fontSize:12,color:"var(--text-secondary)"}}>
                    <strong style={{color:"var(--cm-cyan)"}}>Light edge</strong> — leads to non-heavy child
                  </span>
                </div>
              </div>
              <div style={{maxHeight: 220, overflowY: "auto", marginTop: 8}}>
                {EDGES.map(([u,v])=>{
                  const heavy=isHeavyEdge(u,v);
                  return (
                    <div key={`${u}${v}`} style={{display:"flex",alignItems:"center",gap:8,
                      padding:"4px 8px",borderRadius:6, marginBottom: 4,
                      background:heavy?"rgba(255,45,85,0.08)":"rgba(0,240,255,0.08)",
                      border:`1px solid ${heavy?"rgba(255,45,85,0.2)":"rgba(0,240,255,0.2)"}`}}>
                      <span style={{fontFamily:"monospace",fontSize:11,
                        color:heavy?"var(--cm-red)":"var(--cm-cyan)"}}>
                        {u} → {v}
                      </span>
                      <span style={{marginLeft:"auto",fontSize:9,fontWeight:700,
                        color:heavy?"var(--cm-red)":"var(--cm-cyan)"}}>
                        {heavy?"HEAVY":"light"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {mode==="chains" && (
            <>
              <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:4,fontWeight:700,letterSpacing:"0.5px"}}>
                4 CHAINS FORMED
              </div>
              {CHAINS.map(ch=>(
                <div key={ch.head} style={{padding:"6px 10px",borderRadius:8, marginBottom: 6,
                  background:ch.col+"11",border:`1px solid ${ch.col}44`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:ch.col}}/>
                    <span style={{fontSize:11,fontWeight:700,color:ch.col}}>{ch.label}</span>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {ch.nodes.map((n,i)=>(
                      <span key={n} style={{display:"flex",alignItems:"center",gap:4}}>
                        <span style={{width:20,height:20,borderRadius:"50%",
                          background:ch.col+"22",border:`1.5px solid ${ch.col}`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:10,fontWeight:700,color:ch.col}}>
                          {n}
                        </span>
                        {i<ch.nodes.length-1&&<span style={{color:"#555",fontSize:10}}>→</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VIZ 3 — Tree Metrics Explorer (lesson: hld-l1-metrics-concept)
// Click any node to see depth, par, sz, heavy for that node
// ═════════════════════════════════════════════════════════════════════════════

export function TreeMetricsViz() {
  const [selected, setSelected] = useState(1);

  const metricRow = (label: string, val: string|number, color: string) => (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
      padding:"7px 12px",background:"rgba(255,255,255,0.03)",borderRadius:6,
      border:"1px solid rgba(255,255,255,0.07)"}}>
      <span style={{fontSize:12,color:"var(--text-muted)",fontFamily:"monospace"}}>{label}</span>
      <span style={{fontSize:15,fontWeight:700,fontFamily:"monospace",color}}>{val}</span>
    </div>
  );

  return (
    <div style={card}>
      <h3 style={{margin:"0 0 0.25rem",fontSize:"0.95rem",fontWeight:700,color:"var(--cm-red)"}}>
        Tree Metrics Explorer — click any node
      </h3>
      <p style={{margin:"0 0 1rem",fontSize:12,color:"var(--text-muted)"}}>
        The first DFS computes four arrays. Select a node to inspect its values.
      </p>

      <div style={{display:"flex",gap:"1.5rem",flexWrap:"wrap",alignItems:"flex-start"}}>
        <div style={{flex:"0 0 auto"}}>
          <TreeSvg
            size={420}
            onNodeClick={setSelected}
            nodeColor={n => {
              const active = n === selected;
              return {
                fill: active ? "rgba(255,45,85,0.25)" : "#12121e",
                stroke: active ? "var(--cm-red)" : "#4a4a6a",
                text: active ? "var(--cm-red)" : "#ccc",
              };
            }}
          />
        </div>

        <div style={{flex:1,minWidth:180}}>
          <div style={{
            padding:"8px 14px",borderRadius:8,marginBottom:"0.75rem",
            background:"rgba(255,45,85,0.1)",border:"1px solid rgba(255,45,85,0.3)",
            fontSize:13,fontWeight:700,color:"var(--cm-red)",
          }}>
            Node {selected}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {metricRow("depth["+selected+"]", DEPTH[selected], "#00f0ff")}
            {metricRow("par["+selected+"]",   PAR[selected]===0?"0 (root sentinel)":PAR[selected], "#ffd700")}
            {metricRow("sz["+selected+"]",    SZ[selected], "#aa00e6")}
            {metricRow("heavy["+selected+"]", HEAVY[selected]===-1?"-1 (leaf)":HEAVY[selected], "#ff2d55")}
          </div>

          <div style={{marginTop:"0.8rem",padding:"0.6rem 0.8rem",
            background:"rgba(0,0,0,0.25)",borderRadius:8,fontSize:12,
            color:"var(--text-secondary)",lineHeight:1.6}}>
            {HEAVY[selected]===-1
              ? `Node ${selected} is a leaf — it has no heavy child.`
              : `Node ${selected}'s heavy child is ${HEAVY[selected]} (largest subtree: sz=${SZ[HEAVY[selected]]}).`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VIZ 4 — Chain Flattening Animation (lesson: hld-l1-chains-concept)
// THE KEY visualization: tree → 1D array with DFS2 step-by-step
// ═════════════════════════════════════════════════════════════════════════════

const DFS2_ORDER = [1, 3, 6, 9, 7, 10, 2, 4, 8, 5];

export function ChainFlatteningViz() {
  const [step, setStep] = useState(0);
  const placed = DFS2_ORDER.slice(0, step);
  const SLOTS = 10;

  const isAutoRef = useRef(false);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (!autoPlay) return;
    if (step >= DFS2_ORDER.length) { setAutoPlay(false); return; }
    const t = setTimeout(()=>setStep(p=>p+1), 600);
    return ()=>clearTimeout(t);
  }, [autoPlay, step]);

  const nodeColor = (n: number): {fill:string;stroke:string;text:string} => {
    const c = chainCol(n);
    const isPlaced = placed.includes(n);
    const isCurrent = DFS2_ORDER[step-1]===n;
    if (isCurrent) return {fill:c+"44",stroke:c,text:c};
    if (isPlaced) return {fill:c+"18",stroke:c+"88",text:c+"cc"};
    return {fill:"#0e0e1a",stroke:"#2a2a3e",text:"#444"};
  };

  return (
    <div style={card}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        marginBottom:"0.75rem",flexWrap:"wrap",gap:8}}>
        <h3 style={{margin:0,fontSize:"0.95rem",fontWeight:700,color:"var(--cm-red)"}}>
          Chain Flattening — DFS2 Visit Order
        </h3>
        <div style={{display:"flex",gap:6}}>
          {!autoPlay
            ? <button style={stepBtn(true)} onClick={()=>{if(step<DFS2_ORDER.length)setAutoPlay(true)}}>
                ▶ Auto
              </button>
            : <button style={stepBtn(true)} onClick={()=>setAutoPlay(false)}>⏸ Pause</button>
          }
          <button style={stepBtn(false)} onClick={()=>{setAutoPlay(false);setStep(0)}}>↺</button>
        </div>
      </div>

      <p style={{margin:"0 0 1rem",fontSize:12,color:"var(--text-muted)"}}>
        DFS2 always visits the <strong style={{color:"var(--cm-red)"}}>heavy child first</strong>, giving each chain a contiguous block in the 1D array.
      </p>

      <div style={{display:"flex",gap:"1rem",alignItems:"flex-start",flexWrap:"wrap"}}>
        <div style={{flex:"0 0 auto"}}>
          <TreeSvg edgeStyle="heavylight" showLabel="node" nodeColor={nodeColor} size={380}
            pulseNodes={DFS2_ORDER[step-1]?[DFS2_ORDER[step-1]]:[]}/>
        </div>

        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.5px",
            color:"var(--text-muted)",marginBottom:8}}>
            1D ARRAY (pos → node)
          </div>
          <div style={{display:"grid",gridTemplateColumns:`repeat(5,1fr)`,gap:4,marginBottom:"1rem"}}>
            {Array.from({length:SLOTS},(_,i)=>{
              const node = placed[i];
              const col = node ? chainCol(node) : "#222";
              return (
                <div key={i} style={{
                  aspectRatio:"1.5",display:"flex",flexDirection:"column",
                  alignItems:"center",justifyContent:"center",
                  background: node ? col+"22" : "#0e0e1a",
                  border:`2px solid ${node ? col : "#2a2a3e"}`,
                  borderRadius:6,
                  transition:"all 0.35s",
                  minWidth:28,
                }}>
                  <span style={{fontSize:13,fontWeight:700,
                    color: node ? col : "#333",fontFamily:"monospace"}}>
                    {node ?? ""}
                  </span>
                  <span style={{fontSize:8,color:"#555",marginTop:1}}>{i}</span>
                </div>
              );
            })}
          </div>

          <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:8}}>
            pos[] assigned: <strong style={{color:"var(--cm-red)"}}>{placed.length}</strong> / {SLOTS}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {[
              {head:1,nodes:[1,3,6,9],col:"#ff2d55",pos:"[0..3]"},
              {head:7,nodes:[7,10],   col:"#aa00e6",pos:"[4..5]"},
              {head:2,nodes:[2,4,8],  col:"#00f0ff",pos:"[6..8]"},
              {head:5,nodes:[5],      col:"#ffd700",pos:"[9]"},
            ].map(ch=>{
              const visible = ch.nodes.some(n=>placed.includes(n));
              return (
                <div key={ch.head} style={{
                  display:"flex",alignItems:"center",gap:6,
                  padding:"4px 8px",borderRadius:6,
                  opacity: visible ? 1 : 0.3,
                  background: visible ? ch.col+"11" : "transparent",
                  border:`1px solid ${visible?ch.col+"44":"rgba(255,255,255,0.05)"}`,
                  transition:"all 0.35s",
                }}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:ch.col,flexShrink:0}}/>
                  <span style={{fontSize:10,color:ch.col,fontFamily:"monospace",fontWeight:700}}>
                    Chain(head={ch.head}): {ch.nodes.join("→")}
                  </span>
                  {visible && (
                    <span style={{marginLeft:"auto",fontSize:9,color:ch.col,fontFamily:"monospace"}}>
                      {ch.pos}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginTop:"1rem",alignItems:"center"}}>
        <button style={stepBtn(step>0)} disabled={step===0}
          onClick={()=>{setAutoPlay(false);setStep(p=>p-1)}}>← Back</button>
        <button style={stepBtn(step<DFS2_ORDER.length)} disabled={step>=DFS2_ORDER.length}
          onClick={()=>{setAutoPlay(false);setStep(p=>p+1)}}>Next →</button>
        <span style={{fontSize:12,color:"var(--text-muted)",marginLeft:"auto"}}>
          {step}/{DFS2_ORDER.length}
        </span>
      </div>

      {step >= DFS2_ORDER.length && (
        <div style={{marginTop:"0.75rem",padding:"0.7rem 1rem",borderRadius:8,
          background:"rgba(0,255,136,0.07)",border:"1px solid rgba(0,255,136,0.2)",
          fontSize:12,color:"var(--text-secondary)",lineHeight:1.6}}>
          ✓ <strong style={{color:"var(--cm-green)"}}>Done!</strong> Each chain occupies a contiguous range:
          Chain A → [0..3], Chain B → [6..8]. A Segment Tree range query over [0,3] captures exactly the nodes in Chain A.
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VIZ 5 — Path Query Jump Visualization (lesson: hld-l2-routing)
// Animates the chain-jumping algorithm for path 5 → 9
// ═════════════════════════════════════════════════════════════════════════════

const JUMP_STEPS = [
  {
    u:5, v:9,
    highlightU:[5], highlightV:[9],
    seqRanges:[] as {l:number;r:number;col:string;max:number}[],
    msg:"Query: max node value on path 5 → 9. head[5]=5, head[9]=1 — different chains. u=5 is deeper (depth[head[5]]=2 > depth[head[9]]=0).",
    arrow:null as null|string,
  },
  {
    u:2, v:9,
    highlightU:[5], highlightV:[9],
    seqRanges:[{l:9,r:9,col:"#ffd700",max:7}],
    msg:"Query Seg Tree [pos[5]=9, pos[5]=9] → max=7 (node 5's value). Jump: u = par[head[5]] = par[5] = 2. Now head[2]=2, head[9]=1 — still different.",
    arrow:"5 → par[5] = 2",
  },
  {
    u:1, v:9,
    highlightU:[2], highlightV:[9],
    seqRanges:[{l:9,r:9,col:"#ffd700",max:7},{l:6,r:6,col:"#00f0ff",max:5}],
    msg:"u=2 is deeper (depth[head[2]]=1 > depth[head[9]]=0). Query Seg Tree [pos[2]=6, pos[2]=6] → max=5 (node 2's value). Jump: u = par[head[2]] = par[2] = 1.",
    arrow:"2 → par[2] = 1",
  },
  {
    u:1, v:9,
    highlightU:[1,9], highlightV:[],
    seqRanges:[{l:9,r:9,col:"#ffd700",max:7},{l:6,r:6,col:"#00f0ff",max:5},{l:0,r:3,col:"#ff2d55",max:12}],
    msg:"head[1]=1 = head[9]=1 — same chain! Final query [pos[1]=0, pos[9]=3] → max=12 (node 6 has val=12). Overall max = max(7, 5, 12) = 12 ✓",
    arrow:null,
  },
];

export function PathQueryViz() {
  const [step, setStep] = useState(0);
  const s = JUMP_STEPS[step];

  const nodeColor = (n: number): {fill:string;stroke:string;text:string} => {
    if (s.highlightU.includes(n)) return {fill:"rgba(255,215,0,0.25)",stroke:"#ffd700",text:"#ffd700"};
    if (s.highlightV.includes(n)) return {fill:"rgba(0,240,255,0.2)",stroke:"#00f0ff",text:"#00f0ff"};
    const covered = s.seqRanges.some(r=>POS[n]>=r.l && POS[n]<=r.r);
    if (covered) {
      const range = s.seqRanges.find(r=>POS[n]>=r.l && POS[n]<=r.r)!;
      return {fill:range.col+"22",stroke:range.col+"88",text:range.col};
    }
    return {fill:"#0e0e1a",stroke:"#2a2a3e",text:"#555"};
  };

  return (
    <div style={card}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        marginBottom:"0.75rem",flexWrap:"wrap",gap:8}}>
        <h3 style={{margin:0,fontSize:"0.95rem",fontWeight:700,color:"var(--cm-red)"}}>
          Path Query: max(5 → 9) — Chain Jumping
        </h3>
        <span style={tag("#ff2d55")}>Step {step+1} of {JUMP_STEPS.length}</span>
      </div>

      <div style={{display:"flex",gap:"1rem",alignItems:"flex-start",flexWrap:"wrap"}}>
        <div style={{flex:"0 0 auto"}}>
          <TreeSvg edgeStyle="heavylight" showLabel="val" nodeColor={nodeColor} size={380}/>
          <div style={{textAlign:"center",fontSize:10,color:"var(--text-muted)",marginTop:4}}>
            Node labels = values
          </div>
        </div>

        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.5px",
            color:"var(--text-muted)",marginBottom:6}}>1D ARRAY (pos → node)</div>
          <div style={{position:"relative",marginBottom:"1rem"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:3}}>
              {[0,1,2,3,4,5,6,7,8,9].map(pos=>{
                const node = ALL_NODES.find(n=>POS[n]===pos)!;
                const range = s.seqRanges.find(r=>pos>=r.l&&pos<=r.r);
                const col = range ? range.col : "#333";
                return (
                  <div key={pos} style={{
                    display:"flex",flexDirection:"column",alignItems:"center",
                    gap:2,
                  }}>
                    <div style={{
                      width:"100%",aspectRatio:"1.5",display:"flex",flexDirection:"column",
                      alignItems:"center",justifyContent:"center",
                      background: range ? col+"22" : "#0e0e1a",
                      border:`2px solid ${range ? col : "#2a2a3e"}`,
                      borderRadius:6,transition:"all 0.35s",minWidth:24,
                    }}>
                      <span style={{fontSize:11,fontWeight:700,color:range?col:"#444",fontFamily:"monospace"}}>{VAL[node]}</span>
                    </div>
                    <span style={{fontSize:8,color:"#555",fontFamily:"monospace"}}>{pos}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.5px",
            color:"var(--text-muted)",marginBottom:6}}>SEG TREE QUERIES SO FAR</div>
          <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:"0.75rem"}}>
            {s.seqRanges.length===0 && (
              <div style={{fontSize:11,color:"#444",fontFamily:"monospace",
                padding:"4px 8px",background:"#0e0e1a",borderRadius:6}}>
                (none yet)
              </div>
            )}
            {s.seqRanges.map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,
                padding:"4px 8px",borderRadius:6,
                background:r.col+"11",border:`1px solid ${r.col}44`}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:r.col,flexShrink:0}}/>
                <span style={{fontFamily:"monospace",fontSize:10,color:r.col}}>
                  query[{r.l},{r.r}] → max = {r.max}
                </span>
              </div>
            ))}
          </div>

          {step===JUMP_STEPS.length-1 && (
            <div style={{padding:"6px 10px",borderRadius:6,
              background:"rgba(0,255,136,0.08)",border:"1px solid rgba(0,255,136,0.25)",
              fontSize:12,fontWeight:700,color:"var(--cm-green)"}}>
              ✓ Answer = max(7, 5, 12) = <strong>12</strong>
            </div>
          )}

          {s.arrow && (
            <div style={{marginTop:8,padding:"4px 8px",borderRadius:6,
              background:"rgba(255,45,85,0.08)",border:"1px solid rgba(255,45,85,0.2)",
              fontSize:11,fontFamily:"monospace",color:"var(--cm-red)"}}>
              Jump: {s.arrow}
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <div style={{margin:"0.75rem 0",padding:"0.75rem 1rem",
        background:"rgba(255,45,85,0.07)",border:"1px solid rgba(255,45,85,0.18)",
        borderRadius:8,fontSize:"0.875rem",color:"var(--text-secondary)",lineHeight:1.65,
        minHeight:52}}>
        {s.msg}
      </div>

      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button style={stepBtn(step>0)} disabled={step===0} onClick={()=>setStep(p=>p-1)}>← Back</button>
        <button style={stepBtn(step<JUMP_STEPS.length-1)} disabled={step===JUMP_STEPS.length-1}
          onClick={()=>setStep(p=>p+1)}>Next →</button>
        <button style={{...stepBtn(false),marginLeft:"auto"}} onClick={()=>setStep(0)}>↺ Reset</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Router — maps lessonId → visualization component
// ═════════════════════════════════════════════════════════════════════════════

export function getHLDVisual(lessonId: string): React.ReactNode {
  switch (lessonId) {
    case "hld-l0-bottleneck":    return <NaivePathViz />;
    case "hld-l0-chains":        return <HeavyLightTreeViz />;
    case "hld-l0-guarantee":     return <HeavyLightTreeViz />;
    case "hld-l1-metrics-concept": return <TreeMetricsViz />;
    case "hld-l1-chains-concept":  return <ChainFlatteningViz />;
    case "hld-l2-routing":       return <PathQueryViz />;
    // Reuse appropriate viz for later concept lessons
    case "hld-l3-dynamic":       return <PathQueryViz />;
    case "hld-l4-edges":         return <HeavyLightTreeViz />;
    case "hld-l4-subtree":       return <ChainFlatteningViz />;
    case "hld-l4-range-updates": return <PathQueryViz />;
    case "hld-l5-template":      return <LineExplainer lines={TEMPLATE_LINES} language="cpp" />;
    default: return null;
  }
}
