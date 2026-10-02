"use client";

import { useState } from "react";

const filters = ["Tutte", "€2", "€5", "€10", "€15", "€20", "Survey", "App", "Micro-task"];

const activities = [
  { id: 1, type: "Survey", price: "€5", title: "Survey 5 domande", time: "90 sec", tag: "RAPIDO" },
  { id: 2, type: "App", price: "€10", title: "Installazione App Partner", time: "4 min", tag: "APP" },
  { id: 3, type: "Survey", price: "€15", title: "Survey 25 domande", time: "7 min", tag: "SURVEY" },
  { id: 4, type: "Micro-task", price: "€2", title: "Mini-Review", time: "60 sec", tag: "MICRO" },
  { id: 5, type: "App", price: "€10", title: "Registrazione Partner Light", time: "2 min", tag: "APP" },
  { id: 6, type: "Survey", price: "€20", title: "Survey 50 domande", time: "15 min", tag: "HIGH VALUE" },
];

export default function Home() {
  const [sidebar, setSidebar] = useState(false);
  const [filter, setFilter] = useState("Tutte");
  const [time, setTime] = useState("10");
  const [goal, setGoal] = useState("5");

  const filtered = activities.filter((a) => {
    if (filter === "Tutte") return true;
    if (filter.startsWith("€")) return a.price === filter;
    return a.type === filter;
  });

  return (
    <main className="min-h-screen bg-[#080a0c] text-white">
      {sidebar && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Chiudi menu"
            className="absolute inset-0 bg-black/70"
            onClick={() => setSidebar(false)}
          />
          <aside className="relative h-full w-[300px] border-r border-white/10 bg-[#0d1013] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <div className="text-sm font-black tracking-[0.18em]">FAIRREWARD</div>
                <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-emerald-400/60">
                  Il tuo tempo ha valore
                </div>
              </div>
              <button
                onClick={() => setSidebar(false)}
                className="rounded-xl border border-white/10 px-3 py-2 text-white/60"
              >
                ×
              </button>
            </div>

            <nav className="mt-6 space-y-2">
              {[
                ["⌂", "Home"],
                ["✓", "Attività"],
                ["▶", "Play"],
                ["▦", "Planner"],
                ["€", "Wallet"],
                ["◉", "Profilo"],
              ].map(([icon, label], i) => (
                <button
                  key={label}
                  className={`flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left text-sm font-bold ${
                    i === 0 ? "bg-white text-black" : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="w-5 text-center">{icon}</span>
                  {label}
                </button>
              ))}
            </nav>

            <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs font-bold">Il tuo tempo ha valore.</div>
              <div className="mt-1 text-xs leading-5 text-white/35">
                Scegli un'attività in base al tempo che hai.
              </div>
            </div>
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080a0c]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => setSidebar(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-lg"
          >
            ☰
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <div className="text-sm font-black tracking-[0.22em]">FAIRREWARD</div>
            <div className="text-[8px] uppercase tracking-[0.3em] text-white/30">
              Il tuo tempo ha valore
            </div>
          </div>

          <button className="ml-auto flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <span className="hidden text-[10px] text-white/35 sm:inline">SALDO</span>
            <span className="text-sm font-black">€0,00</span>
          </button>
        </div>

        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            {["Home", "Attività", "Play", "Planner", "Wallet"].map((item, i) => (
              <button
                key={item}
                className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold ${
                  i === 0
                    ? "bg-white text-black"
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-7 pt-9 sm:px-6 lg:pt-12">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300/70">
              FAIRREWARD 2.0
            </div>

            <h1 className="max-w-2xl text-5xl font-black leading-[.9] tracking-[-.04em] sm:text-7xl">
              Hai tempo.
              <br />
              <span className="text-white/35">Guadagna.</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-6 text-white/45 sm:text-base">
              Scegli attività in base al tempo che hai e alla ricompensa che cerchi.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.035] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300/60">
              Planner
            </div>
            <div className="mt-2 text-xl font-black">
              Hai {time} minuti.
            </div>
            <div className="mt-1 text-sm text-white/40">
              Obiettivo: €{goal}
            </div>
            <button className="mt-4 w-full rounded-xl bg-emerald-400 py-3 text-sm font-black text-[#06100b]">
              Trova attività
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-[#101316] p-4 sm:p-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black">Quanto tempo hai?</span>
                <span className="text-[10px] text-white/30">TEMPO</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["5", "10", "30"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setTime(v)}
                    className={`rounded-xl border py-3 text-xs font-black ${
                      time === v
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/[0.03] text-white/50"
                    }`}
                  >
                    {v} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black">Quanto vuoi guadagnare?</span>
                <span className="text-[10px] text-white/30">OBIETTIVO</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["2", "5", "10"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setGoal(v)}
                    className={`rounded-xl border py-3 text-xs font-black ${
                      goal === v
                        ? "border-emerald-400 bg-emerald-400 text-[#06100b]"
                        : "border-white/10 bg-white/[0.03] text-white/50"
                    }`}
                  >
                    €{v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
              INVENTORY
            </div>
            <h2 className="mt-1 text-2xl font-black">Attività disponibili</h2>
          </div>
          <span className="text-xs text-white/30">{filtered.length} attività</span>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black ${
                filter === item
                  ? "border-white bg-white text-black"
                  : "border-white/10 bg-white/[0.03] text-white/45"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-[#111417] transition hover:border-emerald-400/25"
            >
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#20252a] via-[#15191d] to-[#0b0e10] p-5">
                <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[8px] font-black tracking-wider text-white/45">
                  {item.tag}
                </div>
                <div className="absolute bottom-5 left-5">
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300/60">
                    {item.type}
                  </div>
                  <h3 className="mt-1 max-w-[240px] text-lg font-black">{item.title}</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/30">
                      Ricompensa
                    </div>
                    <div className="mt-1 text-2xl font-black">{item.price}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-white/30">
                      Tempo
                    </div>
                    <div className="mt-1 text-sm font-black text-white/70">{item.time}</div>
                  </div>
                </div>

                <button className="mt-5 w-full rounded-xl bg-white py-3.5 text-xs font-black text-black transition hover:bg-emerald-400">
                  INIZIA
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-28 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#101316] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
              WALLET
            </div>
            <div className="mt-2 text-3xl font-black">€0,00</div>
            <div className="mt-1 text-xs text-white/35">Disponibile</div>
            <button className="mt-5 rounded-xl bg-emerald-400 px-6 py-3 text-xs font-black text-[#06100b]">
              INCASSA
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
              TRASPARENZA
            </div>
            <div className="mt-2 text-sm font-bold">Prima di iniziare sai cosa aspettarti.</div>
            <p className="mt-2 text-xs leading-5 text-white/35">
              Reward e tempo stimato vengono mostrati prima dell'attività.
              L'accredito avviene dopo la validazione del provider.
            </p>
          </div>
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#080a0c]/95 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-4 px-2 py-2">
          {[
            ["⌂", "Home"],
            ["✓", "Attività"],
            ["▦", "Planner"],
            ["€", "Wallet"],
          ].map(([icon, label], i) => (
            <button
              key={label}
              className={`flex flex-col items-center gap-1 py-1.5 text-[9px] font-black ${
                i === 0 ? "text-white" : "text-white/30"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
