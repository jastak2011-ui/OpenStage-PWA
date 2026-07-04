import type { ReceiverDisplaySettings } from '../types';

export const prompterCapoModes = ['follow-ipad', 'no-capo', 'custom'] as const;

export type PrompterCapoMode = (typeof prompterCapoModes)[number];

export function normalizePrompterCapoMode(value: unknown): PrompterCapoMode {
  return prompterCapoModes.includes(value as PrompterCapoMode) ? value as PrompterCapoMode : 'follow-ipad';
}

export function normalizePrompterCapoValue(value: unknown) {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(12, parsed));
}

export function getEffectivePrompterCapo(sourceCapo: number, receiver: Pick<ReceiverDisplaySettings, 'prompterCapoMode' | 'prompterCapoValue'>) {
  const normalizedSourceCapo = normalizePrompterCapoValue(sourceCapo);
  const mode = normalizePrompterCapoMode(receiver.prompterCapoMode);
  if (mode === 'no-capo') return 0;
  if (mode === 'custom') return normalizePrompterCapoValue(receiver.prompterCapoValue);
  return normalizedSourceCapo;
}

export function getPrompterCapoTransposeOffset(sourceCapo: number, targetCapo: number) {
  return normalizePrompterCapoValue(sourceCapo) - normalizePrompterCapoValue(targetCapo);
}
