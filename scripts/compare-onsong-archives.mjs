import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const args = process.argv.slice(2);

if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
  console.log(`Usage:
  node scripts/compare-onsong-archives.mjs <genuine-onsong.archive> <openstage-generated.archive> [--out report.json] [--dump-dir reports/onsong]

Output:
  - machine-readable JSON report to stdout or --out
  - optional decoded inspection JSON files in --dump-dir
`);
  process.exit(args.length < 2 ? 1 : 0);
}

const [genuinePath, generatedPath] = args;
const outPath = optionValue('--out');
const dumpDir = optionValue('--dump-dir');

const inspectorPath = resolve('src/lib/onsongArchiveInspector-test-target.mjs');
try {
  await access(inspectorPath);
} catch {
  console.error('Missing src/lib/onsongArchiveInspector-test-target.mjs. Run npm.cmd run test:duration once, then rerun this comparison.');
  process.exit(1);
}

const { inspectOnSongArchive, diffOnSongArchiveInspections } = await import(`file:///${inspectorPath.replace(/\\/g, '/')}`);

const genuineBuffer = await readFile(resolve(genuinePath));
const generatedBuffer = await readFile(resolve(generatedPath));
const genuine = inspectOnSongArchive(
  genuineBuffer.buffer.slice(genuineBuffer.byteOffset, genuineBuffer.byteOffset + genuineBuffer.byteLength),
  basename(genuinePath)
);
const generated = inspectOnSongArchive(
  generatedBuffer.buffer.slice(generatedBuffer.byteOffset, generatedBuffer.byteOffset + generatedBuffer.byteLength),
  basename(generatedPath)
);
const diff = diffOnSongArchiveInspections(genuine, generated);

const report = {
  generatedAt: new Date().toISOString(),
  inputs: {
    genuine: resolve(genuinePath),
    generated: resolve(generatedPath)
  },
  summary: diff.summary,
  diff,
  validation: {
    genuine: genuine.validation,
    generated: generated.validation
  },
  container: {
    genuine: containerSummary(genuine),
    generated: containerSummary(generated)
  },
  classes: {
    genuine: genuine.classDictionaries,
    generated: generated.classDictionaries
  },
  roles: {
    genuine: genuine.roles,
    generated: generated.roles
  },
  relationships: {
    genuine: genuine.relationships,
    generated: generated.relationships
  }
};

if (dumpDir) {
  await mkdir(resolve(dumpDir), { recursive: true });
  await writeFile(resolve(dumpDir, `${safeName(basename(genuinePath))}.inspection.json`), JSON.stringify(genuine, null, 2));
  await writeFile(resolve(dumpDir, `${safeName(basename(generatedPath))}.inspection.json`), JSON.stringify(generated, null, 2));
}

const json = JSON.stringify(report, null, 2);
if (outPath) {
  await writeFile(resolve(outPath), json);
  console.log(`OnSong archive comparison written to ${resolve(outPath)}`);
  if (dumpDir) console.log(`Decoded inspections written to ${resolve(dumpDir)}`);
} else {
  console.log(json);
}

function optionValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : '';
}

function containerSummary(inspection) {
  return {
    fileName: inspection.fileName,
    fileLength: inspection.fileLength,
    header: inspection.header,
    trailer: inspection.trailer,
    objectCount: inspection.objects.length,
    topLevel: inspection.topLevel,
    reachableFromRootCount: inspection.reachableFromRoot.length,
    offsetTableHexLength: inspection.offsetTableHex.length
  };
}

function safeName(value) {
  return value.replace(/[^\w.-]+/g, '_');
}
