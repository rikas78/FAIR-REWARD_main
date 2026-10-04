type PayPalEnvironment = "sandbox" | "live";

export type PayPalPayoutRequest = {
  senderBatchId: string;
  recipientEmail: string;
  amount: string;
  currency?: string;
  note?: string;
};

export type PayPalPayoutResponse = {
  payoutBatchId: string;
  batchStatus: string;
  raw: unknown;
};

function required(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getBaseUrl(): string {
  const configured = process.env.PAYPAL_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const environment: PayPalEnvironment =
    process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";

  return environment === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const clientId = required("PAYPAL_CLIENT_ID");
  const clientSecret = required("PAYPAL_CLIENT_SECRET");

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`,
    "utf8",
  ).toString("base64");

  const response = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    throw new Error(
      `PayPal OAuth failed (${response.status}): ${JSON.stringify(data)}`,
    );
  }

  return String(data.access_token);
}

export async function createPayPalPayout(
  request: PayPalPayoutRequest,
): Promise<PayPalPayoutResponse> {
  const accessToken = await getAccessToken();

  const currency =
    request.currency?.trim().toUpperCase() ||
    process.env.PAYPAL_PAYOUT_CURRENCY?.trim().toUpperCase() ||
    "EUR";

  const amount = Number(request.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid payout amount.");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(request.amount)) {
    throw new Error("Payout amount must use at most two decimal places.");
  }

  const senderBatchId = request.senderBatchId.trim();
  if (!senderBatchId) {
    throw new Error("senderBatchId is required.");
  }

  const recipientEmail = request.recipientEmail.trim();

  if (!recipientEmail || !/^\S+@\S+\.\S+$/.test(recipientEmail)) {
    throw new Error("A valid PayPal recipient email is required.");
  }

  const body = {
    sender_batch_header: {
      sender_batch_id: senderBatchId,
      recipient_type: "EMAIL",
      email_subject: "FairReward payout",
      email_message: "Hai ricevuto un pagamento da FairReward.",
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: amount.toFixed(2),
          currency,
        },
        receiver: recipientEmail,
        note: request.note?.trim() || "FairReward reward payout",
        sender_item_id: senderBatchId,
      },
    ],
  };

  const response = await fetch(`${getBaseUrl()}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `PayPal payout failed (${response.status}): ${JSON.stringify(data)}`,
    );
  }

  const payoutBatchId = String(data?.batch_header?.payout_batch_id ?? "");

  if (!payoutBatchId) {
    throw new Error("PayPal response missing payout_batch_id.");
  }

  return {
    payoutBatchId,
    batchStatus: String(data?.batch_header?.batch_status ?? "UNKNOWN"),
    raw: data,
  };
}

export async function getPayPalPayoutBatch(
  payoutBatchId: string,
): Promise<unknown> {
  const accessToken = await getAccessToken();
  const id = payoutBatchId.trim();

  if (!id) throw new Error("payoutBatchId is required.");

  const response = await fetch(
    `${getBaseUrl()}/v1/payments/payouts/${encodeURIComponent(id)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `PayPal payout lookup failed (${response.status}): ${JSON.stringify(data)}`,
    );
  }

  return data;
}
