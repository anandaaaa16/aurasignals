import { Timeframe } from '../types';

export interface TimeframeSignalDuration {
  timeframe: Timeframe;
  durationSeconds: number;
  durationLabel: string;
  name: string;
  periodId: string;
  startMs: number;
  endMs: number;
  remainingSeconds: number;
  remainingFormatted: string;
  elapsedPercent: number;
}

export function getTimeframeSignalDuration(timeframe: Timeframe, date = new Date()): TimeframeSignalDuration {
  const nowMs = date.getTime();
  let durationSeconds = 300; // default M5: 5 minutes
  let durationLabel = '5 Menit';
  let name = 'M5 Sinyal 5 Menit';

  switch (timeframe) {
    case '5m':
      durationSeconds = 5 * 60; // 300s
      durationLabel = '5 Menit';
      name = 'M5 (Durasi 5 Menit)';
      break;
    case '15m':
      durationSeconds = 15 * 60; // 900s
      durationLabel = '15 Menit';
      name = 'M15 (Durasi 15 Menit)';
      break;
    case '1h':
      durationSeconds = 60 * 60; // 3600s
      durationLabel = '1 Jam';
      name = 'H1 (Durasi 1 Jam)';
      break;
    case '4h':
      durationSeconds = 4 * 3600; // 14400s
      durationLabel = '4 Jam';
      name = 'H4 (Durasi 4 Jam)';
      break;
    case '1d':
      durationSeconds = 24 * 3600; // 86400s
      durationLabel = '1 Hari (Daily Long)';
      name = 'Daily (Durasi 1 Hari)';
      break;
    default:
      durationSeconds = 15 * 60;
      durationLabel = '15 Menit';
      name = 'M15 (Durasi 15 Menit)';
  }

  const durationMs = durationSeconds * 1000;
  // Natural aligned period window (e.g., current 5m, 15m, 1h, 4h, or 1d window)
  const periodIndex = Math.floor(nowMs / durationMs);
  const startMs = periodIndex * durationMs;
  const endMs = startMs + durationMs;

  const remainingSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));
  const elapsedSeconds = Math.max(0, durationSeconds - remainingSeconds);
  const elapsedPercent = Math.min(100, Math.max(0, Math.round((elapsedSeconds / durationSeconds) * 100)));

  const hrs = Math.floor(remainingSeconds / 3600);
  const mins = Math.floor((remainingSeconds % 3600) / 60);
  const secs = remainingSeconds % 60;

  let remainingFormatted = '';
  if (hrs > 0) {
    remainingFormatted = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else {
    remainingFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const periodId = `PER-${timeframe}-${periodIndex}`;

  return {
    timeframe,
    durationSeconds,
    durationLabel,
    name,
    periodId,
    startMs,
    endMs,
    remainingSeconds,
    remainingFormatted,
    elapsedPercent,
  };
}
