import React, { useEffect, useRef } from 'react';

// 전역 오디오 컨텍스트 관리
const globalAudioContext = {
  context: null as AudioContext | null,
  source: null as MediaElementAudioSourceNode | null,
  connectedElement: null as HTMLMediaElement | null,
};

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function AudioVisualizer({ audioRef }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const gradientRef = useRef<CanvasGradient>();
  const isInitializedRef = useRef<boolean>(false);

  // 오디오 컨텍스트 초기화를 위한 별도의 useEffect
  useEffect(() => {
    if (!audioRef.current) return;

    const setupAudioContext = async () => {
      try {
        // 이미 연결된 오디오 엘리먼트가 현재와 다른 경우에만 초기화
        if (globalAudioContext.connectedElement !== audioRef.current) {
          // 기존 연결 정리
          if (globalAudioContext.source) {
            globalAudioContext.source.disconnect();
          }
          if (globalAudioContext.context) {
            await globalAudioContext.context.close();
          }

          // 새로운 오디오 컨텍스트 생성
          const newContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          globalAudioContext.context = newContext;

          // 소스 노드 생성
          globalAudioContext.source = newContext.createMediaElementSource(audioRef.current);
          globalAudioContext.connectedElement = audioRef.current;

          // 분석기 노드 생성
          analyserRef.current = newContext.createAnalyser();
          analyserRef.current.fftSize = 256;

          // 병렬 연결:
          // 소스 -> 분석기
          // 소스 -> 출력
          globalAudioContext.source.connect(analyserRef.current);
          globalAudioContext.source.connect(newContext.destination);

          console.log('Audio context state:', newContext.state);
          console.log('Audio source connected:', !!globalAudioContext.source);
          console.log('Analyser connected:', !!analyserRef.current);

          // 오디오 컨텍스트 상태 확인 및 재개
          if (newContext.state === 'suspended') {
            await newContext.resume();
            console.log('Audio context resumed');
          }
        }
      } catch (error) {
        console.error('Audio setup error:', error);
      }
    };

    setupAudioContext().catch(console.error);

    const resumeAudioContext = () => {
      if (globalAudioContext.context?.state === 'suspended') {
        globalAudioContext.context.resume().then(() => {
          console.log('Audio context resumed after interaction');
        });
      }
    };

    // 다양한 사용자 상호작용 이벤트에 대한 리스너 추가
    document.addEventListener('click', resumeAudioContext);
    document.addEventListener('touchstart', resumeAudioContext);
    document.addEventListener('keydown', resumeAudioContext);

    return () => {
      document.removeEventListener('click', resumeAudioContext);
      document.removeEventListener('touchstart', resumeAudioContext);
      document.removeEventListener('keydown', resumeAudioContext);
      
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
    };
  }, [audioRef]);

  // 시각화 효과를 위한 useEffect
  useEffect(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 그라디언트 설정
    gradientRef.current = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradientRef.current.addColorStop(0, 'hsl(260, 100%, 50%)');
    gradientRef.current.addColorStop(0.5, 'hsl(290, 100%, 50%)');
    gradientRef.current.addColorStop(1, 'hsl(320, 100%, 50%)');

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx || !analyserRef.current || !gradientRef.current) return;

      animationRef.current = requestAnimationFrame(draw);

      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // 배경 그라디언트 애니메이션
      const time = Date.now() * 0.001;
      const hue1 = (time * 10) % 360;
      const hue2 = (hue1 + 60) % 360;
      const hue3 = (hue2 + 60) % 360;

      const gradient = ctx.createLinearGradient(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      gradient.addColorStop(0, `hsla(${hue1}, 100%, 50%, 0.5)`);
      gradient.addColorStop(0.5, `hsla(${hue2}, 100%, 50%, 0.5)`);
      gradient.addColorStop(1, `hsla(${hue3}, 100%, 50%, 0.5)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // 오디오 시각화
      const barWidth = (canvas.offsetWidth / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.offsetHeight * 0.5;
        const y = canvas.offsetHeight / 2 - barHeight / 2;

        ctx.fillStyle = `hsla(${hue1 + (i * 360 / bufferLength)}, 100%, 50%, 0.5)`;
        ctx.fillRect(x, y, barWidth, barHeight);

        x += barWidth + 1;
      }

      // 블러 효과를 위한 원형 그라디언트
      const centerX = canvas.offsetWidth / 2;
      const centerY = canvas.offsetHeight / 2;
      const radius = Math.max(canvas.offsetWidth, canvas.offsetHeight);
      const radialGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );
      radialGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full -z-10"
      style={{ filter: 'blur(30px)' }}
    />
  );
} 