'use client';
import React, { useState, useRef } from 'react';

export default function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    
    // Relative coordinates from center
    const rx = x - box.width / 2;
    const ry = y - box.height / 2;
    
    // Calculate rotation angles (max 10 degrees for 3D tilt)
    const rotateX = -(ry / (box.height / 2)) * 10;
    const rotateY = (rx / (box.width / 2)) * 10;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`);
    setSpotlightPos({ x, y });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s ease',
        transformStyle: 'preserve-3d',
      }}
      className={`relative rounded-[28px] overflow-hidden border transition-all duration-300 ${className}`}
    >
      {/* 3D Reflection overlay */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay opacity-60 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 250px at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(255,255,255,0.75), transparent 80%)`
          }}
        />
      )}
      
      {/* 3D Border Highlight overlay */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 opacity-40 transition-opacity duration-300 border border-orange-500/20 rounded-[28px]"
          style={{
            background: `radial-gradient(circle 180px at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(251,191,36,0.45), transparent 70%)`
          }}
        />
      )}

      {children}
    </div>
  );
}
