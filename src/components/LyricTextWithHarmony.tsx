import type React from 'react';
import { lyricHarmonyRenderModel, lyricHarmonyRenderModelFromParsed, parseHarmonyText, type HarmonyRange } from '../lib/harmony';

export type LyricTextWithHarmonyOptions = {
  harmonyRanges?: HarmonyRange[];
  showHarmonyCues: boolean;
  harmonyStyle: React.CSSProperties;
  showHarmonyDebug?: boolean;
};

export function renderLyricTextWithHarmony(text: string, options: LyricTextWithHarmonyOptions) {
  const model = options.harmonyRanges
    ? lyricHarmonyRenderModelFromParsed(text, options.harmonyRanges, { showHarmonyCues: options.showHarmonyCues })
    : lyricHarmonyRenderModel(text, { showHarmonyCues: options.showHarmonyCues });
  if (model.runs.length === 0) return model.text;

  return model.runs.map((run, index) => {
    return (
      <span
        key={`${run.start}-${run.end}-${index}`}
        data-harmony-span={run.harmony ? 'true' : undefined}
        style={{
          ...(run.styled ? options.harmonyStyle : undefined),
          ...(options.showHarmonyDebug && run.harmony
            ? {
                outline: '2px solid rgba(99,102,241,0.85)',
                outlineOffset: '0.08em',
                borderRadius: '0.12em'
              }
            : undefined)
        }}
      >
        {run.text}
      </span>
    );
  });
}

export function lyricTextHarmonyState(text: string, harmonyRanges?: HarmonyRange[]) {
  const parsed = harmonyRanges ? { text, ranges: harmonyRanges, hasHarmony: harmonyRanges.some((range) => range.end > range.start) } : parseHarmonyText(text);
  return {
    text: parsed.text,
    ranges: parsed.ranges,
    hasHarmony: parsed.ranges.some((range) => range.end > range.start)
  };
}
