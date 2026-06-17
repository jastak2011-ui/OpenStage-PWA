# Parser System

`src/lib/chordpro.ts` parses raw ChordPro into a `ParsedChordPro` structure while preserving the original raw text on each song.

The parser:

- Extracts common metadata directives.
- Preserves unknown directives with warnings.
- Parses inline chords into chord/text tokens.
- Converts section directives into typed section lines for stage navigation.
- Keeps malformed lines as lyrics instead of failing the import.

Import failures should be reported through `reportError` and summarized in the import result rather than crashing the app.
