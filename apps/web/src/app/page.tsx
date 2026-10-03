"use client";

import { useState } from "react";

type Filter =
  | "Tutte"
  | "Sondaggi"
  | "App"
  | "Video"
  | "Shopping"
  | "Micro-task"
  | "Giochi";

const filters: Filter[] = [
  "Tutte",
  "Sondaggi",
  "App",
  "Video",
  "Shopping",
  "Micro-task",
  "Giochi",
];

const activities = [
  {
    category: "Sondaggi",
    color: "pink",
    title: "Survey Lifestyle",
    subtitle: "Rispondi a 8 domande",
    reward: "€ 2,50",
    time: "3 min",
  },
  {
    category: "App",
    color: "cyan",
    title: "Installa e prova",
    subtitle: "Nuova app partner",
    reward: "€ 4,00",
    time: "5 min",
  },
  {
    category: "Video",
    color: "yellow",
    title: "Guarda un video",
    subtitle: "Scopri nuovi contenuti",
    reward: "€ 1,20",
    time: "2 min",
  },
  {
    category: "Shopping",
    color: "green",
    title: "Offerta speciale",
    subtitle: "Acquista e guadagna",
    reward: "€ 8,00",
    time: "4 min",
  },
  {
    category: "Giochi",
    color: "purple",
    title: "Completa il livello",
    subtitle: "Raggiungi l'obiettivo",
    reward: "€ 5,00",
    time: "6 min",
  },
  {
    category: "Micro-task",
    color: "orange",
    title: "Mini-task rapido",
    subtitle: "Azioni semplici",
    reward: "€ 0,80",
    time: "1 min",
  },
] as const;

const styles = {
  pink: {
    border: "border-fuchsia-500/60",
    badge: "bg-fuchsia-500 text-white",
    button: "bg-fuchsia-500 hover:bg-fuchsia-400",
    reward: "text-fuchsia-400",
    glow: "from-fuchsia-500/30",
  },
  cyan: {
    border: "border-cyan-400/60",
    badge: "bg-cyan-400 text-[#06101f]",
    button: "bg-cyan-400 text-[#06101f] hover:bg-cyan-300",
    reward: "text-cyan-300",
    glow: "from-cyan-400/25",
  },
  yellow: {
    border: "border-yellow-400/60",
    badge: "bg-yellow-400 text-[#11100a]",
    button: "bg-yellow-400 text-[#11100a] hover:bg-yellow-300",
    reward: "text-yellow-300",
    glow: "from-yellow-400/25",
  },
  green: {
    border: "border-emerald-400/60",
    badge: "bg-emerald-400 text-[#06140d]",
    button: "bg-emerald-400 text-[#06140d] hover:bg-emerald-300",
    reward: "text-emerald-300",
    glow: "from-emerald-400/25",
  },
  purple: {
    border: "border-violet-500/60",
    badge: "bg-violet-500 text-white",
    button: "bg-violet-500 text-white hover:bg-violet-400",
    reward: "text-violet-300",
    glow: "from-violet-500/25",
  },
  orange: {
    border: "border-orange-400/60",
    badge: "bg-orange-400 text-[#1b0d00]",
    button: "bg-orange-400 text-[#1b0d00] hover:bg-orange-300",
    reward: "text-orange-300",
    glow: "from-orange-400/25",
  },
} as const;

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("Tutte");
  const [time, setTime] = useState("10");
  const [goal, setGoal] = useState("5");

  const visible =
    filter === "Tutte"
      ? activities
      : activities.filter((item) => item.category === filter);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020a1d] text-white">
      {/* TOP MENU */}
      <header className="sticky top-0 z-50 border-b border-cyan-400/10 bg-[#020a1d]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4">
          <button
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-white/[0.04] text-xl"
          >
            ☰
          </button>

          <div className="text-center">
            <div className="text-[17px] font-black tracking-[0.16em]">
              FAIR<span className="text-fuchsia-500">REWARD</span>
            </div>
            <div className="text-[9px] uppercase tracking-[0.26em] text-white/50">
              Il tuo tempo ha valore
            </div>
          </div>

          <div className="rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-2 text-sm font-black">
            € 0,00
          </div>
        </div>

        {/* SECOND MENU — SEMPRE DENTRO LA PAGINA */}
        <div className="border-t border-cyan-400/10 bg-[#031029]">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2">
            {["Home", "Attività", "Play", "Planner", "Wallet"].map(
              (item, index) => (
                <button
                  key={item}
                  className={`shrink-0 rounded-xl border px-5 py-2.5 text-sm font-bold ${
                    index === 0
                      ? "border-fuchsia-400 bg-fuchsia-500 text-white"
                      : "border-cyan-400/15 bg-white/[0.025] text-white/75"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>
      </header>

      {/* MENU APERTO: OVERLAY NELLA PAGINA, NON SIDEBAR */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/70"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute left-3 right-3 top-[80px] rounded-2xl border border-fuchsia-400/20 bg-[#06132b] p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["Profilo", "Le mie attività", "Calendario", "Impostazioni"].map(
                (item) => (
                  <button
                    key={item}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-white/80"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 pb-5 pt-5">
        <div className="relative min-h-[320px] overflow-hidden rounded-[28px] border border-fuchsia-500/30 bg-[#07132b]">
          <img
            src="/images/fairreward-v2-reference.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center opacity-85"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#020a1d] via-[#020a1d]/55 to-[#020a1d]/10" />

          <div className="relative z-10 flex min-h-[320px] max-w-xl flex-col justify-center px-6 py-9 sm:px-10">
            <div className="text-4xl font-black leading-[0.92] sm:text-6xl">
              IL TUO TEMPO
              <br />
              <span className="text-fuchsia-500">HA VALORE</span>
            </div>

            <p className="mt-5 max-w-md text-sm leading-6 text-white/80 sm:text-base">
              Attività retribuite quando vuoi tu. Vedi prima il tempo stimato e
              la ricompensa prevista.
            </p>

            <button className="mt-6 w-fit rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-yellow-400 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-fuchsia-500/20">
              Scopri le attività →
            </button>
          </div>
        </div>
      </section>

      {/* TEMPO / OBIETTIVO */}
      <section className="mx-auto grid max-w-7xl gap-3 px-4 pb-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-cyan-400/20 bg-[#06132b] p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-2xl text-cyan-400">◷</span>
            <span className="font-black">Quanto tempo hai?</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["5", "10", "30"].map((value) => (
              <button
                key={value}
                onClick={() => setTime(value)}
                className={`rounded-xl border py-3 text-sm font-black ${
                  time === value
                    ? "border-fuchsia-400 bg-fuchsia-500"
                    : "border-cyan-400/15 bg-white/[0.025] text-white/75"
                }`}
              >
                {value} min
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-fuchsia-400/20 bg-[#06132b] p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-2xl text-fuchsia-400">◎</span>
            <span className="font-black">Quanto vuoi guadagnare?</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {["2", "5", "10", "15", "20"].map((value) => (
              <button
                key={value}
                onClick={() => setGoal(value)}
                className={`rounded-xl border py-3 text-xs font-black ${
                  goal === value
                    ? "border-fuchsia-400 bg-fuchsia-500"
                    : "border-fuchsia-400/15 bg-white/[0.025] text-white/75"
                }`}
              >
                € {value}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECONDO MENU — FILTRI */}
      <section className="mx-auto max-w-7xl px-4 pb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-black ${
                filter === item
                  ? "border-fuchsia-400 bg-fuchsia-500"
                  : "border-cyan-400/15 bg-[#06132b] text-white/70"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* ATTIVITÀ */}
      <section className="mx-auto max-w-7xl px-4 pb-28">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/60">
              INVENTARIO
            </div>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">
              Attività per te
            </h2>
          </div>

          <button className="text-sm font-bold text-white/65">
            Vedi tutte →
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((item) => {
            const style = styles[item.color];

            return (
              <article
                key={item.title}
                className={`relative min-h-[210px] overflow-hidden rounded-3xl border ${style.border} bg-[#06132b]`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${style.glow} via-transparent to-transparent opacity-70`}
                />

                <div className="relative flex min-h-[210px] flex-col justify-between p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${style.badge}`}
                      >
                        {item.category.toUpperCase()}
                      </div>

                      <div className="mt-4 text-sm text-white/45">
                        {item.time}
                      </div>

                      <h3 className="mt-2 text-xl font-black">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm text-white/55">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div className={`text-3xl font-black ${style.reward}`}>
                      {item.reward}
                    </div>

                    <button
                      className={`rounded-xl px-6 py-3 text-xs font-black transition ${style.button}`}
                    >
                      INIZIA
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-cyan-400/15 bg-[#020a1d]/95 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-4">
          {[
            ["⌂", "Home"],
            ["◎", "Attività"],
            ["▦", "Planner"],
            ["▢", "Wallet"],
          ].map(([icon, label], index) => (
            <button
              key={label}
              className={`flex flex-col items-center gap-1 py-3 text-xs font-black ${
                index === 0 ? "text-fuchsia-400" : "text-white/55"
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
