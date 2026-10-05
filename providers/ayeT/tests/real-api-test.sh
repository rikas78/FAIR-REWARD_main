#!/bin/zsh
set -euo pipefail

BASE_URL="https://www.ayetstudios.com/offers/offerwall_api/29639"

read -r "EXTERNAL_ID?External identifier di test (es. fairreward-test-001): "

if [[ -z "$EXTERNAL_ID" ]]; then
  echo "Errore: external identifier obbligatorio."
  exit 1
fi

echo
echo "Chiamata reale ayeT — AdSlot 29639..."
echo

curl --fail-with-body --silent --show-error \
  --get "$BASE_URL" \
  --data-urlencode "external_identifier=$EXTERNAL_ID" \
  --data-urlencode "user_agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/136 Safari/537.36" \
  --data-urlencode "language=it" \
  --data-urlencode "num_offers=20" \
  --data-urlencode "offer_sorting=ecpm" \
  -o /tmp/fairreward_ayet_response.json

echo "Risposta ricevuta."
echo
echo "=== SUMMARY ==="

python3 - <<'PY'
import json

path = "/tmp/fairreward_ayet_response.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

print("status:", data.get("status"))
print("num_offers:", data.get("num_offers"))

offerwall = data.get("offerwall", {})
print("currency:", offerwall.get("currency_name_plural"))
print("currency_sale:", offerwall.get("currency_sale"))

offers = data.get("offers", [])
print("offers ricevute:", len(offers))

for i, offer in enumerate(offers[:10], 1):
    print(
        f"{i}.",
        offer.get("name"),
        "| reward:", offer.get("currency_amount"),
        "| payout_usd:", offer.get("payout_usd"),
        "| conversion_time:", offer.get("conversion_time"),
        "| type:", offer.get("conversion_type"),
    )

print()
print("Risposta completa salvata temporaneamente in:")
print(path)
PY
