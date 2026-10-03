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

function resolveExternalIdentifier() {
  if (process.env.NODE_ENV !== "production") {
    return "fairreward-dev-user-001";
  }

  throw new Error(
    "Production user identity is not connected yet. Wire this route to FairReward Auth before enabling production inventory.",
  );
}

export async function GET(request: NextRequest) {
  try {
    const externalIdentifier = resolveExternalIdentifier();

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

    const payload = JSON.parse(body);

    return NextResponse.json(
      {
        provider: "ayeT",
        adslot: AYeT_ADSLOT_ID,
        fetchedAt: new Date().toISOString(),
        ...payload,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
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
