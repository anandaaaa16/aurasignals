import React, { useRef, useEffect } from 'react';

interface WavePlaybackChartProps {
  points: number[];
  isWin: boolean;
  entryPrice: number;
  exitPrice: number;
  isGold: boolean;
}

export const WavePlaybackChart: React.FC<WavePlaybackChartProps> = ({
  points,
  isWin,
  entryPrice,
  exitPrice,
  isGold,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const minVal = Math.min(...points, entryPrice, exitPrice);
    const maxVal = Math.max(...points, entryPrice, exitPrice);
    const range = (maxVal - minVal) || 1;

    // Convert (index, price) to (x, y)
    const getX = (idx: number) => padX + (idx / (points.length - 1)) * chartW;
    const getY = (val: number) => padTop + chartH - ((val - minVal) / range) * chartH;

    const strokeColor = isWin ? '#10b981' : '#f43f5e';
    const glowColor = isWin ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)';
    const gradTop = isWin ? 'rgba(16, 185, 129, 0.28)' : 'rgba(244, 63, 94, 0.28)';

    // Compute coordinates of points
    const coords = points.map((p, i) => ({ x: getX(i), y: getY(p) }));

    // 1. Draw glowing wave gradient fill under the curve
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);

    // Smooth Bezier Curve interpolation (creates authentic smooth wave flow)
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      const cpX1 = (midX + p0.x) / 2;
      const cpX2 = (midX + p1.x) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    const lastCoord = coords[coords.length - 1];
    ctx.lineTo(lastCoord.x, lastCoord.y);
    ctx.lineTo(lastCoord.x, h);
    ctx.lineTo(coords[0].x, h);
    ctx.closePath();

    const areaGrad = ctx.createLinearGradient(0, padTop, 0, h);
    areaGrad.addColorStop(0, gradTop);
    areaGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();
    ctx.restore();

    // 2. Draw the Smooth Wave Stroke Line with Glow
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

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
    ctx.fillText(`Entry $${entryPrice.toFixed(isGold ? 1 : 0)}`, coords[0].x + 6, coords[0].y + (coords[0].y > h / 2 ? -6 : 12));
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
    const tag = isWin ? `TP $${exitPrice.toFixed(isGold ? 1 : 0)}` : `SL $${exitPrice.toFixed(isGold ? 1 : 0)}`;
    ctx.fillText(tag, lastCoord.x - 8, lastCoord.y + (lastCoord.y > h / 2 ? -6 : 12));
    ctx.restore();
  }, [points, isWin, entryPrice, exitPrice, isGold]);

  return (
    <div className="w-full h-20 sm:h-24 relative overflow-hidden rounded-xl bg-slate-950/40 border border-white/5 my-1.5">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
