"use client";

import { useEffect, useMemo, useState } from "react";

type Filter =
  | "Tutte"
  | "Sondaggi"
  | "App"
  | "Video"
  | "Shopping"
  | "Micro-task"
  | "Giochi";

type Color = "pink" | "cyan" | "yellow" | "green" | "purple" | "orange";

type Activity = {
  id: string;
  category: Filter;
  color: Color;
  title: string;
  subtitle: string;
  reward: number;
  conversionTime: number | null;
};

const filters: Filter[] = [
  "Tutte",
  "Sondaggi",
  "App",
  "Video",
  "Shopping",
  "Micro-task",
  "Giochi",
];

const styles: Record<
  Color,
  {
    border: string;
    badge: string;
    button: string;
    reward: string;
    glow: string;
  }
> = {
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
    button: "bg-violet-500 hover:bg-violet-400",
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
};

function detectCategory(offer: Record<string, unknown>): Filter {
  const raw = `${offer.category ?? ""} ${offer.type ?? ""} ${offer.name ?? ""}`
    .toLowerCase();

  if (raw.includes("survey")) return "Sondaggi";
  if (raw.includes("app")) return "App";
  if (raw.includes("video")) return "Video";
  if (raw.includes("shop")) return "Shopping";
  if (raw.includes("game")) return "Giochi";
  return "Micro-task";
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("Tutte");
  const [time, setTime] = useState("10");
  const [goal, setGoal] = useState("5");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [offerError, setOfferError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOffers() {
      try {
        setLoadingOffers(true);
        setOfferError(null);

        const response = await fetch("/api/ayet/offers", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? "Errore durante il caricamento ayeT");
        }

        const colors: Color[] = [
          "pink",
          "cyan",
          "yellow",
          "green",
          "purple",
          "orange",
        ];

        const mapped: Activity[] = Array.isArray(data?.offers)
          ? data.offers.map(
              (offer: Record<string, unknown>, index: number) => ({
                id: String(offer.id ?? offer.offer_id ?? index),
                category: detectCategory(offer),
                color: colors[index % colors.length],
                title: String(offer.name ?? offer.title ?? "Offerta ayeT"),
                subtitle: String(
                  offer.description ?? "Attività disponibile",
                ),
                reward: Number(
                  offer.currency_amount ?? offer.payout ?? 0,
                ),
                conversionTime:
                  offer.conversion_time == null
                    ? null
                    : Number(offer.conversion_time),
              }),
            )
          : [];

        if (!cancelled) {
          setActivities(mapped);
        }
      } catch (error) {
        if (!cancelled) {
          setOfferError(
            error instanceof Error
              ? error.message
              : "Errore durante il caricamento delle offerte",
          );
          setActivities([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingOffers(false);
        }
      }
    }

    loadOffers();

    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (filter === "Tutte") return activities;
    return activities.filter((activity) => activity.category === filter);
  }, [activities, filter]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020a1d] text-white">
      <header className="sticky top-0 z-50 border-b border-cyan-400/10 bg-[#020a1d]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4">
          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-white/[0.04] text-xl"
            aria-label="Menu"
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

        <div className="border-t border-cyan-400/10 bg-[#031029]">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2">
            {["Home", "Attività", "Play", "Planner", "Wallet"].map(
              (item, index) => (
                <button
                  key={item}
                  className={`shrink-0 rounded-xl border px-5 py-2.5 text-sm font-bold ${
                    index === 0
                      ? "border-fuchsia-400 bg-fuchsia-500"
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
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-white/80"
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-5 pt-5">
        <div className="relative min-h-[320px] overflow-hidden rounded-[28px] border border-fuchsia-500/30 bg-[#07132b]">
          <img
            src="/images/fairreward-v2-reference.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center opacity-85"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#020a1d] via-[#020a1d]/55 to-[#020a1d]/10" />

          <div className="relative z-10 flex min-h-[320px] max-w-xl flex-col justify-center px-6 py-9">
            <div className="text-4xl font-black leading-[0.92] sm:text-6xl">
              IL TUO TEMPO
              <br />
              <span className="text-fuchsia-500">HA VALORE</span>
            </div>

            <p className="mt-5 max-w-md text-sm leading-6 text-white/80">
              Attività retribuite quando vuoi tu. Vedi prima il tempo stimato e
              la ricompensa prevista.
            </p>

            <button className="mt-6 w-fit rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-yellow-400 px-6 py-3.5 text-sm font-black shadow-lg shadow-fuchsia-500/20">
              Scopri le attività →
            </button>
          </div>
        </div>
      </section>

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

          <span className="text-xs text-white/40">
            {loadingOffers ? "…" : `${visible.length} offerte`}
          </span>
        </div>

        {loadingOffers && (
          <div className="rounded-3xl border border-cyan-400/20 bg-[#06132b] p-8 text-center">
            <div className="text-sm font-black">
              Caricamento offerte ayeT…
            </div>
            <div className="mt-2 text-xs text-white/45">
              Stiamo leggendo l'inventory reale.
            </div>
          </div>
        )}

        {!loadingOffers && offerError && (
          <div className="rounded-3xl border border-orange-400/30 bg-[#06132b] p-8">
            <div className="text-sm font-black text-orange-300">
              Errore collegamento ayeT
            </div>
            <div className="mt-2 text-xs leading-5 text-white/45">
              {offerError}
            </div>
          </div>
        )}

        {!loadingOffers && !offerError && visible.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-[#06132b] p-8 text-center">
            <div className="text-sm font-black">
              Nessuna offerta disponibile in questo momento.
            </div>
            <div className="mt-2 text-xs text-white/45">
              Il collegamento ayeT risponde correttamente, ma l'inventory per
              questo contesto è vuota.
            </div>
          </div>
        )}

        {!loadingOffers && !offerError && visible.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.map((item) => {
              const style = styles[item.color];

              return (
                <article
                  key={item.id}
                  className={`relative min-h-[210px] overflow-hidden rounded-3xl border ${style.border} bg-[#06132b]`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${style.glow} via-transparent to-transparent opacity-70`}
                  />

                  <div className="relative flex min-h-[210px] flex-col justify-between p-5">
                    <div>
                      <div
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${style.badge}`}
                      >
                        {item.category.toUpperCase()}
                      </div>

                      <div className="mt-4 text-sm text-white/45">
                        {item.conversionTime != null
                          ? `Tempo stimato: ${item.conversionTime} min`
                          : "Tempo variabile"}
                      </div>

                      <h3 className="mt-2 text-xl font-black">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm text-white/55">
                        {item.subtitle}
                      </p>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div className={`text-3xl font-black ${style.reward}`}>
                        € {item.reward.toFixed(2)}
                      </div>

                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-xl bg-white/15 px-6 py-3 text-xs font-black text-white/50"
                      >
                        INIZIA
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

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
