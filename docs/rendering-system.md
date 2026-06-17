# Rendering System

`src/services/rendering/songRenderer.ts` is the rendering pipeline.

Inputs:

- `Song`
- transpose amount
- Nashville toggle
- active song key

Outputs:

- rendered lines ready for UI display
- render diagnostics
- cache size

The renderer caches by song ID, update timestamp, transpose, Nashville mode, and key. This keeps next/previous song transitions fast and makes large songs cheaper to revisit.
