# OpenStage Architecture

OpenStage is organized around a local-first PWA core:

- `src/store/useAppStore.ts` owns durable UI, performance, diagnostics, sync, and logging state with Zustand persistence.
- `src/data/` owns IndexedDB tables and Supabase client mapping.
- `src/services/rendering/` owns the song rendering pipeline for ChordPro, transpose, Nashville numbers, section output, and render cache diagnostics.
- `src/services/sync/` owns offline-first Supabase sync, cloud backup hooks, and conflict detection.
- `src/services/backup/` owns portable single-file backup and local checkpoint restore.
- `src/services/errors/` owns global error reporting and user-facing logs.
- `src/lib/chordpro.ts` owns ChordPro parsing/import normalization.

The long-term direction is to keep `App.tsx` as an application shell and continue moving individual screens into `src/components/`.
