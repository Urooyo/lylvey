'use client';

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "../app/page.module.css";

interface LyricLine {
  start: number;
  end?: number;
  text: string;
}

interface FunLyricsPreviewProps {
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

interface Star {
  id: number;
  left: number;
  top: number;
  delay: number;
  size: number;
}

const VIRTUALIZE_THRESHOLD = 50;

// 특수 문자와 이모지 배열 (가사에 무작위로 추가할)
const EMOJIS = ["✨", "🌈", "🎵", "🎶", "💫", "⭐", "🍭", "🌟", "🎊", "🎉", "🦄", "🍬"];

// 다양한 글꼴 스타일 (CSS font-family 값)
const FUNKY_FONTS = [
  "'Comic Sans MS', cursive", 
  "'Marker Felt', fantasy",
  "'Chalkboard SE', cursive",
  "'Snell Roundhand', cursive", 
  "'Papyrus', fantasy",
  "'Bradley Hand', cursive"
];

const FunLyricsPreview: React.FC<FunLyricsPreviewProps> = ({
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
  
  // 장난스러운 효과를 위한 상태
  const [bounceEffects, setBounceEffects] = useState<{[key: number]: boolean}>({});
  const [colorEffects, setColorEffects] = useState<{[key: number]: string}>({});
  const [rotationEffects, setRotationEffects] = useState<{[key: number]: number}>({});
  const [fontEffects, setFontEffects] = useState<{[key: number]: string}>({});
  const [emojiEffects, setEmojiEffects] = useState<{[key: number]: {prefix: string, suffix: string}}>({});
  const [scaleEffects, setScaleEffects] = useState<{[key: number]: number}>({});
  const [animationTypes, setAnimationTypes] = useState<{[key: number]: string}>({});
  
  // 별 애니메이션 상태
  const [stars, setStars] = useState<Star[]>([]);
  
  // 컴포넌트 마운트시 초기 별들 생성
  useEffect(() => {
    const initialStars = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // 0-100% 위치
      top: Math.random() * 100,  // 0-100% 위치
      delay: Math.random() * 2,  // 0-2초 지연
      size: 10 + Math.random() * 10 // 10-20px 크기
    }));
    setStars(initialStars);
    
    // 일정 간격으로 새로운 별 추가
    const intervalId = setInterval(() => {
      setStars(prevStars => {
        const newStar = {
          id: Date.now(),
          left: Math.random() * 100,
          top: Math.random() * 100,
          delay: Math.random() * 2,
          size: 10 + Math.random() * 10
        };
        
        // 별이 20개 이상이면 가장 오래된 별 제거
        if (prevStars.length >= 20) {
          return [...prevStars.slice(1), newStar];
        }
        return [...prevStars, newStar];
      });
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // 무작위 효과 생성
  const generateRandomEffects = (index: number) => {
    // 색상 효과
    const randomColor = getRandomColor();
    setColorEffects(prev => ({...prev, [index]: randomColor}));
    
    // 회전 효과 (-5도에서 5도 사이의 값)
    const randomRotation = Math.floor(Math.random() * 10) - 5;
    setRotationEffects(prev => ({...prev, [index]: randomRotation}));
    
    // 폰트 효과
    const randomFont = FUNKY_FONTS[Math.floor(Math.random() * FUNKY_FONTS.length)];
    setFontEffects(prev => ({...prev, [index]: randomFont}));
    
    // 이모지 효과
    const randomPrefixEmoji = Math.random() > 0.5 ? EMOJIS[Math.floor(Math.random() * EMOJIS.length)] : '';
    const randomSuffixEmoji = Math.random() > 0.5 ? EMOJIS[Math.floor(Math.random() * EMOJIS.length)] : '';
    setEmojiEffects(prev => ({...prev, [index]: {prefix: randomPrefixEmoji, suffix: randomSuffixEmoji}}));
    
    // 크기 효과 (0.95에서 1.05 사이의 값)
    const randomScale = 0.95 + Math.random() * 0.1;
    setScaleEffects(prev => ({...prev, [index]: randomScale}));
    
    // 애니메이션 유형
    const animations = ['bounce', 'wobble', 'shake', 'swing', 'pulse'];
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
    setAnimationTypes(prev => ({...prev, [index]: randomAnimation}));
    
    // 바운스 효과 추가
    setBounceEffects(prev => ({...prev, [index]: true}));
    
    // 잠시 후 바운스 효과 제거
    setTimeout(() => {
      setBounceEffects(prev => ({...prev, [index]: false}));
    }, 1000);
    
    // 별 효과 추가
    addStarsAroundLyric(index);
  };
  
  // 가사 주변에 별 추가 함수
  const addStarsAroundLyric = (index: number) => {
    if (!previewRef.current) return;
    
    const container = previewRef.current;
    const activeElement = container.querySelector(`[data-index="${index}"]`) as HTMLElement;
    
    if (!activeElement) return;
    
    // 현재 선택된 가사 요소의 위치 계산
    const rect = activeElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // 컨테이너 기준으로 상대적 위치 계산
    const relativeTop = (rect.top - containerRect.top) / containerRect.height * 100;
    const relativeLeft = (rect.left - containerRect.left) / containerRect.width * 100;
    
    // 주변에 3-5개의 별 추가
    const starCount = 3 + Math.floor(Math.random() * 3);
    const newStars: Star[] = [];
    
    for (let i = 0; i < starCount; i++) {
      // 선택된 가사 근처에 별 위치 결정
      const offsetX = -10 + Math.random() * 20; // -10% ~ +10% 오프셋
      const offsetY = -10 + Math.random() * 20; // -10% ~ +10% 오프셋
      
      newStars.push({
        id: Date.now() + i,
        left: Math.max(0, Math.min(100, relativeLeft + offsetX)),
        top: Math.max(0, Math.min(100, relativeTop + offsetY)),
        delay: Math.random() * 0.5,
        size: 10 + Math.random() * 15
      });
    }
    
    setStars(prev => [...prev, ...newStars].slice(-25)); // 최대 25개 별 유지
  };
  
  // 미리보기 영역에서 활성 가사가 보이도록 부드럽게 스크롤
  useEffect(() => {
    // 활성 가사 인덱스가 변경된 경우에만 스크롤 수행
    if (activeLyricIndex !== prevActiveIndexRef.current && previewRef.current) {
      prevActiveIndexRef.current = activeLyricIndex;
      
      // 활성 가사에 장난스러운 효과 추가
      if (activeLyricIndex !== -1) {
        generateRandomEffects(activeLyricIndex);
      }
      
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
        
        // 어린이 느낌의 easeElastic 이징 함수
        const easeElastic = (t: number): number => {
          return (Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1);
        };
        
        // 애니메이션 프레임 실행 - 성능 최적화
        const animateScroll = (timestamp: number) => {
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeElastic(progress);
          
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

  // 무지개 색상 배열
  const rainbowColors = [
    'rgba(255, 0, 0, 0.9)',     // 빨강
    'rgba(255, 127, 0, 0.9)',   // 주황
    'rgba(255, 255, 0, 0.9)',   // 노랑
    'rgba(0, 255, 0, 0.9)',     // 초록
    'rgba(0, 0, 255, 0.9)',     // 파랑
    'rgba(75, 0, 130, 0.9)',    // 남색
    'rgba(143, 0, 255, 0.9)',   // 보라
  ];
  
  // 랜덤 색상 생성 함수
  const getRandomColor = () => {
    // 50% 확률로 무지개 색상에서 선택, 50% 확률로 밝은 색상에서 선택
    if (Math.random() > 0.5) {
      return rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
    } else {
      const colors = [
        'rgba(255, 105, 180, 0.9)', // 핫 핑크
        'rgba(0, 191, 255, 0.9)',   // 딥 스카이 블루
        'rgba(50, 205, 50, 0.9)',   // 라임 그린
        'rgba(255, 215, 0, 0.9)',   // 골드
        'rgba(138, 43, 226, 0.9)',  // 블루바이올렛
        'rgba(255, 127, 80, 0.9)',  // 코랄
        'rgba(64, 224, 208, 0.9)',  // 터콰이즈 
        'rgba(255, 20, 147, 0.9)',  // 딥 핑크
        'rgba(124, 252, 0, 0.9)',   // 라임
        'rgba(255, 182, 193, 0.9)', // 연한 분홍
        'rgba(255, 160, 122, 0.9)', // 연어살색
        'rgba(176, 196, 222, 0.9)', // 연한 강철 파랑
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  };

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
    <div ref={previewRef} className={cn(styles.lyricsPreview, styles.funBackground)}>
      <style jsx global>{`
        /* 다양한 애니메이션 정의 */
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
          40% {transform: translateY(-20px);}
          60% {transform: translateY(-10px);}
        }
        
        @keyframes wobble {
          0% {transform: translateX(0);}
          15% {transform: translateX(-12px) rotate(-5deg);}
          30% {transform: translateX(10px) rotate(3deg);}
          45% {transform: translateX(-8px) rotate(-3deg);}
          60% {transform: translateX(6px) rotate(2deg);}
          75% {transform: translateX(-4px) rotate(-1deg);}
          100% {transform: translateX(0);}
        }
        
        @keyframes shake {
          0%, 100% {transform: translateX(0);}
          10%, 30%, 50%, 70%, 90% {transform: translateX(-5px);}
          20%, 40%, 60%, 80% {transform: translateX(5px);}
        }
        
        @keyframes swing {
          20% {transform: rotate(15deg);}
          40% {transform: rotate(-10deg);}
          60% {transform: rotate(5deg);}
          80% {transform: rotate(-5deg);}
          100% {transform: rotate(0deg);}
        }
        
        @keyframes pulse {
          0% {transform: scale(1);}
          50% {transform: scale(1.1);}
          100% {transform: scale(1);}
        }
        
        @keyframes rainbow {
          0% {color: red;}
          14% {color: orange;}
          28% {color: yellow;}
          42% {color: green;}
          56% {color: blue;}
          70% {color: indigo;}
          84% {color: violet;}
          100% {color: red;}
        }
        
        /* 호버 스타일 */
        .fun-lyric-hover:hover {
          animation: wobble 0.8s ease;
          cursor: pointer;
          filter: brightness(1.2);
          text-shadow: 0 0 8px white;
        }
        
        /* 활성화 스타일 */
        .fun-active-lyric {
          animation: rainbow 2s linear infinite;
          font-weight: bold;
          transform-origin: center;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.7), 0 0 15px currentColor;
          padding: 0 10px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
          letter-spacing: 1px;
        }
      `}</style>
      
      {/* 별 애니메이션 */}
      {stars.map((star) => (
        <div
          key={star.id}
          className={styles.starAnimation}
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`
          }}
        />
      ))}
      
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
          
          // 장난스러운 스타일 계산
          const customStyle: React.CSSProperties = {};
          
          // 기본 스타일
          customStyle.fontFamily = fontEffects[globalIndex] || "'Comic Sans MS', cursive";
          
          if (isActive) {
            // 활성 가사 스타일
            customStyle.color = colorEffects[globalIndex] || 'white';
            customStyle.transform = `scale(${scaleEffects[globalIndex] || 1.05}) rotate(${rotationEffects[globalIndex] || 0}deg)`;
            customStyle.animationDuration = '1.5s';
            customStyle.transition = 'all 0.3s ease-in-out';
          } else {
            // 비활성 가사도 약간의 효과를 줍니다
            const randomRotate = (globalIndex % 5) - 2; // -2에서 2 사이의 값
            customStyle.transform = `rotate(${randomRotate}deg)`;
          }
          
          // 바운스 효과 적용
          if (bounceEffects[globalIndex]) {
            customStyle.animation = `${animationTypes[globalIndex] || 'bounce'} 0.8s ease`;
          }
          
          // 이모지 효과
          const prefix = emojiEffects[globalIndex]?.prefix || '';
          const suffix = emojiEffects[globalIndex]?.suffix || '';
          const displayText = isActive ? `${prefix} ${line.text} ${suffix}` : line.text;
          
          return (
            <div
              key={`${globalIndex}-${line.start}-${line.end || 'end'}`}
              className={cn(
                styles.lyricLine,
                'fun-lyric-hover',
                isActive && 'fun-active-lyric',
                // 상태에 따른 스타일 우선순위 조정
                lyricState === 'past' ? styles.past : 
                lyricState === 'future' ? styles.future : 
                (isActive ? styles.active : styles.inactive),
                !showAnimation && styles.noAnimation
              )}
              style={customStyle}
              onClick={(e) => {
                e.stopPropagation(); // 이벤트 버블링 방지
                
                // 클릭 때 작은 애니메이션 효과 발생
                generateRandomEffects(globalIndex);
                
                // 기존 클릭 핸들러 호출
                handleLyricClick(line.start);
              }}
              data-index={globalIndex}
              data-start={line.start}
              data-end={line.end}
              data-state={lyricState}
            >
              {displayText}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FunLyricsPreview; 