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
  entryPoints: [resolve(root, 'src/lib/onsongSetlists.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'src/lib/onsongSetlists-test-target.mjs')
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
