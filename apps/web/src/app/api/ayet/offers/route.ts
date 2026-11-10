import { NextRequest, NextResponse } from "next/server";
import { isIP } from "node:net";
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

function isPublicClientIp(value: string) {
  const ip = value.trim().replace(/^\\[|\\]$/g, "");
  const version = isIP(ip);
  if (!version) return false;

  if (version === 4) {
    const octets = ip.split(".").map(Number);
    const [a, b] = octets;
    if (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && octets[2] === 0) ||
      (a === 192 && b === 2) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && octets[2] === 100))) ||
      (a === 203 && b === 0 && octets[2] === 113)
    ) return false;
    return true;
  }

  const normalized = ip.toLowerCase();
  return !(
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("2001:db8:")
  );
}

function getClientIp(request: NextRequest) {
  // Vercel's x-real-ip is the platform-provided client address.
  // Prefer it over the forwarded chain, which may contain proxy entries.
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && isPublicClientIp(realIp)) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (isPublicClientIp(first)) return first;
  }

  return "";
}

export async function GET(request: NextRequest) {
  try {
    const identity = resolveExternalIdentifier(request);
    const externalIdentifier = identity.externalIdentifier;

    const ip = getClientIp(request);

    if (!ip) {
      return NextResponse.json(
        {
          error: "A public client IP could not be resolved from the Vercel request headers.",
          diagnostic: "missing_or_non_public_client_ip",
        },
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

    // Inventory loading must not create/overwrite the tracking cookie.
    // The identity is persisted by the offer launch or authenticated identity-link route.
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
