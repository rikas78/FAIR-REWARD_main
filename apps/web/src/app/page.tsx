"use client";

import { useState } from "react";

const filters = ["Tutte", "Sondaggi", "App", "Video", "Shopping", "Micro-task", "Giochi"];

const activities = [
  ["SONDAGGIO","magenta","Survey Lifestyle","Rispondi a 8 domande","€ 2,50","3 min"],
  ["APP","cyan","Installa e prova","Nuova app partner","€ 4,00","5 min"],
  ["VIDEO","yellow","Guarda un video","Scopri nuovi contenuti","€ 1,20","2 min"],
  ["SHOPPING","green","Offerta speciale","Acquista e guadagna","€ 8,00","4 min"],
  ["GIOCO","purple","Completa il livello","Raggiungi l'obiettivo","€ 5,00","6 min"],
  ["MICRO-TASK","orange","Mini-task rapido","Azioni semplici","€ 0,80","1 min"],
] as const;

const border: Record<string,string> = {
  magenta:"border-fuchsia-500/60", cyan:"border-cyan-400/60", yellow:"border-yellow-400/60",
  green:"border-emerald-400/60", purple:"border-violet-500/60", orange:"border-orange-400/60"
};
const badge: Record<string,string> = {
  magenta:"bg-fuchsia-500 text-white", cyan:"bg-cyan-400 text-[#06101f]", yellow:"bg-yellow-400 text-[#11100a]",
  green:"bg-emerald-400 text-[#06140d]", purple:"bg-violet-500 text-white", orange:"bg-orange-400 text-[#1b0d00]"
};
const button: Record<string,string> = {
  magenta:"bg-fuchsia-500 hover:bg-fuchsia-400", cyan:"bg-cyan-400 hover:bg-cyan-300 text-[#06101f]",
  yellow:"bg-yellow-400 hover:bg-yellow-300 text-[#11100a]", green:"bg-emerald-400 hover:bg-emerald-300 text-[#06140d]",
  purple:"bg-violet-500 hover:bg-violet-400", orange:"bg-orange-400 hover:bg-orange-300 text-[#1b0d00]"
};

export default function Home() {
  const [menu,setMenu] = useState(false);
  const [filter,setFilter] = useState("Tutte");
  const [time,setTime] = useState("10");
  const [goal,setGoal] = useState("5");

  const visible = activities.filter(a => filter === "Tutte" || a[0].toLowerCase().includes(filter.toLowerCase().replace("-","")));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020b1d] text-white">
      <header className="sticky top-0 z-40 border-b border-cyan-400/10 bg-[#020b1d]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <button onClick={()=>setMenu(v=>!v)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-white/[0.04] text-xl">☰</button>
          <div className="text-center">
            <div className="text-[17px] font-black tracking-[0.18em]">FAIR<span className="text-fuchsia-500">REWARD</span></div>
            <div className="text-[9px] uppercase tracking-[0.28em] text-white/55">Il tuo tempo ha valore</div>
          </div>
          <div className="rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-2 text-sm font-black">€ 0,00</div>
        </div>

        <div className="border-t border-cyan-400/10 bg-[#031026]">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 sm:px-6">
            {["Home","Attività","Play","Planner","Wallet"].map((x,i)=>
              <button key={x} className={`shrink-0 rounded-xl border px-5 py-2.5 text-sm font-bold ${i===0?"border-fuchsia-400 bg-fuchsia-500":"border-cyan-400/15 bg-white/[0.025] text-white/75"}`}>{x}</button>
            )}
          </div>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 bg-black/70" onClick={()=>setMenu(false)}>
          <div className="absolute left-3 right-3 top-[78px] rounded-2xl border border-cyan-400/20 bg-[#06132b] p-3" onClick={e=>e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["Profilo","Le mie attività","Calendario","Impostazioni"].map(x=>
                <button key={x} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-white/80">{x}</button>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-6 pt-5 sm:px-6">
        <div className="relative min-h-[310px] overflow-hidden rounded-[28px] border border-fuchsia-500/30 bg-[#07132b]">
          <img src="/images/fairreward-v2-reference.png" alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-80"/>
          <div className="absolute inset-0 bg-gradient-to-r from-[#020b1d] via-[#020b1d]/45 to-transparent"/>
          <div className="relative z-10 flex min-h-[310px] max-w-xl flex-col justify-center px-6 py-8 sm:px-10">
            <div className="text-4xl font-black leading-[.95] sm:text-6xl">IL TUO TEMPO<br/><span className="text-fuchsia-500">HA VALORE</span></div>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/80 sm:text-base">Attività retribuite quando vuoi tu. Vedi prima il tempo stimato e la ricompensa prevista.</p>
            <button className="mt-6 w-fit rounded-2xl bg-gradient-to-r from-fuchsia-500 to-yellow-400 px-6 py-3.5 text-sm font-black">Scopri le attività →</button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-3 px-4 pb-5 sm:px-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-cyan-400/20 bg-[#06132b] p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-3"><span className="text-2xl text-cyan-400">◷</span><b>Quanto tempo hai?</b></div>
          <div className="grid grid-cols-3 gap-2">{["5","10","30"].map(v=><button key={v} onClick={()=>setTime(v)} className={`rounded-xl border py-3 text-sm font-black ${time===v?"border-fuchsia-400 bg-fuchsia-500":"border-cyan-400/15 bg-white/[0.025] text-white/75"}`}>{v} min</button>)}</div>
        </div>
        <div className="rounded-3xl border border-fuchsia-400/20 bg-[#06132b] p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-3"><span className="text-2xl text-fuchsia-400">◎</span><b>Quanto vuoi guadagnare?</b></div>
          <div className="grid grid-cols-5 gap-2">{["2","5","10","15","20"].map(v=><button key={v} onClick={()=>setGoal(v)} className={`rounded-xl border py-3 text-xs font-black ${goal===v?"border-fuchsia-400 bg-fuchsia-500":"border-fuchsia-400/15 bg-white/[0.025] text-white/75"}`}>€ {v}</button>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(x=><button key={x} onClick={()=>setFilter(x)} className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-black ${filter===x?"border-fuchsia-400 bg-fuchsia-500":"border-cyan-400/15 bg-[#06132b] text-white/70"}`}>{x}</button>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-28 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/60">INVENTARIO REALE</div><h2 className="mt-1 text-2xl font-black sm:text-3xl">Attività per te</h2></div>
          <button className="text-sm font-bold text-white/65">Vedi tutte →</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map(a=><article key={a[2]} className={`relative min-h-[205px] overflow-hidden rounded-3xl border ${border[a[1]]} bg-[#06132b] p-5`}>
            <div className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-black ${badge[a[1]]}`}>{a[0]}</div>
            <div className="relative flex min-h-[165px] flex-col justify-between">
              <div className="pr-28"><div className="text-xs text-white/50">{a[5]}</div><h3 className="mt-3 text-xl font-black">{a[2]}</h3><p className="mt-1 text-sm text-white/55">{a[3]}</p></div>
              <div className="flex items-end justify-between gap-4"><div className="text-2xl font-black text-fuchsia-400">{a[4]}</div><button className={`rounded-xl px-6 py-3 text-xs font-black ${button[a[1]]}`}>INIZIA</button></div>
            </div>
          </article>)}
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-cyan-400/15 bg-[#020b1d]/96 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-4">{["⌂ Home","◎ Attività","▦ Planner","▢ Wallet"].map((x,i)=><button key={x} className={`py-3 text-xs font-black ${i===0?"text-fuchsia-400":"text-white/55"}`}>{x}</button>)}</div>
      </nav>
    </main>
  );
}
