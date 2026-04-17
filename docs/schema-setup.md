# Firebase / Firestore Schema (BandDesk v1)

Schema pensato per:
- multi-band per utente
- ruoli per-band (`admin`, `member`, `guest`)
- inviti tokenizzati
- setlist collaborative
- storage metadata per file S3

## Collezioni principali

### `bands/{bandId}`
```ts
{
  name: string
  bio: string | null
  genres: string[]
  city: string | null
  socials: {
    instagram?: string | null
    youtube?: string | null
    spotify?: string | null
    tiktok?: string | null
    website?: string | null
  } | null
  visibility: "public" | "private"
  createdByUserId: string // owner storico (informativo)
  createdAt: ISODateString
  updatedAt: ISODateString
}
```

### `band_memberships/{bandId}_{userId}`
```ts
{
  bandId: string
  userId: string
  role: "admin" | "member" | "guest"
  status: "active" | "invited" | "disabled"
  invitedByUserId: string | null
  invitedAt: ISODateString | null
  acceptedAt: ISODateString | null
  createdAt: ISODateString
  updatedAt: ISODateString
}
```

### `band_invites/{inviteId}`
```ts
{
  bandId: string
  email: string
  emailLower: string
  role: "admin" | "member" | "guest"
  status: "pending" | "accepted" | "revoked" | "expired"
  tokenHash: string // sha256(token), mai token in chiaro
  expiresAt: ISODateString
  invitedByUserId: string
  invitedAt: ISODateString
  acceptedAt: ISODateString | null
  acceptedByUserId: string | null
  revokedAt: ISODateString | null
}
```

### `setlists/{setlistId}`
```ts
{
  bandId: string
  title: string
  status: "draft" | "published"
  songs: Array<{
    id: string
    title: string
    artist: string | null
    key: string | null
    notes: string | null
    position: number // ordine persistente
  }>
  createdByUserId: string
  lastModifiedByUserId: string
  lastModifiedAt: ISODateString
  createdAt: ISODateString
  updatedAt: ISODateString
}
```

### `band_documents/{documentId}` (Sprint 5)
```ts
{
  bandId: string
  bucket: string
  key: string
  fileName: string
  fileSizeBytes: number
  contentType: string
  category: string
  visibility: "public" | "members" | "admins"
  uploadedByUserId: string
  createdAt: ISODateString
  updatedAt: ISODateString
  deletedAt: ISODateString | null // soft delete
}
```

### `audit_logs/{logId}` (Sprint 6)
```ts
{
  bandId: string
  actorUserId: string
  action: string // invite.sent, invite.revoked, setlist.updated, ...
  entityType: string
  entityId: string
  metadata: Record<string, unknown>
  createdAt: ISODateString
}
```

## Campi utente consigliati

Collezione Better Auth esistente: `users/{userId}`
```ts
{
  activeBandId?: string // contesto band corrente UI/API
}
```

## Query principali

- Band visibili da utente:
  - `band_memberships.where("userId","==",uid).where("status","==","active")`
- Membership per accesso band:
  - doc diretto `band_memberships/{bandId}_{uid}`
- Invito pending per email in una band:
  - `band_invites.where("bandId","==",bandId).where("emailLower","==",emailLower)`
- Setlist band:
  - `setlists.where("bandId","==",bandId)`

## Indici Firestore consigliati (v1)

1. `band_memberships`:
   - `userId ASC, status ASC`
2. `band_invites`:
   - `bandId ASC, emailLower ASC`
3. `setlists`:
   - `bandId ASC, updatedAt DESC`
4. `band_documents`:
   - `bandId ASC, visibility ASC, deletedAt ASC`

## Security notes pragmatiche (MVP)

- Bucket S3 privato, accesso file via presigned URL a scadenza breve.
- In Firestore non salvare token inviti in chiaro: solo hash.
- Email invito con dati minimi (no dati sensibili).
- Retention log base (audit) e minimizzazione payload.
- Preferire region UE per Firestore e S3 dove possibile.
