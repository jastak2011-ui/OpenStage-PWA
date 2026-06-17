# Storage And Sync

Local storage is the source of truth during performance.

- Songs and setlists live in IndexedDB via Dexie.
- Portable backups are created by `src/services/backup/backupService.ts`.
- Supabase sync is handled by `src/services/sync/syncEngine.ts`.

Sync is offline-first. Remote records are merged by update timestamp. Same-timestamp content differences become explicit conflicts instead of silent overwrites.

Future production sync should add per-user library IDs, row-level security policies, and a conflict review UI.
