import { build } from 'esbuild';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

await build({
  entryPoints: [resolve(root, 'src/lib/format.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/format-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/autoscroll.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/autoscroll-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/autoscrollButton.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/autoscrollButton-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/aiDraft.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/aiDraft-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/searchImport.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/searchImport-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/chartSourceSearch.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/chartSourceSearch-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'server/musicbrainz.js')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/musicbrainz-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'server/songsterr.js')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/songsterr-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/chords.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/chords-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/chordLayout.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/chordLayout-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/chordpro.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/chordpro-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/harmony.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/harmony-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/ids.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/ids-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/importExport.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/importExport-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/webpageChartImport.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/webpageChartImport-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/stageGestures.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/stageGestures-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/stageToolbar.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/stageToolbar-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/data/databaseIdentity.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/data/databaseIdentity-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/data/legacyLibraryMigration.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/data/legacyLibraryMigration-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/store/settingsStorageKeys.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/store/settingsStorageKeys-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/sharedSongImport.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/sharedSongImport-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/stageHarmonyEdit.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/stageHarmonyEdit-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/tempo.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/tempo-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/prompterCapo.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/prompterCapo-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/services/externalDisplay.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/services/externalDisplay-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/displaySettings.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/displaySettings-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/onsongArchive.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/onsongArchive-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/onsongSanitize.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/onsongSanitize-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/onsongArchiveWriter.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/onsongArchiveWriter-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/onsongArchiveValidator.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/onsongArchiveValidator-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/onsongArchiveInspector.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/onsongArchiveInspector-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/onsongSetlistImport.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/onsongSetlistImport-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/lib/setlists.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/setlists-test-target.mjs')
});

await build({
  entryPoints: [resolve(root, 'src/services/rendering/songRenderer.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/services/rendering/songRenderer-test-target.mjs')
});

await import(pathToFileURL(resolve(root, 'src/lib/format.test.mjs')).href);
