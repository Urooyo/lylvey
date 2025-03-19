'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import styles from "./page.module.css";
import { getText, Language } from "@/i18n";
import { cn } from "@/lib/utils";

// shadcn/ui 컴포넌트 import
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Settings } from '@/components/Settings';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Pause, 
  Settings as SettingsIcon, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  PanelLeftClose, 
  PanelLeftOpen 
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";

interface LyricLine {
  start: number;
  end?: number;
  text: string;
}

interface HistoryState {
  lyrics: LyricLine[];
  audioFile: File | null;
  timestamp: number;
}

export default function LiveLyricsPage() {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<"apple" | "subtitle">("apple");
  const [duration, setDuration] = useState<number>(0);

  const [alignment, setAlignment] = useState<
    "textAlignLeft" | "textAlignCenter" | "textAlignRight"
  >("textAlignCenter");

  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(300);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState<boolean>(false);
  const savedWidthRef = useRef<number>(300);

  const [newLyricStartTime, setNewLyricStartTime] = useState<number>(0);
  const [newLyricEndTime, setNewLyricEndTime] = useState<number>(0);
  const [newLyricText, setNewLyricText] = useState<string>("");
  const [isAddLyricDialogOpen, setIsAddLyricDialogOpen] = useState<boolean>(false);

  const [language, setLanguage] = useState<Language>('ko');
  const t = getText(language);

  const isVideoFile = audioFile?.type.startsWith('video/');

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 수정할 가사 상태 추가
  const [editingLyric, setEditingLyric] = useState<{ index: number; line: LyricLine } | null>(null);
  const [isEditLyricDialogOpen, setIsEditLyricDialogOpen] = useState<boolean>(false);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [showSettings, setShowSettings] = useState<boolean>(true);

  // requestAnimationFrame 참조 저장
  const rafRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number>(0);
  const targetFPSInterval = 1000 / 30; // 30fps로 제한

  // 가사 프리뷰 최적화 관련 상수 및 유틸리티 함수
  const VIRTUALIZE_THRESHOLD = 50; // 가사가 이 개수 이상일 때 가상화 적용

  // 활성 가사 인덱스 계산 - 메모이제이션 적용
  const getActiveLyricIndex = useCallback((currentTime: number, lyricsArray: LyricLine[]): number => {
    if (lyricsArray.length === 0) return -1;
    
    // 디버깅: 현재 시간 로깅 (10초마다 한 번씩만)
    if (Math.floor(currentTime * 10) % 100 === 0) {
      console.log(`현재 시간: ${formatTime(currentTime)}`);
      
      // 가사 상태 확인 (현재 시간 근처의 가사만)
      const nearLyrics = lyricsArray.filter(line => 
        Math.abs(line.start - currentTime) < 10 || 
        (line.end && Math.abs(line.end - currentTime) < 10)
      );
      
      if (nearLyrics.length > 0) {
        console.log('현재 시간 근처 가사:', nearLyrics.map(line => ({
          시작: formatTime(line.start),
          종료: line.end ? formatTime(line.end) : '없음',
          텍스트: line.text.substring(0, 20) + (line.text.length > 20 ? '...' : '')
        })));
      }
    }
    
    // 현재 시간에 해당하는 가사 찾기 (현재 활성화된 가사)
    const activeIndex = lyricsArray.findIndex((line) => {
      // 현재 시간이 시작 시간과 종료 시간 사이에 있는 경우만 활성화
      return currentTime >= line.start && (!line.end || currentTime < line.end);
    });
    
    // 활성 인덱스가 변경될 때 로깅
    if (activeIndex !== -1 && activeIndex !== prevActiveIndexRef.current) {
      const activeLyric = lyricsArray[activeIndex];
      console.log(`활성 가사 변경: 인덱스=${activeIndex}, 시작=${formatTime(activeLyric.start)}, 종료=${activeLyric.end ? formatTime(activeLyric.end) : '없음'}`);
    }
    
    // 활성화된 가사가 없는 경우 (가사 사이 간격이거나 모든 가사가 종료된 경우)
    if (activeIndex === -1) {
      // 1. 종료된 가사 중 가장 마지막 가사 찾기
      const lastEndedLyric = lyricsArray
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.end && currentTime >= line.end)
        .sort((a, b) => b.line.end! - a.line.end!)[0];
      
      if (lastEndedLyric) {
        console.log(`모든 가사 종료됨: 마지막 가사 유지 (인덱스=${lastEndedLyric.index})`);
        return lastEndedLyric.index;
      }
      
      // 2. 아직 시작 전인 경우 첫 번째 가사 반환
      if (lyricsArray.length > 0 && currentTime < lyricsArray[0].start) {
        return 0;
      }
    }
    
    return activeIndex;
  }, []);

  // 가사 상태 계산을 위한 추가 함수
  const getLyricState = useCallback((index: number, currentTime: number, lyrics: LyricLine[]) => {
    const line = lyrics[index];
    if (!line) return 'future';
    
    // 현재 시간이 가사의 시작 시간보다 작으면 '미래' 가사
    if (currentTime < line.start) {
      return 'future';
    }
    
    // 현재 시간이 가사의 종료 시간보다 크면 '과거' 가사
    if (line.end && currentTime >= line.end) {
      return 'past';
    }
    
    // 그 외의 경우는 '현재' 가사
    return 'current';
  }, []);

  // 정렬된 가사 목록 메모이제이션
  const sortedLyrics = useMemo(() => {
    return [...lyrics].sort((a, b) => a.start - b.start);
  }, [lyrics]);

  // 활성 가사 인덱스 메모이제이션
  const activeLyricIndex = useMemo(() => 
    getActiveLyricIndex(currentTime, sortedLyrics), 
  [currentTime, sortedLyrics, getActiveLyricIndex]);

  // 가상화된 가사 목록 - 활성 가사 주변 항목만 렌더링
  const virtualizedLyrics = useMemo(() => {
    if (sortedLyrics.length <= VIRTUALIZE_THRESHOLD) {
      return sortedLyrics; // 적은 수의 가사는 전체 렌더링
    }

    // 활성 인덱스가 없는 경우(-1)를 처리
    const safeActiveIndex = activeLyricIndex >= 0 ? activeLyricIndex : 0;
    
    const windowSize = 20; // 활성 항목 위아래로 표시할 항목 수 (증가)
    const start = Math.max(0, safeActiveIndex - windowSize);
    const end = Math.min(sortedLyrics.length, safeActiveIndex + windowSize + 1);
    
    return sortedLyrics.slice(start, end);
  }, [sortedLyrics, activeLyricIndex]);

  // 가상화된 가사의 시작 인덱스
  const virtualizedStartIndex = useMemo(() => {
    if (sortedLyrics.length <= VIRTUALIZE_THRESHOLD) {
      return 0;
    }
    
    // 활성 인덱스가 없는 경우(-1)를 처리
    const safeActiveIndex = activeLyricIndex >= 0 ? activeLyricIndex : 0;
    const windowSize = 20; // 활성 항목 위아래로 표시할 항목 수 (증가)
    return Math.max(0, safeActiveIndex - windowSize);
  }, [sortedLyrics.length, activeLyricIndex]);

  // 비디오 동기화 최적화
  const syncVideo = useCallback((time: number) => {
    if (!isVideoFile || !videoRef.current) return;
    
    if (Math.abs(videoRef.current.currentTime - time) > 0.5) {
      videoRef.current.currentTime = time;
    }
  }, [isVideoFile]);

  // 시간 업데이트 핸들러 최적화
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    
    if (isVideoFile && videoRef.current) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      syncVideo(time);
    }
  }, [isVideoFile, syncVideo]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  // 오디오/비디오 상태 변경 감지
  useEffect(() => {
    const currentAudioRef = audioRef.current;
    const currentVideoRef = videoRef.current;

    if (!currentAudioRef) return;

    const handlePlay = async () => {
      setIsPlaying(true);
      if (currentVideoRef && currentVideoRef.paused) {
        try {
          await currentVideoRef.play();
        } catch (error) {
          console.error('Video play error:', error);
        }
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (currentVideoRef && !currentVideoRef.paused) {
        currentVideoRef.pause();
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (currentVideoRef) {
        currentVideoRef.pause();
      }
    };

    const handleVideoPlay = async () => {
      setIsPlaying(true);
      if (currentAudioRef.paused) {
        try {
          await currentAudioRef.play();
        } catch (error) {
          console.error('Audio play error:', error);
        }
      }
    };

    const handleVideoPause = () => {
      setIsPlaying(false);
      if (!currentAudioRef.paused) {
        currentAudioRef.pause();
      }
    };

    // 초기 상태 동기화
    setIsPlaying(!currentAudioRef.paused);

    currentAudioRef.addEventListener('play', handlePlay);
    currentAudioRef.addEventListener('pause', handlePause);
    currentAudioRef.addEventListener('ended', handleEnded);

    if (currentVideoRef) {
      currentVideoRef.addEventListener('play', handleVideoPlay);
      currentVideoRef.addEventListener('pause', handleVideoPause);
    }

    return () => {
      currentAudioRef.removeEventListener('play', handlePlay);
      currentAudioRef.removeEventListener('pause', handlePause);
      currentAudioRef.removeEventListener('ended', handleEnded);

      if (currentVideoRef) {
        currentVideoRef.removeEventListener('play', handleVideoPlay);
        currentVideoRef.removeEventListener('pause', handleVideoPause);
      }
    };
  }, []);

  // 비디오 요소 최적화
  const videoElement = useMemo(() => {
    if (!audioURL) return null;
    
    return (
      <video
        src={audioURL}
        className="w-full h-full object-contain"
        ref={videoRef}
        onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        playsInline
        controls
        style={{ 
          maxHeight: "720px",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          perspective: "1000px"
        }}
      >
        <source
          src={audioURL}
          type={audioFile?.type}
        />
      </video>
    );
  }, [audioURL, handleTimeUpdate, audioFile?.type]);

  // 가사 클릭 핸들러 개선
  const handleLyricClick = useCallback((startTime: number) => {
    if (!audioRef.current) return;
    
    try {
      // 1. 현재 재생 상태 저장
      const wasPlaying = !audioRef.current.paused;
      
      // 2. 정확한 시간 설정 (일시 정지 없이 직접 설정)
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      
      // 3. 비디오 동기화 (필요시)
      if (isVideoFile && videoRef.current) {
        videoRef.current.currentTime = startTime;
      }
      
      // 4. 스크롤 즉시 적용 (애니메이션 없이)
      if (previewMode === "apple" && previewRef.current) {
        const container = previewRef.current;
        if (!container) return;
        
        const targetIndex = sortedLyrics.findIndex(line => line.start === startTime);
        const targetElement = container.querySelector(`[data-index="${targetIndex}"]`);
        
        if (targetElement) {
          // 자동 스크롤 중지 및 애니메이션 취소
          if (scrollAnimationRef.current) {
            cancelAnimationFrame(scrollAnimationRef.current);
            scrollAnimationRef.current = null;
          }
          
          // 대상 요소 위치로 즉시 스크롤
          const containerRect = container.getBoundingClientRect();
          const targetRect = targetElement.getBoundingClientRect();
          const offset = targetRect.top - containerRect.top - 
                        (container.clientHeight / 2) + (targetRect.height / 2);
                        
          // 애니메이션 없이 즉시 스크롤
          container.scrollTop = container.scrollTop + offset;
          
          // 활성 인덱스 직접 업데이트
          prevActiveIndexRef.current = targetIndex;
        }
      }
    } catch (err) {
      console.error("가사 클릭 처리 오류:", err);
    }
  }, [previewMode, sortedLyrics, isVideoFile]);

  // 시간을 hh:mm:ss.ms 형식으로 변환
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // 시간 문자열을 초 단위로 변환
  const timeToSeconds = (timeStr: string): number => {
    const [time, ms] = timeStr.split('.');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + (Number(ms) || 0) / 1000;
  };

  // SRT 시간 문자열 -> 초 단위 숫자로 변환
  const srtTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(/[:,]/);
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    const milliseconds = parseInt(parts[3], 10);
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  };

  // SRT 파일 내용을 파싱
  const parseSRT = (srt: string): LyricLine[] => {
    const regex =
      /(\d+)\s+(\d{2}:\d{2}:\d{2},\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2},\d{3})\s+([\s\S]*?)(?=\n\n|\n*$)/g;
    const lines: LyricLine[] = [];
    let match;
    while ((match = regex.exec(srt)) !== null) {
      const start = srtTimeToSeconds(match[2]);
      const end = srtTimeToSeconds(match[3]);
      const text = match[4].trim();
      lines.push({ start, end, text });
      console.log(`가사 파싱: 시작=${formatTime(start)}, 종료=${formatTime(end)}, 텍스트=${text}`);
    }
    return lines;
  };

  // 히스토리에 현재 상태 추가
  const addToHistory = (newLyrics: LyricLine[], newAudioFile: File | null = audioFile) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      lyrics: newLyrics,
      audioFile: newAudioFile,
      timestamp: Date.now()
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 실행 취소
  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setLyrics(prevState.lyrics);
      
      // 오디오 파일 상태 복원
      setAudioFile(prevState.audioFile);
      if (prevState.audioFile) {
        const url = URL.createObjectURL(prevState.audioFile);
        setAudioURL(url);
      } else {
        setAudioURL(null);
      }
    }
  };

  // 다시 실행
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setLyrics(nextState.lyrics);
      
      // 오디오 파일 상태 복원
      setAudioFile(nextState.audioFile);
      if (nextState.audioFile) {
        const url = URL.createObjectURL(nextState.audioFile);
        setAudioURL(url);
      } else {
        setAudioURL(null);
      }
    }
  };

  // 키보드 단축키 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'n':
            e.preventDefault();
            handleNew();
            break;
          case 'o':
            e.preventDefault();
            document.getElementById('srt-upload')?.click();
            break;
          case 's':
            e.preventDefault();
            if (lyrics.length > 0) {
              exportToSRT();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, lyrics]);

  // 초기 상태를 히스토리에 추가
  useEffect(() => {
    if (history.length === 0) {
      addToHistory([], null);
    }
  }, []);

  // 가사 추가 시 히스토리 추가
  const handleAddLyric = () => {
    if (newLyricText.trim()) {
      const newLine: LyricLine = {
        start: newLyricStartTime,
        end: newLyricEndTime,
        text: newLyricText.trim()
      };
      // 시간 순서대로 정렬
      const newLyrics = [...lyrics, newLine].sort((a, b) => a.start - b.start);
      setLyrics(newLyrics);
      addToHistory(newLyrics, audioFile);
      setNewLyricText("");
      setNewLyricStartTime(0);
      setNewLyricEndTime(5);
      setIsAddLyricDialogOpen(false);
    }
  };

  // 가사 삭제 시 히스토리 추가
  const handleDeleteLyric = (index: number) => {
    const newLyrics = lyrics.filter((_, i) => i !== index);
    setLyrics(newLyrics);
    addToHistory(newLyrics, audioFile);
  };

  // 가사 수정 시 히스토리 추가
  const editLyricLine = () => {
    if (!editingLyric) return;

    const newLyrics = [...lyrics];
    newLyrics[editingLyric.index] = {
      start: editingLyric.line.start,
      end: editingLyric.line.end,
      text: editingLyric.line.text.trim()
    };

    // 시간 순서대로 정렬
    const sortedLyrics = newLyrics.sort((a, b) => a.start - b.start);
    setLyrics(sortedLyrics);
    addToHistory(sortedLyrics, audioFile);
    setEditingLyric(null);
    setIsEditLyricDialogOpen(false);
  };

  // SRT 파일 업로드 시 히스토리 추가
  const handleSrtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const srtText = event.target?.result as string;
        const parsedLyrics = parseSRT(srtText);
        setLyrics(parsedLyrics);
        addToHistory(parsedLyrics, audioFile);  // audioFile 유지
      };
      reader.readAsText(file);
    }
  };

  // 오디오/비디오 파일 업로드
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(file);
      setAudioURL(url);
      
      // 상태가 업데이트된 후에 히스토리에 추가
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        lyrics,
        audioFile: file,
        timestamp: Date.now()
      });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  // 미리보기 영역에서 활성 가사가 보이도록 부드럽게 스크롤 - 최적화
  const previewRef = useRef<HTMLDivElement>(null);
  const prevActiveIndexRef = useRef<number>(-1);
  const scrollAnimationRef = useRef<number | null>(null);
  
  useEffect(() => {
    // 활성 가사 인덱스가 변경된 경우에만 스크롤 수행
    if (activeLyricIndex !== prevActiveIndexRef.current && previewMode === "apple" && previewRef.current) {
      prevActiveIndexRef.current = activeLyricIndex;
      
      const container = previewRef.current;
      const activeElement = container.querySelector(`[data-index="${activeLyricIndex}"]`);
      
      if (activeElement) {
        // 이전 스크롤 애니메이션 취소
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
          scrollAnimationRef.current = null;
        }

        // 스크롤 목표 계산
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        const offset =
          activeRect.top -
          containerRect.top -
          container.clientHeight / 2 +
          activeRect.height / 2;
        
        // 스크롤 애니메이션 함수
        const duration = 800; // 애니메이션 지속 시간
        const startTime = performance.now();
        const startPosition = container.scrollTop;
        const targetPosition = container.scrollTop + offset;
        
        // 이미 가까이 있으면 애니메이션 건너뛰기 (불필요한 애니메이션 최적화)
        if (Math.abs(offset) < 10) {
          return;
        }
        
        // easeOutQuint 이징 함수 - 부드러운 애니메이션
        const easeOutQuint = (t: number): number => {
          return 1 - Math.pow(1 - t, 5);
        };
        
        // 애니메이션 프레임 실행 - 성능 최적화
        const animateScroll = (timestamp: number) => {
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeOutQuint(progress);
          
          // transform 사용하지 않고 scrollTop 직접 조작 (더 성능 좋음)
          container.scrollTop = startPosition + (targetPosition - startPosition) * easedProgress;
          
          if (progress < 1) {
            scrollAnimationRef.current = requestAnimationFrame(animateScroll);
          } else {
            scrollAnimationRef.current = null;
          }
        };
        
        // 애니메이션 즉시 시작
        scrollAnimationRef.current = requestAnimationFrame(animateScroll);
      }
    }
  }, [activeLyricIndex, previewMode]);

  // 시간 입력 컴포넌트
  const TimeInput = ({ value, onChange, label, disabled }: { value: number; onChange: (value: number) => void; label: string; disabled?: boolean }) => {
    const [inputValue, setInputValue] = useState(formatTime(value));
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // 편집 중이 아닐 때만 외부 값 변경을 반영
    useEffect(() => {
      if (!isEditing) {
        setInputValue(formatTime(value));
      }
    }, [value, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
    };

    const handleBlur = () => {
      setIsEditing(false);
      if (/^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(inputValue)) {
        onChange(timeToSeconds(inputValue));
      } else {
        setInputValue(formatTime(value));
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
      } else if (e.key === 'Escape') {
        setInputValue(formatTime(value));
        setIsEditing(false);
        e.currentTarget.blur();
      }
    };

    // 숫자 키를 누를 때 자동으로 편집 모드로 전환
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isEditing && /[\d]/.test(e.key)) {
        setIsEditing(true);
        setInputValue(e.key);
        e.preventDefault();
      }
    };

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-4">
          <div className="relative w-[180px]">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleChange}
              onFocus={() => setIsEditing(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onKeyPress={handleKeyPress}
              placeholder="00:00:00.000"
              className="font-mono"
              disabled={disabled}
            />
          </div>
          <Slider
            value={[value]}
            onValueChange={([v]) => {
              if (!isEditing && !disabled) {
                onChange(v);
              }
            }}
            max={duration || 300}
            step={0.001}
            className={cn("flex-1", disabled && "opacity-50 cursor-not-allowed")}
            disabled={disabled}
          />
        </div>
      </div>
    );
  };

  // 가사 추가 다이얼로그 내용
  const [selectedTimeTab, setSelectedTimeTab] = useState<"current" | "last">("current");

  const handleAddLyricDialogOpen = () => {
    setSelectedTimeTab("current");
    updateNewLyricTimes("current");
    setIsAddLyricDialogOpen(true);
  };

  const updateNewLyricTimes = (tab: "current" | "last") => {
    if (tab === "current") {
    if (audioRef.current) {
        setNewLyricStartTime(audioRef.current.currentTime);
        setNewLyricEndTime(audioRef.current.currentTime + 5);
      } else {
        setNewLyricStartTime(0);
        setNewLyricEndTime(5);
      }
    } else {
      const lastLyric = [...lyrics].sort((a, b) => b.start - a.start)[0];
      if (lastLyric?.end) {
        setNewLyricStartTime(lastLyric.end);
        setNewLyricEndTime(lastLyric.end + 5);
      } else if (lastLyric?.start) {
        setNewLyricStartTime(lastLyric.start + 5);
        setNewLyricEndTime(lastLyric.start + 10);
      } else {
        setNewLyricStartTime(0);
        setNewLyricEndTime(5);
      }
    }
  };

  // 왼쪽 패널 토글
  const toggleLeftPanel = () => {
    if (isLeftPanelCollapsed) {
      // 펼치기
      setIsLeftPanelCollapsed(false);
      setLeftPanelWidth(savedWidthRef.current);
    } else {
      // 접기
      savedWidthRef.current = leftPanelWidth;
      setIsLeftPanelCollapsed(true);
      setLeftPanelWidth(56); // 아이콘 버튼만 표시할 최소 너비
    }
  };

  // 드래그로 왼쪽 패널의 너비 조절
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLeftPanelCollapsed) return; // 접혀있을 때는 리사이징 비활성화
    
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(200, startWidth + delta);
      setLeftPanelWidth(newWidth);
      savedWidthRef.current = newWidth;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // 재생 중지
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // SRT 형식으로 가사 내보내기
  const exportToSRT = () => {
    const srtContent = lyrics
      .sort((a, b) => a.start - b.start)
      .map((line, index) => {
        const startTime = new Date(line.start * 1000).toISOString().slice(11, 23).replace('.', ',');
        const endTime = line.end 
          ? new Date(line.end * 1000).toISOString().slice(11, 23).replace('.', ',')
          : new Date((line.start + 5) * 1000).toISOString().slice(11, 23).replace('.', ',');
        
        return `${index + 1}\n${startTime} --> ${endTime}\n${line.text}\n`;
      })
      .join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lyrics.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [showNewConfirmDialog, setShowNewConfirmDialog] = useState<boolean>(false);

  // 새로운 가사 목록 시작
  const handleNew = () => {
    if (lyrics.length > 0 || audioFile) {
      setShowNewConfirmDialog(true);
    }
  };

  const handleConfirmNew = () => {
    setLyrics([]);
    setAudioFile(null);
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    // 히스토리 초기화
    setHistory([{
      lyrics: [],
      audioFile: null,
      timestamp: Date.now()
    }]);
    setHistoryIndex(0);
    setShowNewConfirmDialog(false);

    // 페이지 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const [showAnimation, setShowAnimation] = useState<boolean>(true);

  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isUserScrolling, setIsUserScrolling] = useState<boolean>(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const userScrollTimeout = useRef<NodeJS.Timeout>();
  const autoScrollInProgress = useRef<boolean>(false);

  // 테이블 자동 스크롤 효과
  useEffect(() => {
    if (!autoScroll || !tableRef.current) return;

    const container = tableRef.current;
    const activeRow = container.querySelector(`tr:nth-child(${activeLyricIndex + 1})`);
    
    if (activeRow) {
      autoScrollInProgress.current = true;
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeRow.getBoundingClientRect();
      const offset =
        activeRect.top -
        containerRect.top -
        container.clientHeight / 2 +
        activeRect.height / 2;
      
      container.scrollTo({ top: container.scrollTop + offset, behavior: "smooth" });

      // 자동 스크롤이 완료되면 플래그를 해제
      setTimeout(() => {
        autoScrollInProgress.current = false;
      }, 500); // 스크롤 애니메이션 시간과 동일하게 설정
    }
  }, [activeLyricIndex, autoScroll]);

  // 사용자 스크롤 감지
  const handleTableScroll = () => {
    // 자동 스크롤 중이면 무시
    if (autoScrollInProgress.current) return;

    setAutoScroll(false);
    setIsUserScrolling(true);
    
    // 스크롤 후 5초 뒤에 자동 스크롤 다시 활성화
    if (userScrollTimeout.current) {
      clearTimeout(userScrollTimeout.current);
    }
    userScrollTimeout.current = setTimeout(() => {
      setAutoScroll(true);
      setIsUserScrolling(false);
    }, 5000);
  };

  // 메모이제이션된 미리보기 렌더링 최적화 - 가사 애니메이션 최적화
  const LyricsPreview = useMemo(() => {
    if (previewMode !== "apple") return null;
    
    // 가상화된 높이 계산 (가상 리스트의 시작 위치를 설정하기 위함)
    const paddingTop = virtualizedStartIndex * 48; // 평균 라인 높이 48px
    
    return (
      <div ref={previewRef} className={styles.lyricsPreview}>
        <div 
          className={styles[alignment]} 
          style={
            sortedLyrics.length > VIRTUALIZE_THRESHOLD 
            ? { paddingTop: `${paddingTop}px`, paddingBottom: `${(sortedLyrics.length - virtualizedStartIndex - virtualizedLyrics.length) * 48}px` }
            : {}
          }
        >
          {virtualizedLyrics.map((line, localIndex) => {
            const globalIndex = sortedLyrics.length > VIRTUALIZE_THRESHOLD 
              ? virtualizedStartIndex + localIndex 
              : localIndex;
            
            // 가사의 상태 계산 (current, past, future)
            const lyricState = getLyricState(globalIndex, currentTime, sortedLyrics);
            const isActive = globalIndex === activeLyricIndex;
            
            return (
              <div
                key={`${globalIndex}-${line.start}-${line.end || 'end'}`}
                className={cn(
                  styles.lyricLine,
                  // 상태에 따른 스타일 우선순위 조정
                  lyricState === 'past' ? styles.past : 
                  lyricState === 'future' ? styles.future : 
                  (isActive ? styles.active : styles.inactive),
                  !showAnimation && styles.noAnimation
                )}
                onClick={(e) => {
                  e.stopPropagation(); // 이벤트 버블링 방지
                  handleLyricClick(line.start);
                }}
                data-index={globalIndex}
                data-start={line.start}
                data-end={line.end}
                data-state={lyricState}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [previewMode, sortedLyrics, virtualizedLyrics, virtualizedStartIndex, alignment, activeLyricIndex, showAnimation, handleLyricClick, currentTime, getLyricState]);

  return (
    <main className={styles.liveLyricsPage}>
      <Menubar className="fixed top-0 left-0 right-0 z-50">
        <MenubarMenu>
          <MenubarTrigger>{t.editor.menu.file}</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleNew}>
              {t.editor.menu.new}
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => document.getElementById('srt-upload')?.click()}>
              {t.editor.menu.import_srt}
              <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={exportToSRT} disabled={lyrics.length === 0}>
              {t.editor.menu.export_srt}
              <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>{t.editor.menu.edit}</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={undo} disabled={historyIndex <= 0}>
              {t.editor.menu.undo}
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={redo} disabled={historyIndex >= history.length - 1}>
              {t.editor.menu.redo}
              <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <div className="flex-1" />
        <Settings 
          language={language} 
          onLanguageChange={setLanguage}
          alignment={alignment}
          onAlignmentChange={setAlignment}
          showAnimation={showAnimation}
          onAnimationChange={setShowAnimation}
        />
      </Menubar>
      <div className="h-14" /> {/* 메뉴바 공간 확보 */}
      <div className={styles.mainContent}>
        <div className={cn(styles.leftPanel, isLeftPanelCollapsed && styles.collapsed)} 
             style={{ width: leftPanelWidth, flexShrink: 0 }}>
          <div className={styles.header}>
            <h1 className={isLeftPanelCollapsed ? "sr-only" : undefined}>{t.editor.title}</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLeftPanel}
              className="ml-auto"
              aria-label={isLeftPanelCollapsed ? "패널 펼치기" : "패널 접기"}
            >
              {isLeftPanelCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* 비디오 컨테이너 - 항상 존재하지만 패널 접힘 상태에 따라 hidden */}
          <div 
            ref={videoContainerRef} 
            className={cn(
              "rounded-lg overflow-hidden bg-card border flex-shrink-0",
              styles.videoContainer,
              isLeftPanelCollapsed && "hidden"
            )}
            style={{ 
              display: isVideoFile && audioURL ? 'block' : 'none',
              aspectRatio: '16/9',
              width: '100%',
              marginBottom: '1rem'
            }}
          >
            {videoElement}
          </div>
          
          {!isLeftPanelCollapsed && (
            <Card className="flex flex-col min-h-0 overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t.editor.title}</CardTitle>
                    <CardDescription>{t.editor.description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(!showSettings)}
                    className="h-8 w-8"
                  >
                    {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-4 overflow-hidden">
                {/* 설정 영역 */}
                <div className={cn("space-y-4 transition-all duration-200", 
                  showSettings ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden"
                )}>
        {/* SRT 업로드 */}
                  <div className="space-y-2 flex-shrink-0">
                    <Label>{t.editor.upload.srt}</Label>
                    <Input
                      id="srt-upload"
                      type="file"
                      accept=".srt"
                      onChange={handleSrtUpload}
                      className="cursor-pointer"
                    />
        </div>

                  {/* 오디오 업로드 */}
                  <div className="space-y-2 flex-shrink-0">
                    <Label>{t.editor.upload.audio}</Label>
                    <Input
                      type="file"
                      accept="audio/*,video/mp4"
                      onChange={handleAudioUpload}
                      className="cursor-pointer"
                    />
                  </div>
        </div>

                {/* 가사 관리 */}
                <div className="flex flex-col space-y-2 flex-1 min-h-0">
                  <div className="flex items-center justify-between flex-shrink-0">
                    <Label>{t.editor.lyrics.title}</Label>
                    <Button variant="outline" size="sm" onClick={handleAddLyricDialogOpen}>
                      {t.editor.lyrics.add}
                    </Button>
        </div>
                  <Dialog open={isAddLyricDialogOpen} onOpenChange={setIsAddLyricDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.editor.dialog.title}</DialogTitle>
                        <DialogDescription>
                          {t.editor.dialog.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {isPlaying && !isVideoFile && (
                          <div className="space-y-4">
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                {t.editor.playback.time_edit_disabled}
                              </AlertDescription>
                            </Alert>
                            <Button 
                              variant="secondary" 
                              onClick={handleStop}
                              className="w-full"
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              {t.editor.playback.stop}
            </Button>
          </div>
        )}
                        <Tabs 
                          defaultValue="current" 
                          className="w-full"
                          onValueChange={(value) => {
                            setSelectedTimeTab(value as "current" | "last");
                            updateNewLyricTimes(value as "current" | "last");
                          }}
                        >
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="current">
                              {t.editor.dialog.current_time}
                            </TabsTrigger>
                            <TabsTrigger value="last">
                              {t.editor.dialog.last_lyric_time}
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="current" className="space-y-4">
                            <TimeInput
                              value={newLyricStartTime}
                              onChange={(value) => setNewLyricStartTime(value)}
                              label={t.editor.dialog.start_time}
                              disabled={isPlaying}
                            />
                            <TimeInput
                              value={newLyricEndTime}
                              onChange={(value) => setNewLyricEndTime(value)}
                              label={t.editor.dialog.end_time}
                              disabled={isPlaying}
                            />
                          </TabsContent>
                          <TabsContent value="last" className="space-y-4">
                            <TimeInput
                              value={newLyricStartTime}
                              onChange={(value) => setNewLyricStartTime(value)}
                              label={t.editor.dialog.start_time}
                              disabled={isPlaying}
                            />
                            <TimeInput
                              value={newLyricEndTime}
                              onChange={(value) => setNewLyricEndTime(value)}
                              label={t.editor.dialog.end_time}
                              disabled={isPlaying}
                            />
                          </TabsContent>
                        </Tabs>
                        <div className="space-y-2">
                          <Label>{t.editor.dialog.lyrics}</Label>
                          <Input
                            value={newLyricText}
                            onChange={(e) => setNewLyricText(e.target.value)}
                            placeholder={t.editor.dialog.lyrics_placeholder}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddLyricDialogOpen(false)}>
                          {t.editor.dialog.cancel}
                        </Button>
                        <Button onClick={handleAddLyric}>{t.editor.dialog.add}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <div 
                    ref={tableRef}
                    className={cn("border rounded-lg overflow-auto flex-1 table-container")}
                    onScroll={handleTableScroll}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px] text-left sticky top-0 bg-background">{t.editor.lyrics.time}</TableHead>
                          <TableHead className="sticky top-0 bg-background">{t.editor.lyrics.text}</TableHead>
                          <TableHead className="w-[100px] text-right sticky top-0 bg-background"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedLyrics.map((line, index) => (
                          <TableRow 
                            key={index}
                            className={cn(
                              "group transition-colors hover:bg-accent/50",
                              index === activeLyricIndex && "bg-accent/30"
                            )}
                          >
                            <TableCell 
                              className="font-mono text-sm cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation(); // 이벤트 버블링 방지
                                handleLyricClick(line.start);
                              }}
                            >
                              {formatTime(line.start)}
                              <span className="text-muted-foreground"> ~ </span>
                              {line.end ? formatTime(line.end) : t.editor.lyrics.until_end}
                            </TableCell>
                            <TableCell 
                              className={cn(
                                "cursor-pointer max-w-[400px] truncate",
                                index === activeLyricIndex && "font-medium"
                              )}
                              onClick={(e) => {
                                e.stopPropagation(); // 이벤트 버블링 방지
                                handleLyricClick(line.start);
                              }}
                            >
                              {line.text}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingLyric({ index, line });
                                    setIsEditLyricDialogOpen(true);
                                  }}
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                  <span className="sr-only">Edit</span>
                                  ✎
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteLyric(index)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  <span className="sr-only">Delete</span>
                                  ×
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {lyrics.length === 0 && (
                          <TableRow>
                            <TableCell 
                              colSpan={3} 
                              className="h-32 text-center text-muted-foreground"
                            >
                              {t.editor.lyrics.empty}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
        </div>
                  {isUserScrolling && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAutoScroll(true);
                        setIsUserScrolling(false);
                      }}
                      className="w-full mt-2"
                    >
                      자동 스크롤 다시 시작
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
      </div>

      {/* Divider for resizing */}
        <div className={cn(styles.divider, isLeftPanelCollapsed && styles.hiddenDivider)} onMouseDown={handleMouseDown}></div>

      {/* 오른쪽: 가사 미리보기 영역 */}
      <div className={styles.rightPanel}>
        <div className={styles.previewOptions} style={{ marginBottom: "10px" }}>
              <Label style={{ marginRight: "10px" }}>{t.preview.mode.label}:</Label>
          <Select
            value={previewMode}
            onValueChange={(val) => setPreviewMode(val as "apple" | "subtitle")}
          >
            <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t.preview.mode.label} />
            </SelectTrigger>
            <SelectContent>
                  <SelectItem value="apple">{t.preview.mode.apple}</SelectItem>
                  <SelectItem value="subtitle">{t.preview.mode.subtitle}</SelectItem>
            </SelectContent>
          </Select>
        </div>

            <h2>{t.preview.title}</h2>
        {previewMode === "apple" ? (
            LyricsPreview
        ) : (
          <div className={styles.subtitlePreview}>
            {activeLyricIndex !== -1 ? lyrics[activeLyricIndex].text : ""}
          </div>
        )}
      </div>
    </div>

      {/* 오디오 플레이어 (항상 표시) */}
      {audioURL && (
        <div className={styles.audioPlayerContainer}>
          <AudioPlayer
            src={audioURL}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={setDuration}
            currentTime={currentTime}
            onSeek={handleTimeUpdate}
            audioRef={audioRef as React.RefObject<HTMLAudioElement>}
            onPlayingChange={setIsPlaying}
            isVideoFile={isVideoFile}
          />
        </div>
      )}

      {/* 가사 수정 다이얼로그 */}
      <Dialog open={isEditLyricDialogOpen} onOpenChange={setIsEditLyricDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editor.dialog.edit_title}</DialogTitle>
            <DialogDescription>
              {t.editor.dialog.edit_description}
            </DialogDescription>
          </DialogHeader>
          {editingLyric && (
            <div className="space-y-4 py-4">
              {isPlaying && !isVideoFile && (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t.editor.playback.time_edit_disabled}
                    </AlertDescription>
                  </Alert>
                  <Button 
                    variant="secondary" 
                    onClick={handleStop}
                    className="w-full"
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    {t.editor.playback.stop}
                  </Button>
                </div>
              )}
              <TimeInput
                value={editingLyric.line.start}
                onChange={(value) => 
                  setEditingLyric(prev => prev ? {
                    ...prev,
                    line: { ...prev.line, start: value }
                  } : null)
                }
                label={t.editor.dialog.start_time}
                disabled={isPlaying}
              />
              <TimeInput
                value={editingLyric.line.end || duration || 300}
                onChange={(value) =>
                  setEditingLyric(prev => prev ? {
                    ...prev,
                    line: { ...prev.line, end: value }
                  } : null)
                }
                label={t.editor.dialog.end_time}
                disabled={isPlaying}
              />
              <div className="space-y-2">
                <Label>{t.editor.dialog.lyrics}</Label>
                <Input
                  value={editingLyric.line.text}
                  onChange={(e) =>
                    setEditingLyric(prev => prev ? {
                      ...prev,
                      line: { ...prev.line, text: e.target.value }
                    } : null)
                  }
                  placeholder={t.editor.dialog.lyrics_placeholder}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditLyricDialogOpen(false)}>
              {t.editor.dialog.cancel}
            </Button>
            <Button onClick={editLyricLine}>{t.editor.dialog.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 새로 만들기 확인 다이얼로그 */}
      <Dialog open={showNewConfirmDialog} onOpenChange={setShowNewConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editor.menu.new}</DialogTitle>
            <DialogDescription>
              {t.editor.menu.new_confirm}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewConfirmDialog(false)}>
              {t.editor.dialog.cancel}
            </Button>
            <Button variant="destructive" onClick={handleConfirmNew}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}