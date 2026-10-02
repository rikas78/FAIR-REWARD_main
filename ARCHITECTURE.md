# FairReward 2.0 — Architecture

## Core flow
User → FairReward → UserTask → Provider → Conversion/Postback → Reward Engine → Transaction/Ledger → Wallet → Payout

## Data
Operational database, event/analytics data, audit logs and security events are first-class components.

## Product
Promotional and authenticated platform experiences share one production core.

## Providers
Each provider is isolated behind its own adapter. Provider-specific logic must not leak into generic reward logic.

## Financial integrity
Frontend actions never directly create authoritative rewards or balances. Financial state changes are server-side, atomic, idempotent and auditable.
