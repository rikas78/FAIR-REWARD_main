# FairReward offer-card preview

This branch is based on `fix/ayet-rewards-callback`, which corrects the interpretation of ayeT's Offerwall API `payout` field.

## View demo cards

On a local development server or a Vercel Preview deployment, open the app URL with `?demo=1`, for example:

```
https://<vercel-preview-url>/?demo=1
```

The demo endpoint is deliberately restricted to local development and Vercel Preview. It does not return demo fixtures in production.

## Demo values

The fixture set includes indicative amounts of €0.20, €0.35, €0.75, €1.20, €2.80 and a CPE campaign total of €6.40 with example milestones. These amounts are illustrative UI data only; they are not live ayeT offers, not validated by ayeT and cannot be launched or credited. Every card is labelled DEMO and the launch button is disabled.

## Production behaviour

Without `?demo=1`, the app continues to request the live ayeT inventory. The displayed user reward is the Offerwall API's top-level `payout`, in the configured AdSlot currency (EUR for the current placement), not a second percentage calculation against `payout_usd`.

## Before merging

- Run the Next.js build and type checks.
- Confirm the live API returns the expected `payout` values for AdSlot 29639 / Placement 24935.
- Test the demo URL in a Vercel Preview deployment.
- Do not merge or deploy until the callback/wallet work in the base branch has been reviewed and staging-tested.
