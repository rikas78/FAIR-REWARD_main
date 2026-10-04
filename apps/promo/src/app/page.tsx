"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildGoalPlan,
  getEstimatedReward,
  type GoalPlan,
  type PromoOffer,
} from "@/lib/goal-planner";

type Color = "pink" | "cyan" | "yellow";

const colors: Color[] = ["pink", "cyan", "yellow"];

const theme = {
  pink: {
    border: "border-fuchsia-500/60",
    badge: "bg-fuchsia-500 text-white",
    button: "bg-fuchsia-500 hover:bg-fuchsia-400",
    reward: "text-fuchsia-400",
  },
  cyan: {
    border: "border-cyan-400/60",
    badge: "bg-cyan-400 text-[#06101f]",
    button: "bg-cyan-400 text-[#06101f] hover:bg-cyan-300",
    reward: "text-cyan-300",
  },
  yellow: {
    border: "border-yellow-400/60",
    badge: "bg-yellow-400 text-[#11100a]",
    button: "bg-yellow-400 text-[#11100a] hover:bg-yellow-300",
    reward: "text-yellow-300",
  },
};

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&#x65;/gi, "e")
    .replace(/&amp;/gi, "&")
    .trim();
}

function formatReward(value: number) {
  return `€ ${value.toFixed(2).replace(".", ",")}`;
}

function formatTime(seconds: unknown) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return "Tempo variabile";

  const minutes = Math.round(value / 60);

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.round(minutes / 60);

  if (hours < 24) return `${hours} h`;

  return `${Math.round(hours / 24)} gg`;
}

function deviceList(offer: PromoOffer) {
  return [
    ...(Array.isArray(offer.devices) ? offer.devices : []),
    ...(Array.isArray(offer.platforms) ? offer.platforms : []),
  ].filter(Boolean);
}

export default function PromoHome() {
  const [goal, setGoal] = useState(5);
  const [offers, setOffers] = useState<PromoOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PromoOffer | null>(null);
  const [launching, setLaunching] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/ayet/offers", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? "Impossibile leggere le attività.");
        }

        if (!cancelled) {
          setOffers(Array.isArray(data?.offers) ? data.offers : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Errore durante il caricamento delle attività.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const eligibleOffers = useMemo(
    () =>
      offers.filter(
        (offer) =>
          getEstimatedReward(offer) > 0 &&
          offer.payment_required !== true &&
          offer.payment_required !== 1 &&
          typeof offer.tracking_link === "string" &&
          offer.tracking_link.length > 0,
      ),
    [offers],
  );

  const plan: GoalPlan = useMemo(
    () => buildGoalPlan(eligibleOffers, goal),
    [eligibleOffers, goal],
  );

  function launch(offer: PromoOffer) {
    const offerId = String(offer.id ?? offer.offerId ?? "");

    if (!offerId) return;

    setLaunching(offerId);
    window.location.assign(
      `/api/ayet/launch?offerId=${encodeURIComponent(offerId)}`,
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020a1d] text-white">
      <header className="border-b border-cyan-400/10 bg-[#020a1d]/95">
        <div className="mx-auto flex h-[76px] max-w-5xl items-center justify-between px-5">
          <div>
            <div className="text-lg font-black tracking-[0.16em]">
              FAIR<span className="text-fuchsia-500">REWARD</span>
            </div>
            <div className="text-[9px] uppercase tracking-[0.28em] text-white/45">
              Il tuo tempo ha valore
            </div>
          </div>

          <div className="rounded-xl border border-fuchsia-500/35 bg-fuchsia-500/10 px-3 py-2 text-xs font-black">
            PROMO
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-8 pt-7">
        <div className="relative overflow-hidden rounded-[30px] border border-fuchsia-500/30 bg-[#07132b] p-7 sm:p-10">
          <img
            src="/images/fairreward-v2-reference.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020a1d] via-[#020a1d]/85 to-[#020a1d]/35" />

          <div className="relative max-w-2xl">
            <div className="text-4xl font-black leading-[0.95] sm:text-6xl">
              IL TUO TEMPO
              <br />
              <span className="text-fuchsia-500">HA VALORE</span>
            </div>

            <p className="mt-5 text-base leading-7 text-white/75">
              Scegli quanto vuoi guadagnare. FairReward compone il percorso
              usando le attività realmente disponibili in questo momento.
            </p>

            <p className="mt-3 text-sm leading-6 text-white/50">
              L&apos;obiettivo è indicativo: il totale può essere leggermente
              inferiore o superiore, perché l&apos;inventory cambia nel tempo.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-6">
        <div className="rounded-3xl border border-fuchsia-400/20 bg-[#06132b] p-5">
          <div className="mb-4 text-sm font-black">
            Quanto vuoi guadagnare circa?
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[2, 5, 10].map((value) => (
              <button
                key={value}
                onClick={() => setGoal(value)}
                className={`rounded-2xl border py-4 text-sm font-black transition ${
                  goal === value
                    ? "border-fuchsia-400 bg-fuchsia-500"
                    : "border-cyan-400/15 bg-white/[0.025] text-white/75"
                }`}
              >
                ≈ € {value}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-7">
        <div className="rounded-3xl border border-cyan-400/20 bg-[#06132b] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/60">
                PERCORSO CONSIGLIATO
              </div>
              <h1 className="mt-1 text-2xl font-black">
                Circa {formatReward(goal)}
              </h1>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                Risultato disponibile ora
              </div>
              <div className="mt-1 text-3xl font-black text-fuchsia-400">
                {formatReward(plan.total)}
              </div>
              <div className="mt-1 text-xs text-white/45">
                {plan.difference === 0
                  ? "Perfettamente centrato"
                  : plan.difference > 0
                    ? `€ ${plan.difference.toFixed(2)} sopra l'obiettivo`
                    : `€ ${Math.abs(plan.difference).toFixed(2)} sotto l'obiettivo`}
              </div>
            </div>
          </div>

          <div className="mt-5">
            {loading && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/55">
                Stiamo leggendo l&apos;inventory reale disponibile adesso…
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-orange-400/30 bg-orange-400/[0.04] p-6 text-sm text-orange-200">
                {error}
              </div>
            )}

            {!loading && !error && !plan.offers.length && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="font-black">
                  Al momento non troviamo una combinazione disponibile per
                  questo obiettivo.
                </div>
                <div className="mt-2 text-sm text-white/45">
                  L&apos;inventory cambia continuamente. Prova un altro
                  obiettivo.
                </div>
              </div>
            )}

            {!loading && !error && plan.offers.length > 0 && (
              <div className="grid gap-3">
                {plan.offers.map((offer, index) => {
                  const color = theme[colors[index % colors.length]];

                  return (
                    <div
                      key={String(offer.id)}
                      className={`flex flex-col gap-4 rounded-2xl border ${color.border} bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between`}
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white/35">
                          ATTIVITÀ {index + 1}
                        </div>

                        <div className="mt-1 text-lg font-black">
                          {String(offer.name ?? offer.title ?? "Attività")}
                        </div>

                        <div className="mt-1 line-clamp-2 text-sm text-white/50">
                          {clean(offer.description) ||
                            "Dettagli disponibili nella scheda attività."}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {deviceList(offer)
                            .slice(0, 6)
                            .map((device) => (
                              <span
                                key={`${offer.id}-${device}`}
                                className="rounded-lg border border-cyan-400/10 bg-cyan-400/[0.04] px-2 py-1 text-[10px] font-bold text-cyan-100/70"
                              >
                                {device}
                              </span>
                            ))}
                          <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/50">
                            {formatTime(offer.conversion_time)}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <div
                          className={`text-2xl font-black ${color.reward}`}
                        >
                          {formatReward(getEstimatedReward(offer))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelected(offer)}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-white/70"
                          >
                            DETTAGLI
                          </button>
                          <button
                            disabled={!offer.tracking_link || !offer.id}
                            onClick={() => launch(offer)}
                            className={`rounded-xl px-5 py-3 text-xs font-black ${color.button}`}
                          >
                            {launching === String(offer.id)
                              ? "APERTURA…"
                              : "INIZIA"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-5 text-white/45">
            Il valore mostrato è una previsione della ricompensa FairReward
            basata sull&apos;inventory disponibile. L&apos;importo definitivo
            viene determinato dalla conversione effettivamente riconosciuta
            dal provider.
          </div>
        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="mx-auto mt-10 max-w-2xl rounded-[28px] border border-fuchsia-400/25 bg-[#06132b] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex rounded-full bg-fuchsia-500 px-3 py-1 text-[10px] font-black">
                  ATTIVITÀ
                </div>
                <h2 className="mt-3 text-2xl font-black">
                  {String(selected.name ?? selected.title ?? "Attività")}
                </h2>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xl text-white/65"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/65">
              {clean(selected.description) ||
                "Descrizione non disponibile."}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-fuchsia-400/15 bg-white/[0.03] p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-fuchsia-300/60">
                  RICOMPENSA PREVISTA
                </div>
                <div className="mt-1 text-2xl font-black text-fuchsia-400">
                  {formatReward(getEstimatedReward(selected))}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/15 bg-white/[0.03] p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-300/60">
                  COSTO
                </div>
                <div className="mt-1 text-lg font-black">
                  {selected.payment_required
                    ? "Richiede pagamento"
                    : "Nessun pagamento"}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40">
                DISPONIBILE SU
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {deviceList(selected).length ? (
                  [...new Set(deviceList(selected))].map((device) => (
                    <span
                      key={device}
                      className="rounded-lg border border-cyan-400/10 bg-cyan-400/[0.04] px-2 py-1 text-xs font-bold text-cyan-100/70"
                    >
                      {device}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-white/45">
                    Non specificato
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40">
                TEMPISTICA
              </div>
              <div className="mt-2 text-sm text-white/65">
                Indicatore provider: {formatTime(selected.conversion_time)}
              </div>
              {selected.max_conversion_time && (
                <div className="mt-1 text-xs text-white/40">
                  Finestra massima: {formatTime(selected.max_conversion_time)}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-black text-white/70"
              >
                CHIUDI
              </button>

              <button
                onClick={() => launch(selected)}
                className="rounded-xl bg-fuchsia-500 px-5 py-3 text-xs font-black hover:bg-fuchsia-400"
              >
                INIZIA ATTIVITÀ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
