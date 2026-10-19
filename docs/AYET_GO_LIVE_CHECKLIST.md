# ayeT go-live checklist — FairReward

Do not enable real wallet payouts until every required staging check below has evidence recorded.

## ayeT dashboard — manual configuration required

- [ ] AdSlot **29639** is enabled and configured for EUR with the intended user-reward conversion rate.
- [ ] Placement **24935** uses the preview callback URL during testing, not the production URL.
- [ ] Conversion callbacks are enabled.
- [ ] Reversal/chargeback callbacks are enabled.
- [ ] The callback URL passes through `external_identifier={external_identifier}`, `custom_1={custom_1}`, `transaction_id={transaction_id}`, `callback_type={callback_type}`, `currency_amount={currency_amount}`, `payout_usd={payout_usd}`, `currency_identifier={currency_identifier}`, `offer_id={offer_id}`, and `is_chargeback={is_chargeback}` (plus any other fields required for diagnostics).
- [ ] Confirm the dashboard sends the `X-Ayetstudios-Security-Hash` header. The implementation uses the publisher API key and the documented SHA-256 HMAC over alphabetically sorted request parameters.
- [ ] Confirm the callback endpoint returns HTTP 200 for accepted, duplicate, ignored optional, and recorded reversal callbacks.

## Staging test cases

- [ ] **Valid conversion:** signed callback, known user UUID, matching unexpired click, EUR currency, positive `currency_amount`; creates exactly one pending wallet credit and one ledger entry.
- [ ] **Duplicate conversion:** resend the exact same `transaction_id`; no second wallet or ledger credit.
- [ ] **Invalid signature:** callback is rejected and nothing is credited.
- [ ] **Missing/invalid amount:** callback is rejected and nothing is credited.
- [ ] **Wrong currency:** callback is recorded as rejected; no wallet credit.
- [ ] **Unknown user / missing click / wrong user click:** callback is recorded for investigation; no wallet credit.
- [ ] **Sandbox callback:** `is_sandbox=1` must not create real wallet credits. Confirm the configured sandbox routing/guard before running this test; do not assume the current SQL function itself filters sandbox events.
- [ ] **Reversal with pending balance:** the pending balance decreases by the reversed amount.
- [ ] **Reversal with available balance:** the available balance decreases by the reversed amount.
- [ ] **Reversal after user withdrawal / insufficient balance:** only available funds are removed; the remainder is recorded in `unrecovered_cents` for investigation and must not be treated as recovered.
- [ ] **Duplicate reversal:** resend the same reversal transaction ID; no second deduction.
- [ ] **Reversal before original conversion:** the callback is stored as `reversal_orphan`. This requires operational reconciliation; do not mark it resolved automatically.
- [ ] **CPE milestone:** verify that each paid milestone has its own unique callback transaction ID and only the callback's `currency_amount` is credited—not the campaign's top-level potential total.
- [ ] **End-to-end reconciliation:** compare Offerwall API `payout`, callback `currency_amount`, callback `payout_usd`, AdSlot conversion rate, and the resulting wallet/ledger amounts.

## Current implementation notes

- Callback amounts are required rather than silently defaulted to zero.
- GET query parameters and POST query/form parameters are included when building the callback parameter set for HMAC verification.
- Reversal processing records requested, recovered, and unrecovered amounts separately.
- The migration has **not** been applied to Supabase by this change. Apply it to staging first and verify the existing wallet schema before considering production.
- No production merge or deployment is authorized by this checklist.
