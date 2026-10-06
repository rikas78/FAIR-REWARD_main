export type FairRewardActivity = {
  id: string;
  source: "ayet";
  provider: "ayeT";

  offerId: string;
  title: string;
  subtitle: string;
  description: string;
  instructions: string;

  category:
    | "Tutte"
    | "Sondaggi"
    | "App"
    | "Video"
    | "Shopping"
    | "Micro-task"
    | "Giochi";

  activityType: string;
  conversionType: string;

  reward: number | null;
  rewardMode: "provider" | "fairreward_estimate" | "unavailable";
  rewardLabel: string;

  economics: {
    providerPayout: number | null;
    expensePercent: number;
    userSharePercent: number;
    fairRewardSharePercent: number;
  };

  timing: {
    activityDurationSeconds: number | null;
    providerConversionSeconds: number | null;
    providerMaxConversionSeconds: number | null;
    isMilestoneOrLongForm: boolean;
  };

  requirements: {
    paymentRequired: boolean;
    reservationRequired: boolean;
    platforms: string[];
    devices: string[];
    countries: string[];
  };

  media: {
    icon: string | null;
    iconLarge: string | null;
    screenshots: string[];
    videoUrl: string | null;
  };

  links: {
    landingPage: string | null;
    supportUrl: string | null;
  };

  lifecycle: {
    status: string;
    available: boolean;
    priority: number;
    score: number | null;
    startDate: string | null;
    endDate: string | null;
  };

  publish: {
    ready: boolean;
    reason: string | null;
  };
};

function asString(value: unknown) {
  return String(value ?? "").trim();
}

function cleanText(value: unknown) {
  return asString(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&#x65;/gi, "e")
    .replace(/&amp;/gi, "&");
}

function asNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asBoolean(value: unknown) {
  return value === true || value === 1 || value === "1";
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function detectCategory(
  offer: Record<string, unknown>,
): FairRewardActivity["category"] {
  const tags = offer.tags as
    | {
        tab?: unknown;
        tasks?: unknown[];
        categories?: unknown[];
      }
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

function detectActivityType(
  offer: Record<string, unknown>,
  category: FairRewardActivity["category"],
) {
  const raw = `${offer.type ?? ""} ${offer.name ?? ""} ${
    offer.conversion_type ?? ""
  } ${offer.description ?? ""} ${offer.conversion_instructions ?? ""}`
    .toLowerCase();

  if (raw.includes("survey")) return "survey";
  if (raw.includes("install")) return "installazione";
  if (raw.includes("register") || raw.includes("registration")) {
    return "registrazione";
  }
  if (raw.includes("profile") || raw.includes("profil")) {
    return "profilazione";
  }
  if (raw.includes("video")) return "video";
  if (raw.includes("review")) return "review";
  if (raw.includes("test")) return "test";
  if (category === "Giochi") return "engagement";
  return category === "App" ? "engagement" : "micro-task";
}

export function normalizeAyeTOffer(
  offer: Record<string, unknown>,
): FairRewardActivity {
  // ayeT separates the provider payout from the user's virtual currency.
  // currency_amount is NOT EUR, so it must never be displayed as EUR.
  const providerPayout = asNumber(offer.payout_usd ?? offer.payout);

  // Keep FairReward economics out of the displayed reward until the
  // placement has an explicit configured EUR conversion.
  const expensePercent = 25;
  const userSharePercent = 50;
  const fairRewardSharePercent =
    (100 - expensePercent) * (userSharePercent / 100);

  const category = detectCategory(offer);
  const activityType = detectActivityType(offer, category);
  const conversionType = asString(offer.conversion_type) || "conversion";

  const providerConversionSeconds = asNumber(offer.conversion_time);
  const providerMaxConversionSeconds = asNumber(
    offer.max_conversion_time,
  );

  const isMilestoneOrLongForm =
    conversionType.toLowerCase() === "cpe" ||
    category === "Giochi" ||
    (providerMaxConversionSeconds ?? 0) > 86400 ||
    (providerConversionSeconds ?? 0) > 3600;

  // No EUR reward is shown until FairReward has an explicit,
  // configured conversion for this placement.
  const reward: number | null = null;
  const rewardMode: FairRewardActivity["rewardMode"] = "unavailable";
  const rewardLabel = "Ricompensa da configurare";

  const platforms = asArray(offer.platforms);
  const devices = asArray(offer.devices);
  const countries = asArray(offer.countries);

  const paymentRequired = asBoolean(offer.payment_required);
  const reservationRequired = asBoolean(offer.require_reservation);

  const instructions = cleanText(
    offer.conversion_instructions_long ??
      offer.conversion_instructions ??
      offer.conversion_instructions_short ??
      "",
  );

  const description = cleanText(
    offer.description ??
      offer.introduction ??
      "Attività disponibile.",
  );

  const offerId = asString(offer.id ?? offer.offer_id);

  const ready = Boolean(
    offerId &&
      asString(offer.name) &&
      typeof offer.tracking_link === "string" &&
      offer.tracking_link,
  );

  let reason: string | null = null;

  if (!offerId) {
    reason = "Offer ID mancante";
  } else if (!offer.tracking_link) {
    reason = "Tracking link mancante";
  }

  return {
    id: `ayet:${offerId}`,
    source: "ayet",
    provider: "ayeT",

    offerId,
    title: asString(offer.name) || "Offerta ayeT",
    // Keep provider-facing monetary wording out of the FairReward card.
    subtitle: "Attività disponibile secondo le condizioni del partner.",
    description,
    instructions,

    category,
    activityType,
    conversionType,

    reward,
    rewardMode,
    rewardLabel,

    economics: {
      providerPayout,
      expensePercent,
      userSharePercent,
      fairRewardSharePercent,
    },

    timing: {
      activityDurationSeconds: null,
      providerConversionSeconds,
      providerMaxConversionSeconds,
      isMilestoneOrLongForm,
    },

    requirements: {
      paymentRequired,
      reservationRequired,
      platforms,
      devices,
      countries,
    },

    media: {
      icon:
        typeof offer.icon === "string" && offer.icon
          ? offer.icon
          : null,
      iconLarge:
        typeof offer.icon_large === "string" && offer.icon_large
          ? offer.icon_large
          : null,
      screenshots: asArray(offer.screenshots),
      videoUrl:
        typeof offer.video_url === "string" && offer.video_url
          ? offer.video_url
          : null,
    },

    links: {
      landingPage:
        typeof offer.landing_page === "string" && offer.landing_page
          ? offer.landing_page
          : null,
      supportUrl:
        typeof offer.support_url === "string" && offer.support_url
          ? offer.support_url
          : null,
    },

    lifecycle: {
      status: asString(offer.offer_status) || "unknown",
      available: true,
      priority: asNumber(offer.priority) ?? 0,
      score: asNumber(offer.score),
      startDate:
        typeof offer.start_date === "string" ? offer.start_date : null,
      endDate:
        typeof offer.end_date === "string" ? offer.end_date : null,
    },

    publish: {
      ready,
      reason,
    },
  };
}

export function normalizeAyeTOffers(
  offers: Array<Record<string, unknown>>,
) {
  return offers.map(normalizeAyeTOffer);
}
