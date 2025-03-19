'use client';

import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import styles from "../app/page.module.css";

interface LyricLine {
  start: number;
  end?: number;
  text: string;
}

interface LyricsPreviewProps {
  lyrics: LyricLine[];
  virtualizedLyrics: LyricLine[];
  virtualizedStartIndex: number;
  currentTime: number;
  activeLyricIndex: number;
  alignment: "textAlignLeft" | "textAlignCenter" | "textAlignRight";
  showAnimation: boolean;
  handleLyricClick: (startTime: number) => void;
  getLyricState: (index: number, currentTime: number, lyrics: LyricLine[]) => 'past' | 'current' | 'future';
}

const VIRTUALIZE_THRESHOLD = 50;

const LyricsPreview: React.FC<LyricsPreviewProps> = ({
  lyrics,
  virtualizedLyrics,
  virtualizedStartIndex,
  currentTime,
  activeLyricIndex,
  alignment,
  showAnimation,
  handleLyricClick,
  getLyricState
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const prevActiveIndexRef = useRef<number>(-1);
  const scrollAnimationRef = useRef<number | null>(null);
  
  // 미리보기 영역에서 활성 가사가 보이도록 부드럽게 스크롤
  useEffect(() => {
    // 활성 가사 인덱스가 변경된 경우에만 스크롤 수행
    if (activeLyricIndex !== prevActiveIndexRef.current && previewRef.current) {
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
  }, [activeLyricIndex]);

  // cleanup
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
    };
  }, []);

  // 가상화된 높이 계산 (가상 리스트의 시작 위치를 설정하기 위함)
  const paddingTop = virtualizedStartIndex * 48; // 평균 라인 높이 48px
  
  return (
    <div ref={previewRef} className={styles.lyricsPreview}>
      <div 
        className={styles[alignment]} 
        style={
          lyrics.length > VIRTUALIZE_THRESHOLD 
          ? { paddingTop: `${paddingTop}px`, paddingBottom: `${(lyrics.length - virtualizedStartIndex - virtualizedLyrics.length) * 48}px` }
          : {}
        }
      >
        {virtualizedLyrics.map((line, localIndex) => {
          const globalIndex = lyrics.length > VIRTUALIZE_THRESHOLD 
            ? virtualizedStartIndex + localIndex 
            : localIndex;
          
          // 가사의 상태 계산 (current, past, future)
          const lyricState = getLyricState(globalIndex, currentTime, lyrics);
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
};

export default LyricsPreview; 