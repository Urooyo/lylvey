import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isVisible?: boolean;
}

interface AudioContextState {
  context: AudioContext;
  source: MediaElementAudioSourceNode | null;
  analyser: AnalyserNode | null;
  connectedElement: HTMLMediaElement | null;
}

let globalAudioContext: AudioContextState | null = null;

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export function AudioVisualizer({ audioRef, isVisible = true }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let rafId: number;

  useEffect(() => {
    if (!audioRef.current || !canvasRef.current) return;

    try {
      // 이미 연결된 오디오 컨텍스트가 있고, 다른 엘리먼트에 연결되어 있다면 초기화
      if (
        globalAudioContext &&
        globalAudioContext.connectedElement &&
        globalAudioContext.connectedElement !== audioRef.current
      ) {
        globalAudioContext.source?.disconnect();
        globalAudioContext.analyser?.disconnect();
      }

      // 새로운 오디오 컨텍스트 생성 또는 기존 것 재사용
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const newContext = (globalAudioContext?.context || new AudioContextClass()) as AudioContext;

      if (!globalAudioContext || !globalAudioContext.source) {
        globalAudioContext = {
          context: newContext,
          source: null,
          analyser: null,
          connectedElement: null,
        };

        // 소스 노드 생성
        const source = newContext.createMediaElementSource(audioRef.current);
        globalAudioContext.source = source;
        globalAudioContext.connectedElement = audioRef.current;

        // 분석기 노드 생성
        const analyser = newContext.createAnalyser();
        analyser.fftSize = 256;
        globalAudioContext.analyser = analyser;

        // 노드 연결
        source.connect(analyser);
        analyser.connect(newContext.destination);
      }

      if (!globalAudioContext.analyser) return;

      // 애니메이션 프레임 설정
      const bufferLength = globalAudioContext.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvasCtx = canvasRef.current.getContext('2d');

      if (!canvasCtx) return;

      const draw = () => {
        if (!isVisible || !globalAudioContext?.analyser) return;

        rafId = requestAnimationFrame(draw);
        
        const width = canvasRef.current!.width;
        const height = canvasRef.current!.height;

        globalAudioContext.analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgb(0, 0, 0, 0)';
        canvasCtx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;

          const gradient = canvasCtx.createLinearGradient(0, height - barHeight, 0, height);
          gradient.addColorStop(0, `hsla(${200 + i}, 100%, 50%, 0.8)`);
          gradient.addColorStop(1, `hsla(${200 + i}, 100%, 50%, 0.2)`);

          canvasCtx.fillStyle = gradient;
          canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }
      };

      draw();
    } catch (error) {
      console.error('Error initializing audio visualizer:', error);
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [audioRef, isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-12"
      width={300}
      height={48}
    />
  );
} 