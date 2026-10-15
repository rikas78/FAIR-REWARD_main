import { NextRequest, NextResponse } from "next/server";
import {
  normalizeAyeTOffers,
  type FairRewardActivity,
} from "@/lib/inventory/ayet";

const AYeT_ADSLOT_ID = process.env.AYET_ADSLOT_ID || "29639";
const AYeT_PLACEMENT_ID = process.env.AYET_PLACEMENT_ID || "24935";
const AYeT_BASE_URL = "https://www.ayetstudios.com";

function summarizeProviderFields(offers: unknown) {
  const list = Array.isArray(offers)
    ? (offers as Array<Record<string, unknown>>)
    : [];

  const num = (v: unknown) =>
    v !== null &&
    v !== undefined &&
    v !== "" &&
    Number.isFinite(Number(v));

  return {
    offers: list.length,
    payout_usd: list.filter((o) => num(o.payout_usd)).length,
    payout: list.filter((o) => num(o.payout)).length,
    payout_name: list.filter(
      (o) => typeof o.payout_name === "string" && o.payout_name.trim() !== "",
    ).length,
    payout_base: list.filter((o) => num(o.payout_base)).length,
    currency_amount_positive: list.filter(
      (o) => num(o.currency_amount) && Number(o.currency_amount) > 0,
    ).length,
    conversion_time: list.filter((o) => num(o.conversion_time)).length,
    tracking_link: list.filter(
      (o) =>
        typeof o.tracking_link === "string" &&
        o.tracking_link !== "",
    ).length,
  };
}


function resolveExternalIdentifier(request: NextRequest) {
  const existing = request.cookies.get("fr_ext_id")?.value;

  if (existing && /^fr_[0-9a-f-]{36}$/.test(existing)) {
    return { externalIdentifier: existing, setCookie: false };
  }

  return {
    externalIdentifier: `fr_${crypto.randomUUID()}`,
    setCookie: true,
  };
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "";
}

async function getDevelopmentIp() {
  const response = await fetch("https://api.ipify.org?format=json", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to resolve development public IP");
  }

  const data = (await response.json()) as { ip?: string };

  if (!data.ip) {
    throw new Error("Development public IP missing");
  }

  return data.ip;
}

export async function GET(request: NextRequest) {
  try {
    // Demo fixtures are available only on local development or Vercel Preview,
    // and only when explicitly requested with ?demo=1. Never on production.
    const demoRequested = request.nextUrl.searchParams.get("demo") === "1";
    const demoAllowed =
      process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production";
    if (demoRequested && demoAllowed) {
      const demoOffers: Array<Record<string, unknown>> = [
        {
          id: "demo-survey-01",
          name: "Sondaggio rapido",
          type: "survey",
          description: "Esempio di sondaggio breve per mostrare come appariranno le offerte.",
          payout: 0.35,
          conversion_time: 300,
          platforms: ["Web"],
          devices: ["Mobile", "Desktop"],
          tracking_link: "",
          offer_status: "demo",
        },
        {
          id: "demo-app-02",
          name: "Prova una nuova app",
          type: "app install",
          description: "Esempio di installazione e primo avvio di un'app.",
          payout: 1.2,
          conversion_time: 600,
          platforms: ["Android"],
          devices: ["Android"],
          tracking_link: "",
          offer_status: "demo",
        },
        {
          id: "demo-register-03",
          name: "Registrazione e profilo",
          type: "registration",
          description: "Esempio di registrazione e completamento del profilo richiesto.",
          payout: 0.75,
          conversion_time: 480,
          platforms: ["Web"],
          devices: ["Mobile", "Desktop"],
          tracking_link: "",
          offer_status: "demo",
        },
        {
          id: "demo-cpe-04",
          name: "Percorso a obiettivi",
          type: "cpe",
          conversion_type: "cpe",
          description: "Esempio di campagna multi-step: il totale si matura completando i singoli obiettivi.",
          payout: 6.4,
          conversion_time: 300,
          max_conversion_time: 604800,
          platforms: ["Android"],
          devices: ["Android"],
          tracking_link: "",
          offer_status: "demo",
          cpe_instructions: [
            { name: "Completa il primo obiettivo", payout: 0.4 },
            { name: "Raggiungi il livello 5", payout: 1.5 },
            { name: "Completa il livello finale", payout: 4.5 }
          ]
        },
        {
          id: "demo-video-05",
          name: "Guarda e completa",
          type: "video",
          description: "Esempio di attività breve con conferma finale.",
          payout: 0.2,
          conversion_time: 180,
          platforms: ["Web"],
          devices: ["Mobile", "Desktop"],
          tracking_link: "",
          offer_status: "demo",
        },
        {
          id: "demo-game-06",
          name: "Scopri un nuovo gioco",
          type: "game",
          description: "Esempio di campagna di gioco con ricompensa potenziale.",
          payout: 2.8,
          conversion_time: 1800,
          max_conversion_time: 259200,
          platforms: ["Android"],
          devices: ["Android"],
          tracking_link: "",
          offer_status: "demo",
        }
      ];
      const activities: FairRewardActivity[] = normalizeAyeTOffers(demoOffers);
      return NextResponse.json({
        provider: "ayeT",
        status: "demo",
        demo: true,
        fetchedAt: new Date().toISOString(),
        providerNumOffers: activities.length,
        rawOfferCount: activities.length,
        publishableOffers: 0,
        num_offers: activities.length,
        fieldCoverage: { offers: activities.length, payout: activities.length },
        activities: activities.map((activity) => ({ ...activity, demo: true })),
      }, { headers: { "Cache-Control": "no-store" } });
    }

    const identity = resolveExternalIdentifier(request);
    const externalIdentifier = identity.externalIdentifier;

    let ip = getClientIp(request);

    if (!ip) {
      ip = await getDevelopmentIp();
    }

    if (!ip) {
      return NextResponse.json(
        { error: "Client IP is required for the server-side ayeT request." },
        { status: 400 },
      );
    }

    const userAgent = request.headers.get("user-agent") ?? "";
    const language =
      request.headers.get("accept-language")?.split(",")[0]?.trim() ?? "it";

    const url = new URL(
      `${AYeT_BASE_URL}/offers/offerwall_api/${AYeT_ADSLOT_ID}`,
    );

    url.searchParams.set("external_identifier", externalIdentifier);
    url.searchParams.set("ip", ip);
    url.searchParams.set("user_agent", userAgent);
    url.searchParams.set("language", language);
    url.searchParams.set("num_offers", "50");
    url.searchParams.set("offer_sorting", "ecpm");
    url.searchParams.set("include_mobile_offers", "true");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent":
          userAgent ||
          "FairReward/2.0 (+https://github.com/rikas78/FAIR-REWARD_main)",
      },
      cache: "no-store",
    });

    const body = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `ayeT API returned ${response.status}`,
          details: body,
        },
        { status: 502 },
      );
    }

    const payload = JSON.parse(body) as {
      offers?: Array<Record<string, unknown>>;
    };

    const activities: FairRewardActivity[] = Array.isArray(payload.offers)
      ? normalizeAyeTOffers(payload.offers)
      : [];

    const result = NextResponse.json(
      {
        provider: "ayeT",
        placementId: AYeT_PLACEMENT_ID,
        adslot: AYeT_ADSLOT_ID,
        fetchedAt: new Date().toISOString(),
        status: "success",
        providerStatus:
          typeof (payload as { status?: unknown }).status === "string"
            ? String((payload as { status?: unknown }).status)
            : "success",
        providerNumOffers: Array.isArray(payload.offers)
          ? payload.offers.length
          : 0,
        rawOfferCount: Array.isArray(payload.offers)
          ? payload.offers.length
          : 0,
        publishableOffers: activities.filter(
          (activity) => activity.publish.ready,
        ).length,
        num_offers: activities.length,
        fieldCoverage: summarizeProviderFields(payload.offers),
        activities,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );

    if (identity.setCookie) {
      result.cookies.set("fr_ext_id", externalIdentifier, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return result;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown ayeT integration error",
      },
      { status: 500 },
    );
  }
}
