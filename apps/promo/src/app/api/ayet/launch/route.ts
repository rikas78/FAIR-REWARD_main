import { NextRequest, NextResponse } from "next/server";

const AYeT_ADSLOT_ID = "29639";
const AYeT_BASE_URL = "https://www.ayetstudios.com";

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

export async function GET(request: NextRequest) {
  try {
    const offerId = request.nextUrl.searchParams.get("offerId");

    if (!offerId || !/^\d+$/.test(offerId)) {
      return NextResponse.json(
        { error: "Invalid ayeT offerId." },
        { status: 400 },
      );
    }

    const identity = resolveExternalIdentifier(request);
    const externalIdentifier = identity.externalIdentifier;

    let ip = getClientIp(request);

    if (!ip && process.env.NODE_ENV !== "production") {
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

    const offer = Array.isArray(payload.offers)
      ? payload.offers.find(
          (item) => String(item.id ?? item.offer_id ?? "") === offerId,
        )
      : null;

    if (!offer) {
      return NextResponse.json(
        { error: `ayeT offer ${offerId} is no longer available.` },
        { status: 404 },
      );
    }

    const trackingLink = offer.tracking_link;

    if (typeof trackingLink !== "string" || !trackingLink) {
      return NextResponse.json(
        {
          error: "ayeT tracking_link missing for this offer.",
          require_reservation: Boolean(offer.require_reservation),
        },
        { status: 409 },
      );
    }

    const trackingUrl = new URL(trackingLink);

    if (
      trackingUrl.protocol !== "https:" ||
      trackingUrl.hostname !== "www.ayetstudios.com"
    ) {
      return NextResponse.json(
        { error: "Invalid ayeT tracking destination." },
        { status: 502 },
      );
    }

    const clickId = `frdev_${crypto.randomUUID()}`;
    trackingUrl.searchParams.set("custom_1", clickId);

    const result = NextResponse.redirect(trackingUrl.toString(), {
      status: 307,
    });

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
            : "Unknown ayeT launch error",
      },
      { status: 500 },
    );
  }
}
