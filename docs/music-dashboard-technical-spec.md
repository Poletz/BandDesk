# Music Dashboard – Technical Spec (MVP → V1)

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

### Sprint 1 (UI Foundation)
- Allineamento navigation (solo Home + Settings).
- Home con 4 widget musicali base.
- Aggiunta tab `Live & Booking`, `Documents`, `Calendar` in Settings.
- Mock data e tipi in `src/interfaces/music.ts`.

### Sprint 2 (Live & Booking)
- CRUD base locali.
- CRUD base booking/date live.
- Filtri per stato e ricerca locale.

### Sprint 3 (Documents + Calendar)
- Upload documento statico + elenco + filtri.
- Calendario mensile con eventi di tutti gli stati.
- Collegamento evento -> dettaglio rapido.

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
