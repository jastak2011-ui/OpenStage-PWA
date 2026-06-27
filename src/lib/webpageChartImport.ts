import type { Song, SongDisplayPreference } from '../types';
import { createId, createSongUuid } from './ids';

export type WebpageChartImportPreview = {
  song: Song;
  cleanedText: string;
  removedLines: string[];
  detectedFields: string[];
  warnings: string[];
};

const junkPatterns = [
  /^(?:advertisement|ad|sponsored|subscribe|sign up|log in|login|create account)$/i,
  /^(?:tabs?|chords?|lyrics?)\s+(?:for\s+)?this\s+song$/i,
  /^(?:rating|ratings?|comments?|reviews?)\b/i,
  /^(?:ultimate guitar|songsterr|e-chords|azlyrics|genius)\b/i,
  /^(?:print|download|share|transpose|autoscroll|simplify)\b/i,
  /^(?:add to playlist|favorite|view official tab|pro access)\b/i,
  /^(?:strumming|there is no strumming pattern|difficulty:|tuning:|capo:|key:|bpm:|tempo:)/i,
  /^\d+\s*(?:comments?|ratings?|views?)$/i,
  /^[★☆\d.\s/]+$/i,
];

export function parseWebpageChartText(rawText: string): WebpageChartImportPreview {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\u00a0/g, ' ');
  const allLines = normalized.split('\n').map((line) => line.replace(/\s+$/g, ''));
  const removedLines: string[] = [];
  const metadataLines: string[] = [];
  const chartLines: string[] = [];

  allLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (chartLines.length && chartLines[chartLines.length - 1] !== '') chartLines.push('');
      return;
    }
    if (isMetadataLine(trimmed)) {
      metadataLines.push(trimmed);
      return;
    }
    if (isJunkLine(trimmed)) {
      removedLines.push(trimmed);
      return;
    }
    chartLines.push(line);
  });

  const compactChartLines = trimBlankEdges(chartLines);
  const metadata = inferMetadata(metadataLines, compactChartLines);
  const detectedFields: string[] = [];
  if (metadata.title) detectedFields.push('title');
  if (metadata.artist) detectedFields.push('artist');
  if (metadata.key) detectedFields.push('key');
  if (metadata.capo !== undefined) detectedFields.push('capo');
  if (metadata.bpm) detectedFields.push('BPM');
  if (metadata.tuning) detectedFields.push('tuning');

  const chart = stripDuplicateHeaderLines(compactChartLines, metadata.title, metadata.artist).join('\n').trimEnd();
  const displayPreference = detectDisplayPreference(chart);
  const now = new Date().toISOString();
  const song: Song = {
    id: createId('song'),
    songUuid: createSongUuid(),
    title: metadata.title || 'Pasted Webpage Chart',
    artist: metadata.artist || '',
    key: metadata.key || '',
    capo: metadata.capo ?? 0,
    bpm: metadata.bpm ?? 0,
    timeSignature: '4/4',
    tags: ['webpage'],
    genre: '',
    vibe: '',
    crowdScore: undefined,
    danceability: undefined,
    energy: undefined,
    vocalRange: '',
    vocalDifficulty: '',
    openerCandidate: false,
    closerCandidate: false,
    difficulty: '',
    tuning: metadata.tuning || 'Standard',
    originalKey: metadata.key || '',
    performanceKey: metadata.key || '',
    durationSeconds: undefined,
    year: undefined,
    bandNotes: '',
    rehearsalNotes: [],
    notes: removedLines.length ? `Removed webpage junk:\n${removedLines.slice(0, 12).join('\n')}` : '',
    referenceAudioUrl: '',
    chart,
    favorite: false,
    displayPreference,
    rawChordPro: chart,
    parsedChordPro: undefined,
    updatedAt: now,
  };

  return {
    song,
    cleanedText: chart,
    removedLines,
    detectedFields,
    warnings: chart ? [] : ['No chart text detected after cleanup.'],
  };
}

function inferMetadata(metadataLines: string[], chartLines: string[]) {
  const result: { title?: string; artist?: string; key?: string; capo?: number; bpm?: number; tuning?: string } = {};

  metadataLines.forEach((line) => {
    const keyMatch = line.match(/^(?:key|original key)\s*(?::|\-)?\s+(.+)$/i);
    if (keyMatch) result.key = keyMatch[1].trim();
    const capoMatch = line.match(/^capo\s*(?::|\-)?\s*(\d{1,2}|no capo)$/i);
    if (capoMatch) result.capo = capoMatch[1].toLowerCase() === 'no capo' ? 0 : Number(capoMatch[1]);
    const bpmMatch = line.match(/^(?:bpm|tempo)\s*(?::|\-)?\s*(\d{2,3})\b/i);
    if (bpmMatch) result.bpm = Number(bpmMatch[1]);
    const tuningMatch = line.match(/^tuning\s*(?::|\-)?\s+(.+)$/i);
    if (tuningMatch) result.tuning = tuningMatch[1].trim();
  });

  const nonEmpty = chartLines.map((line) => line.trim()).filter(Boolean);
  const byLineIndex = nonEmpty.findIndex((line) => /^by\s+.+/i.test(line));
  if (byLineIndex > 0) {
    result.title = result.title || nonEmpty[byLineIndex - 1];
    result.artist = result.artist || nonEmpty[byLineIndex].replace(/^by\s+/i, '').trim();
  }

  if (!result.title && nonEmpty[0] && !isLikelyChartLine(nonEmpty[0])) result.title = cleanHeaderText(nonEmpty[0]);
  if (!result.artist && nonEmpty[1] && !isLikelyChartLine(nonEmpty[1])) {
    const second = cleanHeaderText(nonEmpty[1]).replace(/^by\s+/i, '').trim();
    if (!looksLikeMetadataLabel(second)) result.artist = second;
  }

  return result;
}

function isMetadataLine(line: string) {
  return /^(?:key|original key|capo|bpm|tempo|tuning)(?:\s*[:\-]|\s+)/i.test(line);
}

function isJunkLine(line: string) {
  if (line.length > 160 && !/[A-G](?:#|b)?m?\b/.test(line)) return true;
  return junkPatterns.some((pattern) => pattern.test(line));
}

function isLikelyChartLine(line: string) {
  return isChordOnlyLine(line) || /\[[A-G](?:#|b)?[^\]]*\]/.test(line) || looksLikeMetadataLabel(line);
}

function isChordOnlyLine(line: string) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  const chordLike = tokens.filter((token) => /^[|:({\[]*[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*?(?:\/[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*)?[|:)}\]]*$/i.test(token));
  return chordLike.length >= Math.max(1, Math.ceil(tokens.length * 0.7));
}

function detectDisplayPreference(chart: string): SongDisplayPreference {
  if (/\[[A-G](?:#|b)?[^\]]*\]/.test(chart)) return 'inline';
  const lines = chart.split('\n');
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (isChordOnlyLine(lines[index]) && lines[index + 1]?.trim() && !isChordOnlyLine(lines[index + 1])) return 'chords-over';
  }
  return 'chords-over';
}

function stripDuplicateHeaderLines(lines: string[], title?: string, artist?: string) {
  const next = [...lines];
  while (next.length && !next[0].trim()) next.shift();
  if (title && cleanHeaderText(next[0] || '').toLowerCase() === title.toLowerCase()) next.shift();
  while (next.length && !next[0].trim()) next.shift();
  if (artist && cleanHeaderText(next[0] || '').replace(/^by\s+/i, '').trim().toLowerCase() === artist.toLowerCase()) next.shift();
  return trimBlankEdges(next);
}

function trimBlankEdges(lines: string[]) {
  const next = [...lines];
  while (next.length && !next[0].trim()) next.shift();
  while (next.length && !next[next.length - 1].trim()) next.pop();
  return next;
}

function cleanHeaderText(line: string) {
  return line.replace(/\s+(?:chords|lyrics|tab)$/i, '').trim();
}

function looksLikeMetadataLabel(line: string) {
  return /^(?:key|capo|bpm|tempo|tuning|difficulty|rating|comments?)\s*[:\-]/i.test(line);
}
