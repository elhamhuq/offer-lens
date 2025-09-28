'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AnimatedPortfolioChartProps {
  className?: string;
}

export default function AnimatedPortfolioChart({
  className = '',
}: AnimatedPortfolioChartProps) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sample data for 30-year projection
  const generateProjectionData = () => {
    const data = [];
    let value = 0;
    const monthlyInvestment = 1500;
    const monthlyReturn = 0.082 / 12; // Convert annual to monthly return

    for (let year = 0; year <= 30; year++) {
      if (year > 0) {
        // Apply monthly contributions and returns for 12 months
        for (let month = 0; month < 12; month++) {
          value = (value + monthlyInvestment) * (1 + monthlyReturn);
        }
      }
      data.push({
        year,
        value: value / 1000000, // Convert to millions
        contributions: (monthlyInvestment * 12 * year) / 1000000,
        growth: value / 1000000 - (monthlyInvestment * 12 * year) / 1000000,
      });
    }
    return data;
  };

  const data = generateProjectionData();
  const maxValue = Math.max(...data.map(d => d.value));

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(100);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const generatePath = (data: typeof data, progress: number) => {
    if (data.length === 0) return '';

    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (point.value / maxValue) * 80;
      return `${x},${y}`;
    });

    const visiblePoints = Math.ceil((data.length * progress) / 100);
    const visiblePath = points.slice(0, visiblePoints).join(' L ');

    return `M ${visiblePath}`;
  };

  const generateAreaPath = (data: typeof data, progress: number) => {
    const linePath = generatePath(data, progress);
    if (!linePath) return '';

    const lastPoint = data[Math.ceil((data.length * progress) / 100) - 1];
    const lastX =
      ((Math.ceil((data.length * progress) / 100) - 1) / (data.length - 1)) *
      100;
    const lastY = 100 - (lastPoint?.value / maxValue) * 80 || 100;

    return `${linePath} L ${lastX},100 L 0,100 Z`;
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const pointIndex = Math.round((x / 100) * (data.length - 1));
    const clampedIndex = Math.min(Math.max(pointIndex, 0), data.length - 1);

    setHoveredPoint(clampedIndex);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const getCurrentValue = () => {
    if (hoveredPoint !== null) {
      return data[hoveredPoint];
    }
    const progressIndex =
      Math.ceil((data.length * animationProgress) / 100) - 1;
    return data[Math.max(0, progressIndex)];
  };

  const currentData = getCurrentValue();

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        className='w-full h-32'
        viewBox='0 0 100 100'
        preserveAspectRatio='none'
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient
            id='portfolio-gradient'
            x1='0%'
            y1='0%'
            x2='0%'
            y2='100%'
          >
            <stop
              offset='0%'
              stopColor='hsl(var(--accent))'
              stopOpacity='0.3'
            />
            <stop
              offset='100%'
              stopColor='hsl(var(--accent))'
              stopOpacity='0.05'
            />
          </linearGradient>
          <linearGradient id='line-gradient' x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop
              offset='0%'
              stopColor='hsl(var(--accent))'
              stopOpacity='0.8'
            />
            <stop
              offset='100%'
              stopColor='hsl(var(--primary))'
              stopOpacity='0.8'
            />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y, index) => (
          <line
            key={index}
            x1='0'
            y1={y}
            x2='100'
            y2={y}
            stroke='currentColor'
            strokeWidth='0.5'
            className='text-muted-foreground/20'
            strokeDasharray='1,2'
          />
        ))}

        {/* Area under the curve */}
        <path
          d={generateAreaPath(data, animationProgress)}
          fill='url(#portfolio-gradient)'
          className='transition-all duration-1000 ease-out'
        />

        {/* Main line */}
        <path
          d={generatePath(data, animationProgress)}
          fill='none'
          stroke='url(#line-gradient)'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='transition-all duration-1000 ease-out'
          style={{
            strokeDasharray: '1000',
            strokeDashoffset: '1000',
            animation:
              animationProgress === 100
                ? 'drawLine 2s ease-out forwards'
                : 'none',
          }}
        />

        {/* Hover indicator */}
        {hoveredPoint !== null && (
          <g>
            <circle
              cx={(hoveredPoint / (data.length - 1)) * 100}
              cy={100 - (data[hoveredPoint].value / maxValue) * 80}
              r='3'
              fill='hsl(var(--accent))'
              className='animate-pulse'
            />
            <line
              x1={(hoveredPoint / (data.length - 1)) * 100}
              y1='0'
              x2={(hoveredPoint / (data.length - 1)) * 100}
              y2='100'
              stroke='hsl(var(--accent))'
              strokeWidth='1'
              strokeDasharray='2,2'
              opacity='0.5'
            />
          </g>
        )}
      </svg>

      {/* Value display */}
      <div className='absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50'>
        <div className='text-lg font-bold text-accent'>
          ${currentData.value.toFixed(1)}M
        </div>
        <div className='text-xs text-muted-foreground'>
          Year {currentData.year}
        </div>
      </div>

      {/* Animation indicator */}
      {animationProgress < 100 && (
        <div className='absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1 border border-border/50'>
          <div className='flex items-center space-x-2'>
            <div className='w-2 h-2 bg-accent rounded-full animate-pulse' />
            <span className='text-xs text-muted-foreground'>
              Calculating...
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
