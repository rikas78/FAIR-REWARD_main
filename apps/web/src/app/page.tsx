"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { FairRewardActivity } from "@/lib/inventory/ayet";

type Filter =

  | "Tutte"
  | "Sondaggi"
  | "App"
  | "Video"
  | "Shopping"
  | "Micro-task"
  | "Giochi";

type Color = "pink" | "cyan" | "yellow" | "green" | "purple" | "orange";

type Activity = FairRewardActivity & {
  color: Color;
  rewardEstimated: boolean;
  trackingLink: string | null;
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
  const tags = offer.tags as
    | { tab?: unknown; tasks?: unknown[]; categories?: unknown[] }
    | undefined;

  const raw = `${offer.category ?? ""} ${offer.type ?? ""} ${offer.name ?? ""} ${
    tags?.tab ?? ""
  } ${(tags?.tasks ?? []).join(" ")} ${(tags?.categories ?? []).join(" ")}`
    .toLowerCase();

  if (raw.includes("game") || raw.includes("giochi")) return "Giochi";
  if (raw.includes("survey") || raw.includes("surveys")) return "Sondaggi";
  if (raw.includes("app")) return "App";
  if (raw.includes("video")) return "Video";
  if (raw.includes("shop")) return "Shopping";
  return "Micro-task";
}

function formatDuration(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.round(hours / 24);
  return `${days} gg`;
}

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&#x65;/gi, "e")
    .replace(/&amp;/gi, "&")
    .trim();
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 1 || value === "1";
}

function normalizeArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

export default function Home() {
  const [language, setLanguage] = useState<"it" | "en">("it");

  useEffect(() => {
    const saved = window.localStorage.getItem("fairreward-language");
    if (saved === "it" || saved === "en") setLanguage(saved);
  }, []);

  function changeLanguage(next: "it" | "en") {
    setLanguage(next);
    window.localStorage.setItem("fairreward-language", next);
  }

  const translations: Record<string, string> = {
    "Il tuo tempo ha valore": "Your time has value",
    "ACCEDI": "LOG IN",
    "Home": "Home",
    "Attività": "Tasks",
    "Play": "Play",
    "Planner": "Planner",
    "Wallet": "Wallet",
    "Profilo": "Profile",
    "Le mie attività": "My tasks",
    "Calendario": "Calendar",
    "Impostazioni": "Settings",
    "Account FairReward": "FairReward account",
    "Accedi": "Log in",
    "SALDO DISPONIBILE": "AVAILABLE BALANCE",
    "ESCI": "LOG OUT",
    "ACCESSO…": "LOGGING IN…",
    "Tutte": "All",
    "Sondaggi": "Surveys",
    "Micro-task": "Micro-tasks",
    "Giochi": "Games",
    "APPLICA FILTRI": "APPLY FILTERS",
    "INVENTARIO": "INVENTORY",
    "Tutte le attività": "All tasks",
    "Caricamento offerte ayeT…": "Loading ayeT offers…",
    "Stiamo leggendo l'inventory reale.": "Loading the live offer inventory.",
    "Errore collegamento ayeT": "ayeT connection error",
    "Nessuna offerta disponibile in questo momento.": "No offers available right now.",
    "Il collegamento ayeT risponde correttamente, ma l'inventory per questo contesto è vuota.": "The ayeT connection is responding, but there are no offers for this context.",
    "attività trovata": "task found",
    "attività trovate": "tasks found",
    "A PAGAMENTO": "PAID",
    "GRATUITA": "FREE",
    "Percorso a più obiettivi · durata variabile": "Multi-step campaign · variable duration",
    "Tempistica non specificata": "Timing not specified",
    "Tempo indicativo: ": "Estimated time: ",
    "RICOMPENSA": "REWARD",
    "Valore potenziale della campagna; la ricompensa viene maturata attraverso più obiettivi.": "Potential campaign value; rewards are earned by completing multiple milestones.",
    "Stima FairReward basata sul payout del provider.": "FairReward estimate based on the provider payout.",
    "Ricompensa non ancora configurata per questa integrazione.": "Reward not yet configured for this integration.",
    "DETTAGLI": "DETAILS",
    "APERTURA…": "OPENING…",
    "INIZIA": "START",
    "Chiudi": "Close",
    "PAGAMENTO": "PAYMENT",
    "Richiesto dal partner": "Required by partner",
    "Nessun pagamento": "No payment required",
    "DISPONIBILE SU": "AVAILABLE ON",
    "Non specificato": "Not specified",
    "CONVERSIONE": "CONVERSION",
    "Tipo: ": "Type: ",
    "Finestra massima provider:": "Provider maximum window:",
    "ECONOMIA FAIRREWARD": "FAIRREWARD ECONOMICS",
    "Costi provider: ": "Provider costs: ",
    "quota utente sul netto:": "user share of net revenue:",
    "quota utente sul lordo:": "user share of gross payout:",
    "COSA DEVI FARE": "WHAT YOU NEED TO DO",
    "Le istruzioni dettagliate saranno fornite dal partner.": "Detailed instructions will be provided by the partner.",
    "Richiede prenotazione": "Reservation required",
    "Nessuna prenotazione indicata": "No reservation indicated",
    "A pagamento": "Paid",
    "Gratuita": "Free",
    "CHIUDI": "CLOSE",
    "INIZIA ATTIVITÀ": "START TASK",
    "Errore durante il caricamento ayeT": "Error loading ayeT",
    "Errore durante il caricamento delle offerte": "Error loading offers",
    "Ricompensa non disponibile.": "Reward unavailable.",
    "Ricompensa non disponibile": "Reward unavailable",
    "Attività per circa € ": "Tasks for about € ",
    "Attività per circa ": "Tasks for about ",
    "Percorso per circa € ": "Plan for about € ",
    "Attività: ": "Tasks: "
  };

  const t = (value: string) =>
    language === "en" ? (translations[value] ?? value) : value;

  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("Tutte");
  const [time, setTime] = useState("10");
  const [goal, setGoal] = useState("5");
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [goalEnabled, setGoalEnabled] = useState(false);

  const [appliedTime, setAppliedTime] = useState<string | null>(null);
  const [appliedGoal, setAppliedGoal] = useState<string | null>(null);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [launchingOffer, setLaunchingOffer] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [walletCents, setWalletCents] = useState(0);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

        const mapped: Activity[] = Array.isArray(data?.activities)
          ? data.activities.map((activity: Activity, index: number) => ({
              ...activity,
              color: colors[index % colors.length],
            }))
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


  async function loadWallet(userId: string) {
    const { data, error } = await supabase
      .from("wallets")
      .select("available_cents")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setWalletCents(Number(data.available_cents ?? 0));
    }
  }

  useEffect(() => {
    let active = true;

    async function loadAuth() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;

      if (!active) return;

      setAuthEmail(user?.email ?? null);

      if (user) {
        await loadWallet(user.id);
      } else {
        setWalletCents(0);
      }
    }

    loadAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;

        if (!active) return;

        setAuthEmail(user?.email ?? null);

        if (user) {
          await loadWallet(user.id);
        } else {
          setWalletCents(0);
        }
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function login() {
    setAuthBusy(true);
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error) {
      setAuthError(error.message);
    } else if (data.user) {
      setAuthEmail(data.user.email ?? null);
      await loadWallet(data.user.id);
      setShowLogin(false);
      setLoginPassword("");
    }

    setAuthBusy(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setAuthEmail(null);
    setWalletCents(0);
  }

  const walletLabel =
    "€ " + (walletCents / 100).toFixed(2).replace(".", ",");

  const rewardConfiguredCount = useMemo(
    () =>
      activities.filter(
        (activity) => activity.reward != null && activity.reward > 0,
      ).length,
    [activities],
  );

  const pendingFilterChanges =
    (timeEnabled ? time : null) !== appliedTime ||
    (goalEnabled ? goal : null) !== appliedGoal;

  const visible = useMemo(() => {
    const source =
      filter === "Tutte"
        ? activities
        : activities.filter(
            (activity) => activity.category === filter,
          );

    let candidates = source.filter(
      (activity) =>
        activity.trackingLink != null &&
        !activity.requirements.paymentRequired,
    );

    if (appliedTime != null) {
      const targetSeconds = Number(appliedTime) * 60;

      // "5 minuti" is an approximate intent, not a hard upper limit.
      // For normal activities use the normalized duration. For CPE/game
      // campaigns use ayeT's provider conversion time as the closest
      // available indication, while the card explicitly explains that
      // the campaign is multi-step.
      const toleranceSeconds = Math.max(120, targetSeconds * 0.75);

      candidates = candidates
        .filter((activity) => {
          const seconds =
            activity.timing.activityDurationSeconds ??
            activity.timing.providerConversionSeconds;

          return (
            seconds != null &&
            Math.abs(seconds - targetSeconds) <= toleranceSeconds
          );
        })
        .sort((a, b) => {
          const aSeconds =
            a.timing.activityDurationSeconds ??
            a.timing.providerConversionSeconds ??
            Infinity;

          const bSeconds =
            b.timing.activityDurationSeconds ??
            b.timing.providerConversionSeconds ??
            Infinity;

          return (
            Math.abs(aSeconds - targetSeconds) -
            Math.abs(bSeconds - targetSeconds)
          );
        });
    }

    // The goal planner works with comparable single-step rewards only.
    // CPE/game/multi-step campaigns can show their potential value on the
    // card, but that total cannot be treated as one activity worth €X.
    const rewarded = candidates
      .filter(
        (activity) =>
          activity.reward != null &&
          activity.reward > 0 &&
          !activity.timing.isMilestoneOrLongForm,
      )
      .sort((a, b) => {
        const aReward = a.reward ?? 0;
        const bReward = b.reward ?? 0;

        if (appliedGoal == null) {
          return bReward - aReward;
        }

        return (
          Math.abs(aReward - Number(appliedGoal)) -
          Math.abs(bReward - Number(appliedGoal))
        );
      })
      .slice(0, 20);

    if (appliedGoal == null || rewarded.length === 0) {
      return candidates.slice(0, 20);
    }

    const target = Number(appliedGoal);

    let best: Activity[] = [];
    let bestScore = Number.POSITIVE_INFINITY;

    function score(selection: Activity[]): number {
      const total = selection.reduce(
        (sum: number, activity: Activity) =>
          sum + (activity.reward ?? 0),
        0,
      );

      const difference = Math.abs(total - target);
      const overshoot = Math.max(0, total - target);

      return difference + overshoot * 0.08 + selection.length * 0.002;
    }

    function visit(
      index: number,
      selection: Activity[],
      total: number,
    ): void {
      if (selection.length > 5) return;

      if (selection.length > 0) {
        const currentScore = score(selection);

        if (currentScore < bestScore) {
          bestScore = currentScore;
          best = [...selection];
        }
      }

      if (index >= rewarded.length) return;

      for (let i = index; i < rewarded.length; i += 1) {
        const reward = rewarded[i].reward ?? 0;
        const nextTotal = total + reward;

        if (nextTotal > target * 1.45) continue;

        selection.push(rewarded[i]);
        visit(i + 1, selection, nextTotal);
        selection.pop();
      }
    }

    visit(0, [], 0);

    return best.length ? best : rewarded.slice(0, 5);
  }, [
    activities,
    filter,
    appliedTime,
    appliedGoal,
    filtersApplied,
  ]);

  function launchActivity(activity: Activity) {
    if (!activity.publish.ready) return;

    setLaunchingOffer(activity.id);
    window.location.assign(
      `/api/ayet/launch?offerId=${encodeURIComponent(activity.offerId)}`,
    );
  }

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

          <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-cyan-400/20 bg-white/[0.04] p-1 text-[11px] font-black" aria-label="Language">
            <button type="button" onClick={() => changeLanguage("it")} aria-pressed={language === "it"} className={`rounded-md px-2 py-1 ${language === "it" ? "bg-fuchsia-500 text-white" : "text-white/60"}`}>IT</button>
            <button type="button" onClick={() => changeLanguage("en")} aria-pressed={language === "en"} className={`rounded-md px-2 py-1 ${language === "en" ? "bg-fuchsia-500 text-white" : "text-white/60"}`}>EN</button>
          </div>
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-2 text-sm font-black"
          >
            {authEmail ? walletLabel : t("ACCEDI")}
          </button>
          </div>
        </div>

        <div className="border-t border-cyan-400/10 bg-[#031029]">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2">
            {["Home", "Attività", "Play", "Planner", "Wallet"].map(
              (item, index) => (
                <button
                  key={t(item)}
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

      {showLogin && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="w-full max-w-md rounded-[28px] border border-fuchsia-400/25 bg-[#06132b] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-300/70">
                  ACCOUNT FAIRREWARD
                </div>
                <h2 className="mt-2 text-2xl font-black">
                  {authEmail ? t("Wallet") : t("Accedi")}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xl text-white/70"
              >
                ×
              </button>
            </div>

            {authEmail ? (
              <div className="mt-6">
                <div className="rounded-2xl border border-fuchsia-400/15 bg-white/[0.03] p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40">
                    SALDO DISPONIBILE
                  </div>

                  <div className="mt-1 text-4xl font-black text-fuchsia-400">
                    {walletLabel}
                  </div>

                  <div className="mt-3 text-xs text-white/45">
                    {authEmail}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-black text-white/70"
                >
                  ESCI
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <input
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="Email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                />

                <input
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="Password"
                  type="password"
                  autoComplete="current-password"
                  className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                />

                {authError && (
                  <div className="mt-3 rounded-xl border border-orange-400/30 bg-orange-400/[0.05] p-3 text-xs text-orange-200">
                    {authError}
                  </div>
                )}

                <button
                  type="button"
                  disabled={authBusy || !loginEmail || !loginPassword}
                  onClick={login}
                  className="mt-4 w-full rounded-xl bg-fuchsia-500 px-5 py-3 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {authBusy ? t("ACCESSO…") : t("ACCEDI")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
              Attività retribuite quando vuoi tu. Vedi prima le informazioni
              disponibili e la ricompensa prevista.
            </p>

            <button
              onClick={() =>
                document
                  .getElementById("inventory")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-6 w-fit rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-yellow-400 px-6 py-3.5 text-sm font-black shadow-lg shadow-fuchsia-500/20"
            >
              Scopri le attività →
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-3 px-4 pb-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-cyan-400/20 bg-[#06132b] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl text-cyan-400">◷</span>
              <span className="font-black">Quanto tempo hai?</span>
            </div>
            <button
              type="button"
              onClick={() => setTimeEnabled((value) => !value)}
              aria-pressed={timeEnabled}
              className={`rounded-full border px-3 py-2 text-[10px] font-black ${
                timeEnabled
                  ? "border-cyan-300 bg-cyan-400 text-[#06101f]"
                  : "border-white/10 bg-white/[0.04] text-white/45"
              }`}
            >
              {timeEnabled ? "ON" : "OFF"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["5", "10", "30"].map((value) => (
              <button
                key={value}
                onClick={() => setTime(value)}
                className={`rounded-xl border py-3 text-sm font-black ${
                  time === value
                    ? "border-fuchsia-400 bg-fuchsia-500 text-white"
                    : "border-cyan-400/15 bg-white/[0.025] text-white/75"
                }`}
              >
                {value} min
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-fuchsia-400/20 bg-[#06132b] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl text-fuchsia-400">◎</span>
              <span className="font-black">Quanto vuoi guadagnare?</span>
            </div>
            <button
              type="button"
              onClick={() => setGoalEnabled((value) => !value)}
              aria-pressed={goalEnabled}
              className={`rounded-full border px-3 py-2 text-[10px] font-black ${
                goalEnabled
                  ? "border-fuchsia-300 bg-fuchsia-500 text-white"
                  : "border-white/10 bg-white/[0.04] text-white/45"
              }`}
            >
              {goalEnabled ? "ON" : "OFF"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["2", "5", "10"].map((value) => (
              <button
                key={value}
                onClick={() => setGoal(value)}
                className={`rounded-xl border py-3 text-xs font-black ${
                  goal === value
                    ? "border-fuchsia-400 bg-fuchsia-500 text-white"
                    : "border-fuchsia-400/15 bg-white/[0.025] text-white/75"
                }`}
              >
                Fino a € {value}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#06132b] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold text-white/70">
                {pendingFilterChanges
                  ? "Hai modifiche ai filtri tempo/guadagno non ancora applicate."
                  : filtersApplied
                    ? "✓ Filtri tempo/guadagno applicati"
                    : "Le categorie si aggiornano subito. Usa i filtri solo per tempo e guadagno."}
              </div>

              {filtersApplied && rewardConfiguredCount === 0 && (
                <div className="mt-2 text-xs leading-5 text-amber-100/70">
                  Nessuna ricompensa calcolabile per le offerte attualmente
                  disponibili.
                </div>
              )}
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => {
                  setFilter("Tutte");
                  setTime("10");
                  setGoal("5");
                  setTimeEnabled(false);
                  setGoalEnabled(false);
                  setAppliedTime(null);
                  setAppliedGoal(null);
                  setFiltersApplied(false);
                }}
                className="rounded-xl border border-white/10 px-4 py-3 text-xs font-black text-white/60 hover:bg-white/[0.06]"
              >
                RESET FILTRI
              </button>

              <button
                onClick={() => {
                  setAppliedTime(timeEnabled ? time : null);
                  setAppliedGoal(goalEnabled ? goal : null);
                  setFiltersApplied(timeEnabled || goalEnabled);
                }}
                className="rounded-xl bg-white px-5 py-3 text-xs font-black text-black hover:bg-white/90"
              >
                APPLICA FILTRI
              </button>
            </div>
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
              {t(item)}
            </button>
          ))}
        </div>
      </section>

      <section
        id="inventory"
        className="mx-auto max-w-7xl px-4 pb-28"
      >
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/60">
              INVENTARIO
            </div>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">
              {appliedGoal != null && appliedTime != null
                ? `Plan for about € ${appliedGoal} · about ${appliedTime} min`
                : appliedGoal != null
                  ? `${t("Attività per circa € ")}${appliedGoal}`
                  : appliedTime != null
                    ? `${t("Attività per circa ")}${appliedTime} min`
                    : filter !== "Tutte"
                      ? `Attività: ${t(filter)}`
                      : "Tutte le attività"}
            </h2>
          </div>

          <span className="text-xs text-white/40">
            {loadingOffers
              ? "…"
              : `${visible.length} ${t(visible.length === 1 ? "attività trovata" : "attività trovate")}`}
          </span>
        </div>

        {loadingOffers && (
          <div className="rounded-3xl border border-cyan-400/20 bg-[#06132b] p-8 text-center">
            <div className="text-sm font-black">
              Caricamento offerte ayeT…
            </div>
            <div className="mt-2 text-xs text-white/45">
              Stiamo leggendo l&apos;inventory reale.
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
              Il collegamento ayeT risponde correttamente, ma l&apos;inventory
              per questo contesto è vuota.
            </div>
          </div>
        )}

        {!loadingOffers && !offerError && visible.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.map((item) => {
              const style = styles[item.color];
              const providerWindow = item.timing.providerConversionSeconds;

              return (
                <article
                  key={item.id}
                  className={`relative min-h-[250px] overflow-hidden rounded-3xl border ${style.border} bg-[#06132b]`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${style.glow} via-transparent to-transparent opacity-70`}
                  />

                  <div className="relative flex min-h-[250px] flex-col justify-between p-5">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <div
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${style.badge}`}
                        >
                          {item.category.toUpperCase()}
                        </div>

                        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black text-white/70">
                          {item.requirements.paymentRequired ? "A PAGAMENTO" : "GRATUITA"}
                        </div>
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        {item.title}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-sm text-white/55">
                        {item.subtitle}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.requirements.devices.slice(0, 5).map((device) => (
                          <span
                            key={device}
                            className="rounded-lg border border-cyan-400/10 bg-cyan-400/[0.04] px-2 py-1 text-[10px] font-bold text-cyan-100/75"
                          >
                            {device}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 text-xs text-white/45">
                        {item.timing.isMilestoneOrLongForm
                          ? "Percorso a più obiettivi · durata variabile"
                          : providerWindow != null
                            ? `Tempo indicativo: ${Math.round(
                                providerWindow / 60,
                              ) < 60
                              ? `${Math.round(providerWindow / 60)} min`
                              : `${Math.round(providerWindow / 3600)} h`}`
                            : "Tempistica non specificata"}
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                          RICOMPENSA
                        </div>
                        <div className={`mt-1 text-2xl font-black ${style.reward}`}>
                          {item.rewardLabel}
                        </div>

                        {item.rewardMode === "fairreward_estimate" && (
                          <div className="mt-1 max-w-[280px] text-[10px] leading-4 text-white/40">
                            {item.timing.isMilestoneOrLongForm
                              ? "Valore potenziale della campagna; la ricompensa viene maturata attraverso più obiettivi."
                              : "Stima FairReward basata sul payout del provider."}
                          </div>
                        )}

                        {item.rewardMode === "unavailable" && (
                          <div className="mt-1 max-w-[240px] text-[10px] leading-4 text-orange-300/75">
                            Ricompensa non ancora configurata per questa
                            integrazione.
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedActivity(item)}
                          className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black text-white/80"
                        >
                          DETTAGLI
                        </button>

                        <button
                          type="button"
                          disabled={!item.publish.ready}
                          onClick={() => launchActivity(item)}
                          className={`rounded-xl px-5 py-3 text-xs font-black ${
                            item.publish.ready
                              ? `${style.button} shadow-lg`
                              : "cursor-not-allowed bg-white/15 text-white/40"
                          }`}
                        >
                          {launchingOffer === item.id
                            ? "APERTURA…"
                            : "INIZIA"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedActivity && (
        <div
          className="fixed inset-0 z-[70] overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setSelectedActivity(null)}
        >
          <div
            className="mx-auto mt-8 max-w-2xl rounded-[28px] border border-fuchsia-400/25 bg-[#06132b] p-5 shadow-2xl sm:mt-16 sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const style = styles[selectedActivity.color];
              const providerWindow =
                selectedActivity.timing.providerConversionSeconds;
              const providerMaxWindow =
                selectedActivity.timing.providerMaxConversionSeconds;

              return (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${style.badge}`}
                      >
                        {selectedActivity.category.toUpperCase()}
                      </div>
                      <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                        {selectedActivity.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => setSelectedActivity(null)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xl text-white/70"
                      aria-label="Chiudi"
                    >
                      ×
                    </button>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-white/70">
                    {selectedActivity.description}
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-fuchsia-400/15 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-300/70">
                        RICOMPENSA
                      </div>
                      <div className={`mt-1 text-2xl font-black ${style.reward}`}>
                        {selectedActivity.rewardLabel}
                      </div>
                      <div className="mt-2 text-xs text-white/40">
                        {selectedActivity.rewardMode === "provider"
                          ? "Ricompensa fornita dalla configurazione valuta del provider."
                          : selectedActivity.rewardMode === "fairreward_estimate"
                            ? "Ricompensa calcolata dalle impostazioni economiche FairReward."
                            : "Ricompensa non disponibile."}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-400/15 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300/70">
                        PAGAMENTO
                      </div>
                      <div className="mt-1 text-lg font-black">
                        {selectedActivity.requirements.paymentRequired
                          ? "Richiesto dal partner"
                          : "Nessun pagamento"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                        DISPONIBILE SU
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedActivity.requirements.platforms.length ||
                        selectedActivity.requirements.devices.length ? (
                          [
                            ...new Set([
                              ...selectedActivity.requirements.platforms,
                              ...selectedActivity.requirements.devices,
                            ]),
                          ].map((item) => (
                            <span
                              key={item}
                              className="rounded-lg border border-cyan-400/10 bg-cyan-400/[0.04] px-2 py-1 text-xs font-bold text-cyan-100/80"
                            >
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-white/50">
                            Non specificato
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                        CONVERSIONE
                      </div>
                      <div className="mt-2 text-sm font-bold text-white/80">
                        Tipo: {selectedActivity.conversionType}
                      </div>
                      <div className="mt-1 text-sm text-white/55">
                        {selectedActivity.timing.isMilestoneOrLongForm
                          ? "Percorso a più obiettivi · durata variabile"
                          : providerWindow != null
                            ? `Tempo indicativo: ${Math.round(
                                providerWindow / 60,
                              ) < 60
                              ? `${Math.round(providerWindow / 60)} min`
                              : `${Math.round(providerWindow / 3600)} h`}`
                            : "Tempistica non specificata"}
                      </div>
                      {providerMaxWindow != null && (
                        <div className="mt-1 text-xs text-white/40">
                          Finestra massima provider:{" "}
                          {providerMaxWindow >= 86400
                            ? `${Math.round(providerMaxWindow / 86400)} gg`
                            : `${Math.round(providerMaxWindow / 3600)} h`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-fuchsia-400/10 bg-fuchsia-400/[0.02] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-300/60">
                      ECONOMIA FAIRREWARD
                    </div>
                    <div className="mt-2 text-sm leading-6 text-white/65">
                      Costi provider: {selectedActivity.economics.expensePercent}% ·
                      quota utente sul netto:{" "}
                      {selectedActivity.economics.userSharePercent}% ·
                      quota utente sul lordo:{" "}
                      {selectedActivity.economics.fairRewardSharePercent.toFixed(1)}%
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                      COSA DEVI FARE
                    </div>
                    <div className="mt-2 text-sm leading-6 text-white/70">
                      {selectedActivity.instructions ||
                        "Le istruzioni dettagliate saranno fornite dal partner."}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/65">
                      {selectedActivity.requirements.reservationRequired
                        ? "Richiede prenotazione"
                        : "Nessuna prenotazione indicata"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/65">
                      {selectedActivity.requirements.paymentRequired
                        ? "A pagamento"
                        : "Gratuita"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/65">
                      Provider: ayeT
                    </span>
                  </div>

                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      onClick={() => setSelectedActivity(null)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-black text-white/70"
                    >
                      CHIUDI
                    </button>

                    <button
                      disabled={!selectedActivity.publish.ready}
                      onClick={() => launchActivity(selectedActivity)}
                      className={`rounded-xl px-5 py-3 text-xs font-black ${
                        selectedActivity.publish.ready
                          ? style.button
                          : "cursor-not-allowed bg-white/15 text-white/40"
                      }`}
                    >
                      INIZIA ATTIVITÀ
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

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
