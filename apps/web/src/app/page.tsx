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
  demo?: boolean;
  rewardEstimated: boolean;
  trackingLink: string | null;
};

type PlannedTask = {
  id: string;
  activityId: string;
  title: string;
  date: string;
};

type StartedActivity = { id: string; activityId: string; offerId: string; title: string; startedAt: string; status: string };
type ProviderActivity = { transactionId: string; title: string; status: string; amount: number; currency: string; createdAt: string | null };

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

function safeMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
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
    "Attività: ": "Tasks: ",
    "GALLERIA": "GALLERY",
    "VEDI VIDEO": "WATCH VIDEO",
    "Nessuna immagine disponibile": "No image available",
    "RESET FILTRI": "RESET FILTERS",
    "Hai modifiche ai filtri tempo/guadagno non ancora applicate.": "You have unapplied time/reward filter changes.",
    "✓ Filtri tempo/guadagno applicati": "✓ Time/reward filters applied",
    "Le categorie si aggiornano subito. Usa i filtri solo per tempo e guadagno.": "Categories update instantly. Use filters for time and reward.",
    "Nessuna ricompensa calcolabile per le offerte attualmente disponibili.": "No reward can currently be calculated for available offers.",
    "Fino a € ": "Up to € ",
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
  const [activeSection, setActiveSection] = useState<"Home" | "Attività" | "Play" | "Planner" | "Wallet" | "Le mie attività">("Home");
  const [startedActivities, setStartedActivities] = useState<StartedActivity[]>([]);
  const [providerActivities, setProviderActivities] = useState<ProviderActivity[]>([]);
  const [loadingMyActivities, setLoadingMyActivities] = useState(false);
  const [plannerDate, setPlannerDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [plannerOfferId, setPlannerOfferId] = useState("");
  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>([]);
  const [plannerLoaded, setPlannerLoaded] = useState(false);
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


  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("fairreward-planned-tasks");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPlannedTasks(parsed.filter((item): item is PlannedTask =>
            item && typeof item.id === "string" &&
            typeof item.activityId === "string" &&
            typeof item.title === "string" &&
            typeof item.date === "string"
          ));
        }
      }
    } catch {
      // Ignore malformed local planner data; the app remains usable.
    } finally {
      setPlannerLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!plannerLoaded) return;
    try {
      window.localStorage.setItem("fairreward-planned-tasks", JSON.stringify(plannedTasks));
    } catch {
      // Keep the planner usable if browser storage is unavailable.
    }
  }, [plannedTasks, plannerLoaded]);


  useEffect(() => {
    if (activeSection !== "Le mie attività") return;
    let cancelled = false;
    setLoadingMyActivities(true);
    try {
      const saved = window.localStorage.getItem("fairreward-started-activities");
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      if (!cancelled && Array.isArray(parsed)) setStartedActivities(parsed.filter((item): item is StartedActivity => item && typeof item.id === "string" && typeof item.title === "string" && typeof item.offerId === "string" && typeof item.startedAt === "string"));
    } catch { if (!cancelled) setStartedActivities([]); }
    fetch("/api/ayet/my-activities", { cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error("Unable to read provider conversions"); if (!cancelled) setProviderActivities(Array.isArray(data.activities) ? data.activities : []); })
      .catch(() => { if (!cancelled) setProviderActivities([]); })
      .finally(() => { if (!cancelled) setLoadingMyActivities(false); });
    return () => { cancelled = true; };
  }, [activeSection]);

  function addPlannedTask() {
    const activity = activities.find((item) => item.id === plannerOfferId);
    if (!activity || !plannerDate) return;
    setPlannedTasks((current) => [
      ...current,
      {
        id: `${Date.now()}-${activity.id}`,
        activityId: activity.id,
        title: activity.title,
        date: plannerDate,
      },
    ]);
  }

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

  async function linkExternalIdentity(accessToken: string) {
    try {
      const response = await fetch("/api/ayet/link-identity", {
        method: "POST",
        headers: { Authorization: \`Bearer \${accessToken}\` },
        cache: "no-store",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error("FairReward identity linking failed", data?.error ?? response.status);
      }
    } catch (error) {
      console.error("FairReward identity linking request failed", error);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadAuth() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const user = session?.user ?? null;

      if (!active) return;

      setAuthEmail(user?.email ?? null);

      if (user) {
        await loadWallet(user.id);
        if (session?.access_token) await linkExternalIdentity(session.access_token);
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
          if (session?.access_token) await linkExternalIdentity(session.access_token);
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
      if (data.session?.access_token) await linkExternalIdentity(data.session.access_token);
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

    let candidates = source;

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

    // Showing inventory must never hide real offers. The goal selector only
    // affects ordering: show all offers, with matching single-step rewards first.
    const rewarded = candidates
      .filter((activity) => activity.reward != null && activity.reward > 0 && !activity.timing.isMilestoneOrLongForm)
      .sort((a, b) => {
        if (appliedGoal == null) return (b.reward ?? 0) - (a.reward ?? 0);
        return Math.abs((a.reward ?? 0) - Number(appliedGoal)) -
          Math.abs((b.reward ?? 0) - Number(appliedGoal));
      });
    const rewardedIds = new Set(rewarded.map((activity) => activity.id));
    const otherOffers = candidates.filter((activity) => !rewardedIds.has(activity.id));
    return [...rewarded, ...otherOffers];
  }, [
    activities,
    filter,
    appliedTime,
    appliedGoal,
    filtersApplied,
  ]);

  function launchActivity(activity: Activity) {
    if (!activity.publish.ready) return;
    const item: StartedActivity = { id: `${activity.id}-${Date.now()}`, activityId: activity.id, offerId: activity.offerId, title: activity.title, startedAt: new Date().toISOString(), status: "Avviata · in attesa di conferma" };
    try {
      const saved = window.localStorage.getItem("fairreward-started-activities");
      const current: StartedActivity[] = saved ? JSON.parse(saved) : [];
      const next = [item, ...current.filter((entry) => entry.offerId !== activity.offerId)].slice(0, 100);
      window.localStorage.setItem("fairreward-started-activities", JSON.stringify(next));
      setStartedActivities(next);
    } catch { /* Do not block the provider redirect if storage is unavailable. */ }
    setLaunchingOffer(activity.id);
    window.location.assign(`/api/ayet/launch?offerId=${encodeURIComponent(activity.offerId)}`);
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
              {t("Il tuo tempo ha valore")}
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
              (item) => (
                <button
                  key={t(item)}
                  onClick={() => {
                    setActiveSection(item as "Home" | "Attività" | "Play" | "Planner" | "Wallet");
                    setSelectedActivity(null);
                    setMenuOpen(false);
                  }}
                  aria-current={activeSection === item ? "page" : undefined}
                  className={`shrink-0 rounded-xl border px-5 py-2.5 text-sm font-bold ${
                    activeSection === item
                      ? "border-fuchsia-400 bg-fuchsia-500"
                      : "border-cyan-400/15 bg-white/[0.025] text-white/75"
                  }`}
                >
                  {t(item)}
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
                  placeholder={language === "en" ? "Email" : "Email"}
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                />

                <input
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder={language === "en" ? "Password" : "Password"}
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
                    onClick={() => {
                      if (item === "Le mie attività") setActiveSection("Le mie attività");
                      else if (item === "Calendario") setActiveSection("Planner");
                      else if (item === "Profilo") setActiveSection("Wallet");
                      setMenuOpen(false);
                    }}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-white/80"
                  >
                    {t(item)}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {activeSection === "Home" && (
      <>
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
                  ? "border-emerald-300 bg-emerald-500 text-white"
                  : "border-red-400/60 bg-red-600 text-white"
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
                  ? "border-emerald-300 bg-emerald-500 text-white"
                  : "border-red-400/60 bg-red-600 text-white"
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
                  ? t("Hai modifiche ai filtri tempo/guadagno non ancora applicate.")
                  : filtersApplied
                    ? t("✓ Filtri tempo/guadagno applicati")
                    : t("Le categorie si aggiornano subito. Usa i filtri solo per tempo e guadagno.")}
              </div>

              {filtersApplied && rewardConfiguredCount === 0 && (
                <div className="mt-2 text-xs leading-5 text-amber-100/70">
                  {t("Nessuna ricompensa calcolabile per le offerte attualmente disponibili.")}
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
                {t("RESET FILTRI")}
              </button>

              <button
                onClick={() => {
                  setAppliedTime(timeEnabled ? time : null);
                  setAppliedGoal(goalEnabled ? goal : null);
                  setFiltersApplied(timeEnabled || goalEnabled);
                }}
                className="rounded-xl bg-white px-5 py-3 text-xs font-black text-black hover:bg-white/90"
              >
                {t("APPLICA FILTRI")}
              </button>
            </div>
          </div>
        </div>
      </section>

      </>
      )}

      {(activeSection === "Home" || activeSection === "Attività" || activeSection === "Play") && (
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
      )}

      {(activeSection === "Home" || activeSection === "Attività" || activeSection === "Play") && (
      <section
        id="inventory"
        className="mx-auto max-w-7xl px-4 pb-28"
      >
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/60">
              {t("INVENTARIO")}
            </div>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">
              {appliedGoal != null && appliedTime != null
                ? `${t("Percorso per circa € ")}${appliedGoal} · ${appliedTime} min`
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
              {t("Caricamento offerte ayeT…")}
            </div>
            <div className="mt-2 text-xs text-white/45">
              {t("Stiamo leggendo l'inventory reale.")}
            </div>
          </div>
        )}

        {!loadingOffers && offerError && (
          <div className="rounded-3xl border border-orange-400/30 bg-[#06132b] p-8">
            <div className="text-sm font-black text-orange-300">
              {t("Errore collegamento ayeT")}
            </div>
            <div className="mt-2 text-xs leading-5 text-white/45">
              {offerError}
            </div>
          </div>
        )}

        {!loadingOffers && !offerError && visible.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-[#06132b] p-8 text-center">
            <div className="text-sm font-black">
              {t("Nessuna offerta disponibile in questo momento.")}
            </div>
            <div className="mt-2 text-xs text-white/45">
              {t("Il collegamento ayeT risponde correttamente, ma l'inventory per questo contesto è vuota.")}
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

                  <div className="relative flex min-h-[250px] flex-col justify-between p-4 sm:p-5">
                    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-4 sm:grid-cols-[124px_minmax(0,1fr)]">
                      <div className="relative h-[112px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/20 via-[#0b1d3e] to-cyan-400/15 sm:h-[140px]">
                        {safeMediaUrl(item.media?.iconLarge || item.media?.icon) ? (
                          <img src={safeMediaUrl(item.media?.iconLarge || item.media?.icon) ?? undefined} alt={item.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 p-2 text-center">
                            <span className="text-3xl">{item.category === "Giochi" ? "🎮" : item.category === "Sondaggi" ? "📊" : item.category === "Video" ? "▶" : item.category === "Shopping" ? "🛍️" : item.category === "App" ? "📱" : "⚡"}</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/45">FAIRREWARD</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#020a1d]/80 to-transparent" />
                      </div>
                      <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <div
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${style.badge}`}
                        >
                          {t(item.category).toUpperCase()}
                        </div>

                        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black text-white/70">
                          {item.requirements.paymentRequired ? t("A PAGAMENTO") : t("GRATUITA")}
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
                          ? t("Percorso a più obiettivi · durata variabile")
                          : providerWindow != null
                            ? `${t("Tempo indicativo: ")}${Math.round(
                                providerWindow / 60,
                              ) < 60
                              ? `${Math.round(providerWindow / 60)} min`
                              : `${Math.round(providerWindow / 3600)} h`}`
                            : t("Tempistica non specificata")}
                      </div>
                    </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                          {t("RICOMPENSA")}
                        </div>
                        <div className={`mt-1 text-2xl font-black ${style.reward}`}>
                          {item.rewardLabel}
                        </div>

                        {item.rewardMode === "fairreward_estimate" && (
                          <div className="mt-1 max-w-[280px] text-[10px] leading-4 text-white/40">
                            {item.timing.isMilestoneOrLongForm
                              ? t("Valore potenziale della campagna; la ricompensa viene maturata attraverso più obiettivi.")
                              : t("Stima FairReward basata sul payout del provider.")}
                          </div>
                        )}

                        {item.rewardMode === "unavailable" && (
                          <div className="mt-1 max-w-[240px] text-[10px] leading-4 text-orange-300/75">
                            {t("Ricompensa non ancora configurata per questa integrazione.")}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedActivity(item)}
                          className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black text-white/80"
                        >
                          {t("DETTAGLI")}
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
                            ? t("APERTURA…")
                            : t("INIZIA")}
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
      )}


      {activeSection === "Le mie attività" && (
        <section className="mx-auto max-w-7xl px-4 pb-28 pt-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300/70">FAIRREWARD · STORICO</p>
          <h1 className="mt-2 text-3xl font-black">Le mie attività</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Qui trovi le offerte che hai avviato su questo dispositivo e le conversioni comunicate da ayeT. L'avvio non equivale a completamento o pagamento.</p>
          {loadingMyActivities && <div className="mt-5 rounded-2xl border border-white/10 bg-[#06132b] p-4 text-sm text-white/60">Aggiornamento dello storico…</div>}
          <div className="mt-5 grid gap-3">
            {providerActivities.map((item) => (
              <article key={item.transactionId} className="rounded-2xl border border-emerald-400/20 bg-[#06132b] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div className="font-bold">{item.title}</div><span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">{item.status}</span></div>
                <div className="mt-2 text-sm text-white/55">Conversione registrata dal partner{item.createdAt ? " · " + new Date(item.createdAt).toLocaleString(language === "it" ? "it-IT" : "en-GB") : ""}</div>
                <div className="mt-2 text-sm font-bold text-emerald-300">Importo comunicato: {item.amount.toLocaleString(language === "it" ? "it-IT" : "en-GB", { maximumFractionDigits: 2 })} {item.currency}</div>
              </article>
            ))}
            {startedActivities.map((item) => (
              <article key={item.id} className="rounded-2xl border border-cyan-400/20 bg-[#06132b] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div className="font-bold">{item.title}</div><span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300">{item.status}</span></div>
                <div className="mt-2 text-sm text-white/55">Avviata il {new Date(item.startedAt).toLocaleString(language === "it" ? "it-IT" : "en-GB")}. In attesa di conferma del partner.</div>
              </article>
            ))}
            {!loadingMyActivities && providerActivities.length === 0 && startedActivities.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#06132b] p-6 text-sm leading-6 text-white/60">Non risultano attività registrate. Se hai già svolto un'offerta in precedenza, potrebbe non essere stata tracciata o il partner potrebbe non aver ancora inviato la conversione: non la segniamo come completata senza conferma.</div>
            )}
          </div>
        </section>
      )}

      {activeSection === "Planner" && (
        <section className="mx-auto max-w-7xl px-4 pb-28 pt-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300/70">FAIRREWARD · PLANNER</p>
            <h1 className="mt-2 text-3xl font-black">Pianifica le tue attività</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Aggiungi le offerte disponibili ai giorni in cui vuoi provarle. Il planner viene salvato su questo dispositivo e non conferma il completamento né il pagamento di un'offerta.</p>
          </div>
          <div className="grid gap-4 rounded-3xl border border-cyan-400/20 bg-[#06132b] p-5 sm:grid-cols-[1fr_190px_auto] sm:items-end">
            <label className="block text-sm font-bold text-white/75">
              Offerta
              <select value={plannerOfferId} onChange={(event) => setPlannerOfferId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#020a1d] px-4 py-3 text-sm text-white">
                <option value="">Seleziona un'offerta</option>
                {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.title}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-white/75">
              Giorno
              <input type="date" value={plannerDate} onChange={(event) => setPlannerDate(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#020a1d] px-4 py-3 text-sm text-white" />
            </label>
            <button type="button" onClick={addPlannedTask} disabled={!plannerOfferId || !plannerDate} className="rounded-xl bg-fuchsia-500 px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40">Aggiungi al planner</button>
          </div>
          <div className="mt-6">
            <h2 className="mb-3 text-xl font-black">Le tue attività pianificate</h2>
            {plannedTasks.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#06132b] p-6 text-sm text-white/55">Non hai ancora pianificato attività. Seleziona un'offerta e una data qui sopra.</div>
            ) : (
              <div className="grid gap-3">
                {[...plannedTasks].sort((a, b) => a.date.localeCompare(b.date)).map((task) => (
                  <article key={task.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#06132b] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-bold">{task.title}</div>
                      <div className="mt-1 text-xs text-cyan-200/70">{new Date(task.date + "T12:00:00").toLocaleDateString(language === "it" ? "it-IT" : "en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</div>
                    </div>
                    <button type="button" onClick={() => setPlannedTasks((current) => current.filter((item) => item.id !== task.id))} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-white/65 hover:bg-white/[0.06]">Rimuovi</button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeSection === "Wallet" && (
        <section className="mx-auto max-w-7xl px-4 pb-28 pt-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-300/70">FAIRREWARD · WALLET</p>
            <h1 className="mt-2 text-3xl font-black">Il tuo Wallet</h1>
            <p className="mt-2 text-sm leading-6 text-white/60">Qui trovi il saldo associato al tuo account FairReward.</p>
          </div>
          <div className="max-w-xl rounded-3xl border border-fuchsia-400/25 bg-[#06132b] p-6">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-white/45">Saldo disponibile</div>
            {authEmail ? (
              <>
                <div className="mt-2 text-5xl font-black text-fuchsia-400">{walletLabel}</div>
                <div className="mt-3 break-all text-sm text-white/50">{authEmail}</div>
                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/60">Il saldo mostrato è quello letto dal tuo account. Le conversioni vengono accreditate solo dopo la conferma valida del partner.</div>
              </>
            ) : (
              <>
                <div className="mt-3 text-sm text-white/60">Accedi per visualizzare il saldo del tuo account.</div>
                <button type="button" onClick={() => setShowLogin(true)} className="mt-4 rounded-xl bg-fuchsia-500 px-5 py-3 text-sm font-black">Accedi</button>
              </>
            )}
          </div>
        </section>
      )}

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
                        {t(selectedActivity.category).toUpperCase()}
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

                  {(() => {
                    const mediaUrls = [
                      safeMediaUrl(selectedActivity.media?.iconLarge || selectedActivity.media?.icon),
                      ...(selectedActivity.media?.screenshots ?? []).map((url) => safeMediaUrl(url)),
                    ].filter((url): url is string => Boolean(url));
                    const videoUrl = safeMediaUrl(selectedActivity.media?.videoUrl);
                    const uniqueMediaUrls = [...new Set(mediaUrls)].slice(0, 5);
                    return (
                      <>
                        {uniqueMediaUrls.length > 0 ? (
                          <div className="mt-5">
                            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/70">{t("GALLERIA")}</div>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                              {uniqueMediaUrls.map((url, index) => (
                                <a key={url} href={url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                                  <img src={url} alt={selectedActivity.title + " " + (index + 1)} loading="lazy" referrerPolicy="no-referrer" className="aspect-square h-full w-full object-cover transition duration-200 group-hover:scale-105" />
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-white/40">{t("Nessuna immagine disponibile")}</div>
                        )}
                        {videoUrl && (
                          <a href={videoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-300/15">{t("VEDI VIDEO")} ↗</a>
                        )}
                      </>
                    );
                  })()}

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
                          ? "Ricompensa indicata dal provider per questo AdSlot."
                          : selectedActivity.rewardMode === "fairreward_estimate"
                            ? "Stima FairReward basata sui dati disponibili."
                            : "Ricompensa non disponibile."}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-400/15 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300/70">
                        {t("PAGAMENTO")}
                      </div>
                      <div className="mt-1 text-lg font-black">
                        {selectedActivity.requirements.paymentRequired
                          ? t("Richiesto dal partner")
                          : t("Nessun pagamento")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                        {t("DISPONIBILE SU")}
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
                        {t("CONVERSIONE")}
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
                      RICOMPENSA AYE T
                    </div>
                    <div className="mt-2 text-sm leading-6 text-white/65">
                      Importo indicato da ayeT per questo AdSlot. Le ricompense CPE
                      possono essere suddivise in tappe e sono soggette alla
                      validazione del partner.
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                      {t("COSA DEVI FARE")}
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
                      {t("CHIUDI")}
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
                      {t("INIZIA ATTIVITÀ")}
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
          ].map(([icon, label]) => (
            <button
              key={label}
              onClick={() => {
                setActiveSection(label as "Home" | "Attività" | "Planner" | "Wallet");
                setSelectedActivity(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-current={activeSection === label ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-3 text-xs font-black ${
                activeSection === label ? "text-fuchsia-400" : "text-white/55"
              }`}
            >
              <span className="text-lg">{icon}</span>
              {t(label)}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
