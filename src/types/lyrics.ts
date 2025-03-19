export interface LyricLine {
  start: number;
  end?: number;
  text: string;
}

export interface HistoryState {
  lyrics: LyricLine[];
  audioFile: File | null;
  timestamp: number;
}

export type LyricState = 'past' | 'current' | 'future'; 