'use client';

import { useCallback, useRef, useState } from 'react';

type KnobProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
  accent?: 'brass' | 'signal';
};

const MIN_ANGLE = -132;
const MAX_ANGLE = 132;

export default function Knob({
  label,
  value,
  min,
  max,
  step = 0.01,
  defaultValue,
  formatValue,
  onChange,
  accent = 'brass',
}: KnobProps) {
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ y: number; value: number } | null>(null);

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragStart.current = { y: e.clientY, value };
      setDragging(true);
    },
    [value]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStart.current) return;
      const deltaY = dragStart.current.y - e.clientY;
      const range = max - min;
      // 160px of drag traverses the full range; hold Shift to fine-tune.
      const sensitivity = e.shiftKey ? range / 640 : range / 160;
      const raw = dragStart.current.value + deltaY * sensitivity;
      const stepped = Math.round(raw / step) * step;
      onChange(clamp(stepped));
    },
    [clamp, max, min, onChange, step]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragStart.current = null;
    setDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleDoubleClick = useCallback(() => {
    onChange(defaultValue);
  }, [defaultValue, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const nudge = e.shiftKey ? step : step * 10;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        onChange(clamp(value + nudge));
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        onChange(clamp(value - nudge));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(defaultValue);
      }
    },
    [clamp, defaultValue, onChange, step, value]
  );

  const percent = (value - min) / (max - min);
  const angle = MIN_ANGLE + percent * (MAX_ANGLE - MIN_ANGLE);
  const accentColor = accent === 'brass' ? '#C7952B' : '#4FE0A0';
  const isAtDefault = Math.abs(value - defaultValue) < step / 2;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={formatValue(value)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        className={`relative h-20 w-20 cursor-ns-resize rounded-full bg-panelLight shadow-console outline-none ring-1 ring-hairline transition-shadow ${
          dragging ? 'ring-2' : ''
        }`}
        style={{ boxShadow: dragging ? `0 0 0 2px ${accentColor}` : undefined }}
      >
        {/* tick marks */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 80 80">
          {Array.from({ length: 11 }).map((_, i) => {
            const tickAngle = MIN_ANGLE + (i / 10) * (MAX_ANGLE - MIN_ANGLE);
            const rad = (tickAngle * Math.PI) / 180;
            const x1 = 40 + Math.sin(rad) * 32;
            const y1 = 40 - Math.cos(rad) * 32;
            const x2 = 40 + Math.sin(rad) * 36;
            const y2 = 40 - Math.cos(rad) * 36;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#33373D"
                strokeWidth={1.5}
              />
            );
          })}
        </svg>
        {/* pointer */}
        <div
          className="absolute left-1/2 top-1/2 h-8 w-[3px] origin-top rounded-full"
          style={{
            backgroundColor: isAtDefault ? '#A8A399' : accentColor,
            transform: `translate(-50%, 0) rotate(${angle}deg)`,
          }}
        />
        <div className="absolute inset-3 rounded-full bg-panel ring-1 ring-black/30" />
        <div
          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: isAtDefault ? '#A8A399' : accentColor }}
        />
      </div>
      <div className="text-center">
        <div className="font-mono text-sm tabular-nums text-bone">{formatValue(value)}</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-boneDim">{label}</div>
      </div>
    </div>
  );
}
