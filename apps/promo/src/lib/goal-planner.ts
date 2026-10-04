export type PromoOffer = {
  id: string;
  offerId?: string;
  name?: string;
  title?: string;
  description?: string;
  currency_amount?: number | string | null;
  payout?: number | string | null;
  payment_required?: boolean | number | string;
  tracking_link?: string | null;
  platforms?: string[];
  devices?: string[];
  conversion_time?: number | string | null;
  max_conversion_time?: number | string | null;
};

export type PlannedOffer = PromoOffer & {
  reward: number;
};

export type GoalPlan = {
  target: number;
  total: number;
  difference: number;
  offers: PlannedOffer[];
};

const FAIRREWARD_GROSS_SHARE = 0.375;

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function isTrue(value: unknown) {
  return value === true || value === 1 || value === "1";
}

export function getEstimatedReward(offer: PromoOffer) {
  const currencyAmount = money(offer.currency_amount);

  if (currencyAmount > 0) {
    return Number(currencyAmount.toFixed(2));
  }

  const payout = money(offer.payout);

  if (payout > 0) {
    return Number((payout * FAIRREWARD_GROSS_SHARE).toFixed(2));
  }

  return 0;
}

function normalizeOffers(offers: PromoOffer[]): PlannedOffer[] {
  const seen = new Set<string>();

  return offers
    .map((offer) => {
      const id = String(offer.id ?? offer.offerId ?? "");
      const reward = getEstimatedReward(offer);

      return {
        ...offer,
        id,
        reward,
      };
    })
    .filter((offer) => {
      const key = offer.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);

      return (
        offer.reward > 0 &&
        !isTrue(offer.payment_required) &&
        Boolean(offer.tracking_link)
      );
    })
    .sort((a, b) => b.reward - a.reward);
}

export function buildGoalPlan(
  offers: PromoOffer[],
  target: number,
): GoalPlan {
  const candidates = normalizeOffers(offers).slice(0, 18);

  if (!candidates.length) {
    return {
      target,
      total: 0,
      difference: -target,
      offers: [],
    };
  }

  let best: PlannedOffer[] = [];
  let bestScore = Number.POSITIVE_INFINITY;

  function score(selection: PlannedOffer[]) {
    const total = Number(
      selection.reduce((sum, offer) => sum + offer.reward, 0).toFixed(2),
    );

    const difference = Math.abs(total - target);
    const overshoot = Math.max(0, total - target);

    return difference + overshoot * 0.08 + selection.length * 0.002;
  }

  function visit(index: number, selection: PlannedOffer[], total: number) {
    if (selection.length > 5) return;

    if (selection.length > 0) {
      const currentScore = score(selection);

      if (currentScore < bestScore) {
        bestScore = currentScore;
        best = [...selection];
      }
    }

    if (index >= candidates.length) return;

    for (let i = index; i < candidates.length; i++) {
      const nextTotal = total + candidates[i].reward;

      if (nextTotal > target * 1.45) continue;

      selection.push(candidates[i]);
      visit(i + 1, selection, nextTotal);
      selection.pop();
    }
  }

  visit(0, [], 0);

  const total = Number(
    best.reduce((sum, offer) => sum + offer.reward, 0).toFixed(2),
  );

  return {
    target,
    total,
    difference: Number((total - target).toFixed(2)),
    offers: best,
  };
}
