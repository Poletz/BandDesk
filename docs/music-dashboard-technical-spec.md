# Music Dashboard – Technical Spec (MVP → V1)

## 0) Stato implementazione (aggiornato 2026-08-27)

Sprint 1, 2 e 3 sono **completati e superati**: nav Home+Settings, tab `Live & Booking`/`Documents`/`Calendar`/`Manage Users`, CRUD locali/booking/gig, upload/consultazione documenti con signed URL, vista calendario mensile con merge booking confermati + gig — tutto in produzione sul branch principale.

Cose da sapere per chi riprende in mano il progetto:

- **Domain model spostato**: il file `src/interfaces/music.ts` descritto in sezione 4 non è mai stato creato. I tipi sono finiti divisi in `src/interfaces/{bands,live,documents,calendar,users,settings}.ts`. Il modello effettivo è anche più ampio di quanto descritto qui sotto: nel frattempo è stata costruita un'intera architettura multi-band con ruoli, inviti e permessi (`bands`, `band_memberships`, `band_invites`, `audit_logs` — vedi [schema-setup.md](./schema-setup.md)) che questo documento non menziona affatto. Consultare `schema-setup.md` per lo stato reale dei dati.
- **Setlist collaborative**: la collezione `setlists` (già in schema-setup.md) ha API REST complete (`GET/POST /api/bands/[bandId]/setlists`, `GET/PATCH/DELETE .../[setlistId]`) e permessi dedicati (`SETLIST_READ_ALL`, `SETLIST_READ_PUBLISHED`, `SETLIST_WRITE`), ma **non esiste alcuna UI**: nessun tab Settings, nessun `Tab.SETLISTS`, nessun `src/features/setlists/*`. È il pezzo di lavoro rimasto a metà — tutto il resto (bands, documents, invites, gigs, bookings) ha sia backend che frontend, i setlist solo backend.
- **Stub non funzionanti**: `Settings > Profile` e `Settings > Security` hanno handler placeholder (`// TODO: update user profile`, `// TODO: call auth API`) — i form esistono ma non salvano nulla.
- **Nessun test automatico**: non ci sono file `*.test.ts(x)` nel repo nonostante `jest`/`@testing-library` siano tra le devDependencies e referenziati nello script `test`.

## 1) Obiettivo
Portare la dashboard da template generico a workspace operativo per musicisti/band, mantenendo **Home** e **Settings** come entry-point principali e concentrando in Settings la parte di gestione.

Obiettivi funzionali immediati:
- Gestione **Live & Booking** (locali, richieste slot, date live in tutti gli stati).
- Repository **Documents** (caricamento statico e consultazione rapida, senza reminder di documenti mancanti).
- Vista **Calendar** per visualizzare tutte le date/eventi indipendentemente dallo stato.

---

## 2) Scelte UX e Information Architecture

### 2.1 Fase MVP (consigliata)
Tenere la navigazione principale con:
- Home
- Settings

In Settings aggiungere tab:
- Profile
- Account security
- Manage Users
- Live & Booking
- Documents
- Calendar

**Motivazione:** time-to-market rapido, minore complessità di routing, UX coerente con la base attuale.

### 2.2 Evoluzione V1+
Quando le feature musicali diventano core e frequenti:
- Promuovere a menu principali `Live & Booking`, `Documents`, `Calendar`.
- Lasciare Settings per configurazioni account/utente.

---

## 3) Calendar: Mantine vs pacchetto esterno

### Scelta raccomandata
Usare **Mantine Dates** in MVP:
- è già tra le dipendenze;
- coerenza visiva/styling con il resto dell'app;
- curva di integrazione bassa.

### Quando valutare libreria esterna (es. FullCalendar)
Solo se servono requisiti avanzati non coperti da Mantine:
- drag & drop nativo tra giorni;
- timeline resources;
- recurring rules complesse;
- integrazione iCal/Google Calendar avanzata.

**Decisione:** partire con Mantine; rivalutare dopo validazione uso reale.

---

## 4) Domain Model (TypeScript)

Creare nuovi tipi dedicati in `src/interfaces/music.ts`.

```ts
export type BookingStatus = 'draft' | 'requested' | 'negotiating' | 'confirmed' | 'rejected' | 'cancelled';

export interface Venue {
  id: string;
  name: string;
  city?: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export interface BookingRequest {
  id: string;
  venueId: string;
  requestedDate?: string; // ISO
  status: BookingStatus;
  feeProposal?: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  notes?: string;
}

export interface GigEvent {
  id: string;
  venueId: string;
  date: string; // ISO
  status: BookingStatus;
  title: string;
  setlistName?: string;
  notes?: string;
}

export type DocumentCategory =
  | 'technical-rider'
  | 'stage-plot'
  | 'agibility'
  | 'siae'
  | 'songbook'
  | 'other';

export interface BandDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileUrl: string;
  uploadedAt: string; // ISO
  tags?: string[];
}

export type CalendarItemType = 'booking' | 'gig' | 'reminder';

export interface CalendarItem {
  id: string;
  type: CalendarItemType;
  date: string; // ISO
  title: string;
  status?: BookingStatus;
  venueId?: string;
}
```

---

## 5) Component Architecture

### 5.1 Home (`/dashboard`)
Widget previsti:
1. **Upcoming Live** (prossimi eventi confermati/opzionati)
2. **Booking Pipeline** (conteggi per stato)
3. **Documents Snapshot** (ultimi caricati)
4. **Mini Calendar** (prossimi 30 giorni)
5. **Quick Actions** (aggiungi live, locale, documento)

### 5.2 Settings tabs
- **Live & Booking tab**
  - Sezione `Venues` (lista locali + quick add)
  - Sezione `Bookings` (tabella richieste con stato)
  - Sezione `Gigs` (lista date live)
- **Documents tab**
  - Upload statico
  - Lista con filtri categoria/tag
  - Download/open
- **Calendar tab**
  - Vista mese
  - Badge colore per stato
  - Click evento -> dettaglio base (drawer/modal)

---

## 6) Stato dati e persistenza (phased)

### MVP
- stato locale + mock seed in memoria;
- shape dati già pronta per API future.

### Step successivo
- API route Next (`/api/music/*`) + persistenza su backend già in uso dal progetto;
- mantenere invariati i componenti UI, sostituendo solo data layer.

---

## 7) Routing e migrazione navigazione

### Subito
- rimuovere voce `Users` dalla navbar principale;
- mantenere gestione utenti solo in Settings tab `Manage Users`.

### Opzionale compatibilità
- se esiste ancora `/dashboard/users`, fare redirect a `/dashboard/settings` con tab `users`.

---

## 8) Sprint Plan operativo

### Sprint 1 (UI Foundation) — ✅ fatto
- Allineamento navigation (solo Home + Settings).
- Home con widget musicali (booking, live, documents, calendar, users, quick actions).
- Aggiunta tab `Live & Booking`, `Documents`, `Calendar`, `Manage Users` in Settings.
- Tipi definitivi divisi per dominio in `src/interfaces/*` (non un unico `music.ts`, vedi §0).

### Sprint 2 (Live & Booking) — ✅ fatto
- CRUD locali (`/api/venues`).
- CRUD booking/date live (`/api/bookings`, `/api/gigs`).
- Filtri per stato e ricerca locale in `src/components/settings/live/live.tsx`.

### Sprint 3 (Documents + Calendar) — ✅ fatto
- Upload documento (signed URL Firebase Storage) + elenco + filtri categoria.
- Calendario mensile con eventi di tutti gli stati.
- Collegamento evento -> dettaglio rapido (drawer).

### Sprint 4 (non pianificato qui, ma costruito) — ✅ fatto
- Multi-band, ruoli (`admin`/`member`/`guest`), inviti tokenizzati, permessi granulari — vedi `schema-setup.md`.

### Sprint 5 — Setlists UI — ⏳ da fare
- Backend pronto (API + permessi + tipi). Manca: tab Settings, `src/features/setlists/*` (repository/selectors), editor canzoni con `position` drag-reorder, badge draft/published.

### Sprint 6 — rifiniture — ⏳ da fare
- Rendere funzionanti i salvataggi in `Settings > Profile` e `Settings > Security` (oggi sono TODO stub).
- Copertura test (jest è configurato, zero test scritti finora).

---

## 9) Criteri di accettazione MVP
1. L'utente vede da Home almeno: prossimi live, pipeline booking e snapshot documenti.
2. In Settings può gestire locali/richieste/date nel tab `Live & Booking`.
3. In Settings può caricare e consultare documenti nel tab `Documents`.
4. In Settings può vedere tutte le date/eventi nel tab `Calendar`.
5. `Users` non è più una pagina primaria di navigazione.

---

## 10) Rischi e mitigazioni
- **Scope creep** su calendario avanzato → fissare MVP su vista mese read-first.
- **Complessità upload file** → partire con storage minimale e metadati essenziali.
- **Incoerenza stati booking** → enum centralizzata e mapping colori unico.

---

## 11) Decision summary
- Documenti: modalità **statica** (upload + repository), senza reminder mancanti.
- Calendar: **sì**, incluso in MVP come tab Settings e mini-blocco in Home.
- Stack UI calendario: **Mantine Dates** in prima implementazione.
- Strategia nav: prima tab in Settings, successiva promozione a menu dedicati se uso elevato.
