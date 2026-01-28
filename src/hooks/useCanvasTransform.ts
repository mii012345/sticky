'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseCanvasTransformOptions {
  minScale?: number;
  maxScale?: number;
}

interface UseCanvasTransformReturn {
  scale: number;
  position: Position;
  isPanning: boolean;
  canvasElement: HTMLDivElement | null;
  canvasCallbackRef: (node: HTMLDivElement | null) => void;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetTransform: () => void;
  setTransform: (newScale: number, newPosition: Position) => void;
  screenToCanvas: (screenX: number, screenY: number, canvasRect: DOMRect) => Position;
}

export function useCanvasTransform(
  options: UseCanvasTransformOptions = {}
): UseCanvasTransformReturn {
  const { minScale = 0.25, maxScale = 3 } = options;

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [canvasElement, setCanvasElement] = useState<HTMLDivElement | null>(null);
  const lastMousePos = useRef<Position | null>(null);

  // 状態をrefで保持（イベントリスナー内で最新値を参照するため）
  const scaleRef = useRef(scale);
  const positionRef = useRef(position);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // callback ref でキャンバス要素を取得
  const canvasCallbackRef = useCallback((node: HTMLDivElement | null) => {
    setCanvasElement(node);
  }, []);

  // スペースキーの監視
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
        lastMousePos.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ホイール/トラックパッド操作（passive: false で登録してブラウザズームを防ぐ）
  useEffect(() => {
    if (!canvasElement) return;

    const handleWheel = (e: WheelEvent) => {
      // ブラウザのデフォルトズームを防ぐ
      e.preventDefault();

      const rect = canvasElement.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentScale = scaleRef.current;
      const currentPosition = positionRef.current;

      // ピンチジェスチャー（ctrlKey付き）= ズーム
      if (e.ctrlKey || e.metaKey) {
        // ピンチの感度調整
        const zoomSensitivity = 0.01;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(maxScale, Math.max(minScale, currentScale + delta));

        if (newScale === currentScale) return;

        // マウス位置を中心にズーム
        const scaleRatio = newScale / currentScale;
        const newX = mouseX - (mouseX - currentPosition.x) * scaleRatio;
        const newY = mouseY - (mouseY - currentPosition.y) * scaleRatio;

        setScale(newScale);
        setPosition({ x: newX, y: newY });
      } else {
        // 二本指スワイプ = パン
        setPosition((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    // passive: false で登録することでpreventDefaultが効く
    canvasElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvasElement.removeEventListener('wheel', handleWheel);
    };
  }, [canvasElement, minScale, maxScale]);

  // マウスダウン（パン開始）
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // スペースキーが押されている場合のみパン
      if (isSpacePressed) {
        e.preventDefault();
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isSpacePressed]
  );

  // マウス移動（パン中）
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPanning || !lastMousePos.current) return;

      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;

      setPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    [isPanning]
  );

  // マウスアップ（パン終了）
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    lastMousePos.current = null;
  }, []);

  // マウスがキャンバスを離れた時
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    lastMousePos.current = null;
  }, []);

  // ズームイン
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(maxScale, prev + 0.1));
  }, [maxScale]);

  // ズームアウト
  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(minScale, prev - 0.1));
  }, [minScale]);

  // リセット（100%、中央）
  const resetTransform = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // 外部からスケールとポジションを設定
  const setTransform = useCallback((newScale: number, newPosition: Position) => {
    setScale(Math.min(maxScale, Math.max(minScale, newScale)));
    setPosition(newPosition);
  }, [minScale, maxScale]);

  // スクリーン座標をキャンバス座標に変換
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number, canvasRect: DOMRect): Position => {
      const x = (screenX - canvasRect.left - position.x) / scale;
      const y = (screenY - canvasRect.top - position.y) / scale;
      return { x, y };
    },
    [scale, position]
  );

  return {
    scale,
    position,
    isPanning,
    canvasElement,
    canvasCallbackRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    zoomIn,
    zoomOut,
    resetTransform,
    setTransform,
    screenToCanvas,
  };
}
