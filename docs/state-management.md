# State Management

OpenStage uses Zustand in `src/store/useAppStore.ts`.

The store persists:

- performance state
- device profile
- stage theme
- pedal mappings
- diagnostics
- recent application logs

Business state that belongs to the library itself remains in IndexedDB through Dexie. UI and device preferences belong in the Zustand store.
