# Kulaya — Data Lifecycle

> Retention, deletion, export, backup, and recovery for a private family's
> data — with photos and documents (the irreplaceable objects) treated
> explicitly.

This doc is the operational companion to [threat-model.md](threat-model.md) and
[deployment.md](deployment.md). The deployment doc's _Operating runbook_
section holds the first-pass backup commands; this page is the complete
lifecycle policy and the recovery playbook. **One rule drives everything:**

> Photos and documents are considered irreplaceable. Every operation on them —
> sending, deleting, restoring — is conservative, explicit, and where possible
> reversible.

## Data map

| Data                           | Created by                  | Storage location                        | Deleted today by                             |
| ------------------------------ | --------------------------- | --------------------------------------- | -------------------------------------------- |
| Member profiles & family tree  | registration / admin editor | MongoDB (`User`)                        | none (admin manual)                          |
| **Photos**                     | member upload               | R2 `photos/*` + `Photo` doc             | owner or admin (`DELETE /api/photos/:id`)    |
| **Documents**                  | member upload               | R2 `documents/*` + `Document` doc       | owner or admin (`DELETE /api/documents/:id`) |
| Document share links           | member (`POST /:id/share`)  | `Document.shareToken`                   | owner or admin (revoke/delete)               |
| Moments posts, likes, comments | member                      | `Post` (+ comments subdoc)              | author/admin (route delete)                  |
| Chat messages                  | member                      | `Message` / `Room`                      | none today                                   |
| Events / announcements         | member / admin              | `Event` / `Announcement`                | creator/admin (route delete)                 |
| Notifications                  | system events               | `Notification`                          | per-recipient delete                         |
| Sessions & tokens              | login/register              | `User.refreshTokenHashes` + JWT/cookies | rotate-out / revoke                          |
| Dev fallback files             | member upload (dev only)    | `apps/api/uploads/` (gitignored)        | file delete / repo cleanup                   |

Each stored item has **two halves that must stay in sync**:

- the **metadata** in MongoDB (`key`, `mimeType`, `size`, uploader, share token)
- the **bytes** in R2 (`photos/*`, `documents/*`) — or local disk in dev

Every read path resolves a metadata `key` into a presigned object URL, so a
missing/extra half is exactly the failure mode this document supervises.

## Retention

Kulaya is an **archive by default**: nothing is auto-purged, and nothing that
matters expires without an explicit action.

| Data                                                  | Retention                          | Notes                                                                                         |
| ----------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| Photos, documents, posts, chat, events, announcements | **Indefinite**                     | deleted only by owner/admin on purpose                                                        |
| Access token (JWT)                                    | 15 min                             | short-lived, stateless                                                                        |
| Refresh token (`kulaya_refresh`)                      | 30 days (`AUTH_REFRESH_TOKEN_TTL`) | rotating; server-side `jti` hashes; sessions capped at `AUTH_MAX_ACTIVE_SESSIONS` (default 5) |
| Email-verification token                              | 24 h                               | hash stored; expired hash stays in the document until next write                              |
| Password-reset token                                  | 1 h                                | same hashing/expiry model                                                                     |
| CSRF cookie                                           | 30 days                            | JS-readable, rotated per login                                                                |
| Notifications                                         | no cap                             | part of the family history; revisit under [Gaps](#gaps-and-roadmap)                           |
| Deleted objects                                       | none                               | hard delete, no recycle bin                                                                   |

## Deletion mechanics (photos & documents)

Both photo and document deletion today is a **hard delete**: the R2 object is
removed _and_ the metadata doc is removed, in that order, under the
owner-or-admin rule (`apps/api/src/routes/photos.ts`, `documents.ts`).

1. `storage.deleteObject(key)` removes the bytes in R2.
2. `photo.deleteOne()` / `document.deleteOne()` removes the metadata.
3. Any public share token dies with the document (either revoke or delete).

> **No trash/recycle bin, no soft-delete, no versioning** in the current app.
> Deleting is immediate and irreversible through the UI — the web app already
> confirms, but treat `DELETE` links with care.

### Orphan & phantom records

Two failure modes deserve an admin's attention:

- **Orphan object** — the browser PUT the bytes to R2, but the follow-up
  `POST /api/photos` / `POST /api/documents` failed, or the R2 delete succeeded
  before the DB delete. Result: bytes in R2 with no metadata.
- **Phantom reference** — the R2 delete throws a timeout but the DB delete
  succeeds, leaving metadata whose key no longer exists in the bucket. The list
  entry stays visible but every download 403s.

**Reconciliation job (recommended — see [Gaps](#gaps-and-roadmap)):** a daily
script pages the R2 listing for `photos/` + `documents/` and the Mongo
collections, reports orphans and phantoms, and — after admin confirmation —
deletes orphan objects older than N days. Until it exists, treat either state
as an incident and resolve manually via the [Recovery](#recovery) scenarios.

## Export

There is **no in-app export feature yet.** For family content the whole library
is fine to export wholesale; the permissive path is what the family wants.
Two manual procedures cover the gap today:

### Photos & documents (R2)

```bash
rclone copy r2:kulaya-photos/photos    ./export/photos    --progress
rclone copy r2:kulaya-photos/documents ./export/documents --progress
```

This yields a flat folder of the authored objects (`photos/<uuid>.ext`),
which is the natural "family photo album on disk" export.

### Database (posts, tree, events, chats, metadata…)

```bash
mongodump --uri "$DATABASE_URL" --archive="kulaya-export-$(date +%F).gz" --gzip
```

This snapshot also carries sessions, tokens, and password hashes the family
won't want in an archive folder. For a **clean export** — family content only —
use `mongoexport` per collection with a projection (omit `passwordHash`,
`refreshTokenHashes`, `*TokenHash`, `*TokenExpires`), or wait for the in-app
[export milestone](#gaps-and-roadmap). Zip the JSON next to the media folder
for a self-contained family archive.

### In-app export (roadmap)

- **"Export my data"** (member): own profile, authored posts, uploaded
  photos/documents, share links.
- **"Export the nest"** (admin): everything, zipped, run as a tracked
  one-off job with email notification on completion.

## Backups

Owners: **an admin is the sole operator.** Target: **no more than 24 h of
potential data loss at any point.**

### Mongo (Atlas M0)

Atlas M0 (free) has **no automated backup / no point-in-time restore**. Take
manual physical backups with `mongodump --archive --gzip`.

| Schedule          | Retention policy | Purpose           |
| ----------------- | ---------------- | ----------------- |
| nightly 00:30 UTC | last 7 d         | rolling window    |
| weekly (Sat)      | last 4           | past month        |
| monthly (1st)     | last 12          | long-term archive |

```bash
mongodump --uri "$DATABASE_URL" --archive="kulaya-$(date +%F).gz" --gzip
```

Store the archive files off-box (an rclone destination or another storage
provider). `mongorestore --archive` restores these dumps to a fresh match.

### R2 (photos & documents)

R2 provides **no versioning on the free tier and no cross-region failover** —
the bucket is a single point of failure. Requirement: **a mirrored copy in a
second location via rclone.**

```bash
rclone sync r2:kulaya-photos/photos    backup:kulaya-mirror/photos
rclone sync r2:kulaya-photos/documents backup:kulaya-mirror/documents
```

Schedule the object sync **immediately after** the nightly `mongodump` so the
metadata snapshot and object snapshot land close together (a metadata walk
from dump time T and an object mirror from time T+X can disagree on a handful
of files; tight windowing keeps the gap tiny).

Retention of the mirror: keep a **30-day "deleted-phrase" copy** (offsite
copies of objects that are going away), so an accidental in-app delete can
still be dug out of the archive while the authoritative bucket moves on.

### Environment & secrets

Back up a copy of the production environment variables (Vercel + any
`.env.local`) into the family password manager — that is what lets any future
job or fresh instance reconnect after re-provisioning.

## Recovery

Recovery **restores metadata first, then bytes** — the app never runs with
half the archive.

```bash
# 1. Database back (fresh cluster or restore-instance)
mongorestore --archive=kulaya-2026-08-07.gz --gzip
# 2. Object back
rclone sync backup:kulaya-mirror/photos r2:kulaya-photos/photos
rclone sync backup:kulaya-mirror/documents r2:kulaya-photos/documents
# 3. Verify
curl -s ${WEB_ORIGIN}/api/health-check   # db: connected, ping: true
```

### Scenario matrix

| Loss                            | Level            | Procedure                                                                                                                                                             |
| ------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single photo/doc deleted in-app | object-level gap | restore the R2 object from the deleted-phrase mirror; match `size`/`mimeType` against the metadata; if metadata also went, restore that Mongo doc too and stitch both |
| A whole collection missing      | DB               | `mongorestore` the latest dump of that collection onto the cluster; indexes rebuild from schema                                                                       |
| Whole Mongo cluster lost        | DB               | `mongorestore --archive` from the nightly rack to a fresh Atlas M0 (same `DATABASE_URL`, same secrets) — app comes back read-write with no code change                |
| R2 bucket emptied / writes fail | DB               | `rclone sync` the mirror back into primary; share links keep working, photos/docs render again                                                                        |
| Both Mongo + R2 lost            | painful          | restore Mongo then R2 from the **same-window snapshot pair**, never two snapshots days apart (keys must line up)                                                      |
| Phantom / orphan                | single-file      | delete the metadata that points at a 404 key, **or** re-register metadata from the mirror                                                                             |

### Dry-run drill

At least once per release (and before/after the deployment day milestone):

1. Confirm `$DATABASE_URL` + all secrets are reachable (from the config backup).
2. On a throwaway instance: `mongorestore` the latest dated archive.
3. `rclone sync` object mirrors into a throwaway R2/object.
4. Run the app pointed at the throwaway DB and browse a photo, a document, and
   a share link.
5. `GET /api/health-check` → `ok`. Done.

> Recovery without a tested path is optimism — run the drill, not the hope.

## Deletion — member accounts

Deleting a member's **account** is not exposed in the app yet, and it is
deliberately unlisted in the UI. The family-scale path today:

1. **Revoke access immediately:** admin sets `adminApprovalStatus →
rejected`; takes effect on their next request (`requireApprovedMember`
   re-checks live) — faster than deleting the row and safe for a "you're out
   of the circle" outcome.
2. Optional **hard erase** (a deliberate family-scale decision, per request):
   - remove the `User` doc (their refresh/session hashes become inert)
   - remove posts/comments authored by them (like comments, if the family
     prefers to keep them as anonymous cards, they remain — decide per case)
   - delete _their_ uploaded R2 objects and matching metadata

If you do a hard erase, say so in the family folder and confirm the backups
(-- [Backups](#backups)) still walk the archive timeline.

## Gaps and roadmap

| Gap                                | Current workaround                                 | Milestone                                    |
| ---------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| No in-app export                   | rclone + mongodump/mongoexport (manual)            | "Export the nest" candidate (see roadmap.md) |
| No recycle bin / soft-delete       | 30‑day deleted-phrase mirror (R2 only); Mongo hard | candidate: recycle-bin for photos/docs       |
| No account-deletion flow           | admin manual + DB edits                            | candidate milestone (incl. cascade)          |
| No orphan/phantom reconciliation   | manual review / incident path                      | "Storage audit" script                       |
| Backups not scheduled on free tier | cron on GitHub Actions / persistent host           | part of `M14 — deployment day`               |
| Notifications grow unbounded       | —                                                  | retention trimming milestone                 |

Keep this page truthful: mark a row **done** with code links and tests when a
feature lands. The [threat-model.md](threat-model.md) table tracks the
lifecycle implications (deletion == availability loss for the very few users).
