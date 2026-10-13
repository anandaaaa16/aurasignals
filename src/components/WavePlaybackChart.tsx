import React, { useRef, useEffect } from 'react';
import { AssetSymbol } from '../types';

interface WavePlaybackChartProps {
  points: number[];
  isWin: boolean;
  entryPrice: number;
  exitPrice: number;
  asset?: AssetSymbol;
}

export const WavePlaybackChart: React.FC<WavePlaybackChartProps> = ({
  points,
  isWin,
  entryPrice,
  exitPrice,
  asset = 'BTC/USDT',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const decimals = asset === 'XRP/USDT' ? 4 : asset === 'ETH/USDT' ? 2 : 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !points || points.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const padTop = 18;
    const padBottom = 18;
    const padX = 14;
    const chartW = w - padX * 2;
    const chartH = h - padTop - padBottom;

    const minP = Math.min(...points);
    const maxP = Math.max(...points);
    const range = maxP - minP || 1;

    // Convert price points to canvas coordinates
    const coords = points.map((p, idx) => {
      const x = padX + (idx / (points.length - 1)) * chartW;
      const y = padTop + chartH - ((p - minP) / range) * chartH;
      return { x, y };
    });

    const strokeColor = isWin ? '#10b981' : '#f43f5e';
    const glowColor = isWin ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)';

    // 1. Draw subtle area fill under wave
    ctx.save();
    const grad = ctx.createLinearGradient(0, padTop, 0, h);
    grad.addColorStop(0, isWin ? 'rgba(16, 185, 129, 0.22)' : 'rgba(244, 63, 94, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    const lastCoord = coords[coords.length - 1];
    ctx.lineTo(lastCoord.x, lastCoord.y);
    ctx.lineTo(lastCoord.x, h);
    ctx.lineTo(coords[0].x, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Draw smooth continuous wave stroke
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    ctx.lineTo(lastCoord.x, lastCoord.y);
    ctx.stroke();
    ctx.restore();

    // 3. Draw Entry Point Marker (Left)
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(coords[0].x, coords[0].y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Entry $${entryPrice.toFixed(decimals)}`, coords[0].x + 6, coords[0].y + (coords[0].y > h / 2 ? -6 : 12));
    ctx.restore();

    // 4. Draw Exit Point Marker (Right - Hit TP or Hit SL)
    ctx.save();
    ctx.fillStyle = strokeColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(lastCoord.x, lastCoord.y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing outer ring
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(lastCoord.x, lastCoord.y, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isWin ? '#34d399' : '#f87171';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    const tag = isWin ? `TP $${exitPrice.toFixed(decimals)}` : `SL $${exitPrice.toFixed(decimals)}`;
    ctx.fillText(tag, lastCoord.x - 8, lastCoord.y + (lastCoord.y > h / 2 ? -6 : 12));
    ctx.restore();
  }, [points, isWin, entryPrice, exitPrice, decimals]);

  return (
    <div className="w-full h-20 sm:h-24 relative overflow-hidden rounded-xl bg-slate-950/40 border border-white/5 my-1.5">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
