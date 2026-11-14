# FairReward — report tecnico per revisione Overbot

Data: 14 novembre 2026
Riferimento: branch `main`
Ambito: integrazione ayeT, callback finanziari e wallet

## Correzione già applicata

Nel callback `apps/web/src/app/api/ayet/callback/route.ts` le conversioni e gli storni usavano lo stesso `transaction_id` come chiave univoca in `ayet_conversions`, `user_reward_ledger` e `platform_revenue`.

Se ayeT invia uno storno riutilizzando l'ID della conversione originale, l'upsert idempotente poteva scartare lo storno nel ledger; inoltre la riga di conversione originale non deve essere sovrascritta.

La route ora:
- riconosce `callback_type=chargeback` e `callback_type=reversal`, oltre agli indicatori già gestiti;
- assegna allo storno una chiave evento deterministica `<transaction_id>:chargeback`;
- usa la stessa chiave separata per conversion log, ledger e ricavi;
- mantiene invariata la chiave della conversione originale;
- mantiene il segno negativo dello storno e l'idempotenza sul medesimo evento.

Commit:
- `294745eeea2361d804b6a91e22e3ed0ddd48c9bc` — prima correzione chiave evento
- `4239ee3dfcae14923f2207d165de470650b07d3b` — riconoscimento esplicito callback_type=reversal

## Richiesta di revisione Overbot — punti da confermare prima di ampliare la logica

### 1. Semantica ayeT degli storni — BLOCCANTE
Confermare dalla documentazione ufficiale o da esempi reali firmati:
- se uno storno riutilizza sempre il transaction_id originale oppure genera un nuovo ID;
- se possono esistere storni parziali o più storni per la stessa conversione;
- quali campi e valori identificano ufficialmente chargeback/reversal;
- se `currency_amount` nello storno è già negativo o viene inviato positivo.

La chiave `:chargeback` gestisce un solo storno per conversione. Se ayeT ammette più storni parziali distinti, serve una chiave evento basata su un identificatore univoco dello storno, non solo sul transaction_id originale. Non inventare tale identificatore: ricavarlo dal contratto provider.

### 2. Firma callback HMAC — BLOCCANTE
Il codice attuale usa `AYET_API_KEY` come chiave HMAC SHA-256 e canonicalizza i parametri come query string ordinata, escludendo `security_hash`. Verificare esattamente:
- quale segreto ayeT richiede per la firma;
- algoritmo, encoding, ordinamento e normalizzazione dei parametri;
- trattamento dei callback GET e POST;
- se l'header `x-ayetstudios-security-hash` e il parametro `security_hash` hanno lo stesso formato.

Non cambiare la verifica basandosi su convenzioni generiche. In produzione il codice rifiuta i callback se la firma non passa.

### 3. Atomicità economica — ALTA
La route scrive separatamente conversione, ledger, ricavo e poi invoca `reconcile_ayet_wallet`. I retry rendono molte scritture recuperabili, ma la sequenza non è un'unica transazione DB. Valutare una RPC SQL unica che:
- registri l'evento in modo idempotente;
- scriva conversione, ledger e ricavo;
- applichi il delta al wallet nella stessa transazione;
- impedisca doppio accredito in caso di retry/concorrenza.

Prima di scriverla, verificare schema effettivo e compatibilità con i dati già presenti.

### 4. Wallet e migrazioni — BLOCCANTE OPERATIVO
La migration `20261114_wallets_schema_rls.sql` è presente su `main`, ma dal solo repository non è possibile dimostrare che sia stata applicata al progetto Supabase collegato. Anche `20261019_wallet_identity.sql` crea la funzione `reconcile_ayet_wallet` e presume l'esistenza di `wallets`. Verificare stato e ordine delle migration sul database effettivo prima di dichiarare attivo il wallet.

### 5. Mappatura identità — ALTA
Verificare il flusso utente non autenticato/autenticato:
- `fr_ext_id` è generato nel browser/server e associato a un utente autenticato solo tramite `/api/ayet/link-identity`;
- chiarire cosa accade a conversioni arrivate prima del collegamento e se la riconciliazione successiva le accredita correttamente;
- verificare collisioni, riutilizzo cookie e cambio account sullo stesso browser.

### 6. Configurazione provider e deploy — OPERATIVO
Nel codice esaminato l'ads slot predefinito è `29639`, mentre il valore storico annotato in precedenza era diverso; `AYET_PLACEMENT_ID` ha default `24935`. Verificare sul pannello ayeT quale coppia sia quella attiva e che le variabili Vercel corrispondano. Non riportare valori segreti nel report o nei log.

## Verifiche non ancora eseguite
- Nessun accesso al database Supabase effettivo per controllare o applicare migration.
- Nessun callback ayeT reale/sandbox riprodotto contro un ambiente operativo.
- Nessun test automatico o build eseguito in questo passaggio.
- GitHub Actions non espone workflow run recenti per il repository (risposta API: zero run).

## Criterio di chiusura
Non dichiarare completato il motore economico finché i punti 1, 2 e 4 non sono verificati e un test end-to-end dimostra: conversione singola, callback duplicato, storno, callback storno duplicato, riconciliazione wallet e saldo finale corretto.
