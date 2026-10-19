export type FairRewardActivity = {
  trackingLink: string | null;
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
    /** Publisher earnings in USD, available in callback data (not Offerwall API). */
    providerPayout: number | null;
  };

  timing: {
    activityDurationSeconds: number | null;
    activityDurationSource: "provider_conversion" | "unknown";
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
  // James confirmed that Offerwall API payout is the user-facing reward,
  // configured in EUR for this ad slot. payout_usd is publisher earnings
  // and is not exposed by the Offerwall API; currency_amount is callback-only.
  const providerReward = asNumber(offer.payout);
  const providerPayoutUsd = asNumber(offer.payout_usd);
  const providerPayoutName = cleanText(offer.payout_name);
  const calculatedReward =
    providerReward != null && providerReward > 0
      ? Math.round(providerReward * 100) / 100
      : null;

  const category = detectCategory(offer);
  const activityType = detectActivityType(offer, category);
  const conversionType = asString(offer.conversion_type) || "conversion";

  const providerConversionSeconds = asNumber(offer.conversion_time);
  const providerMaxConversionSeconds = asNumber(
    offer.max_conversion_time,
  );

  // CPE campaigns and game campaigns can contain multiple milestones.
  // ayeT may expose conversion_time=300 for the campaign entry even though
  // the campaign contains several tasks spread over a much longer window.
  // Therefore that raw provider value must NOT be treated as the duration
  // of one user activity.
  const isMilestoneOrLongForm =
    conversionType.toLowerCase() === "cpe" ||
    category === "Giochi" ||
    (providerMaxConversionSeconds ?? 0) > 86400 ||
    (providerConversionSeconds ?? 0) > 3600;

  // The top-level payout is the total user-facing reward. For CPE offers,
  // per-milestone payouts are displayed in the instructions below.
  const reward: number | null = calculatedReward;

  const rewardMode: FairRewardActivity["rewardMode"] =
    calculatedReward != null ? "provider" : "unavailable";

  const rewardLabel = calculatedReward != null
    ? isMilestoneOrLongForm
      ? `Fino a € ${calculatedReward.toFixed(2)}`
      : `€ ${calculatedReward.toFixed(2)}`
    : providerPayoutName
      ? `ayeT: ${providerPayoutName}`
      : "Ricompensa non disponibile";

  const platforms = asArray(offer.platforms);
  const devices = asArray(offer.devices);
  const countries = asArray(offer.countries);

  const paymentRequired = asBoolean(offer.payment_required);
  const reservationRequired = asBoolean(offer.require_reservation);

  const instructionsBase = cleanText(
    offer.conversion_instructions_long ??
      offer.conversion_instructions ??
      offer.conversion_instructions_short ??
      "",
  );
  const cpeMilestones = Array.isArray(offer.cpe_instructions)
    ? offer.cpe_instructions
        .map((item, index) => {
          if (!item || typeof item !== "object") return null;
          const milestone = item as Record<string, unknown>;
          const amount = asNumber(milestone.payout);
          if (amount == null || amount <= 0) return null;
          const label = cleanText(
            milestone.name ??
              milestone.title ??
              milestone.description ??
              milestone.instruction ??
              `Tappa ${index + 1}`,
          );
          return `${label}: € ${amount.toFixed(2)}`;
        })
        .filter((item): item is string => Boolean(item))
    : [];
  const instructions = [
    instructionsBase,
    cpeMilestones.length
      ? `Ricompense per tappa (incluse nel totale): ${cpeMilestones.join(" · ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

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
      offer.tracking_link &&
      calculatedReward != null,
  );

  let reason: string | null = null;

  if (!offerId) {
    reason = "Offer ID mancante";
  } else if (!offer.tracking_link) {
    reason = "Tracking link mancante";
  } else if (calculatedReward == null) {
    reason = "Ricompensa non disponibile";
  }

  return {
    trackingLink: typeof offer.tracking_link === "string" ? offer.tracking_link : null,
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
      providerPayout: providerPayoutUsd,
    },

    timing: {
      // For long-form/CPE campaigns the provider conversion_time is not
      // comparable with a single-task "about N minutes" filter.
      activityDurationSeconds: isMilestoneOrLongForm
        ? null
        : providerConversionSeconds,
      activityDurationSource:
        !isMilestoneOrLongForm && providerConversionSeconds != null
          ? "provider_conversion"
          : "unknown",
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
  const normalized = offers.map(normalizeAyeTOffer);
  const unique = new Map<string, FairRewardActivity>();
  for (const offer of normalized) {
    // ayeT may return the same offer more than once in a single inventory response.
    // Keep one card per stable provider offer ID.
    if (!unique.has(offer.id)) unique.set(offer.id, offer);
  }
  return [...unique.values()];
}
