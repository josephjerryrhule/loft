"use client";

import React, { useEffect, useState } from 'react';

interface AnimatedElement {
  id: number;
  top?: string;
  left?: string;
  bottom?: string;
  size: string;
  delay: string;
  duration: string;
  color?: string;
}

export function DashboardAnimations() {
  const [mounted, setMounted] = useState(false);
  const [stars, setStars] = useState<AnimatedElement[]>([]);
  const [bubbles, setBubbles] = useState<AnimatedElement[]>([]);

  useEffect(() => {
    setMounted(true);
    
    // Generate random stars/twinkles
    const newStars = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 6 + 2}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 3 + 2}s`
    }));
    setStars(newStars);

    // Generate random bubbles with subtle colors
    const colors = ['#E87154', '#FFD93D', '#6BCB77', '#4D96FF'];
    const newBubbles = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 120 + 60}px`,
      delay: `${Math.random() * 10}s`,
      duration: `${Math.random() * 20 + 20}s`,
      color: colors[i % colors.length]
    }));
    setBubbles(newBubbles);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#E87154]/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-[#FFD93D]/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Floating Clouds with subtle color */}
      <div className="absolute top-[10%] opacity-40 animate-[float-x_60s_linear_infinite]">
        <svg width="200" height="120" viewBox="0 0 200 120" fill="#FFEFEA">
          <circle cx="50" cy="70" r="50" />
          <circle cx="100" cy="50" r="60" />
          <circle cx="150" cy="70" r="50" />
        </svg>
      </div>

      <div className="absolute top-[50%] opacity-30 animate-[float-x_90s_linear_infinite] [animation-delay:-15s]">
        <svg width="280" height="160" viewBox="0 0 280 160" fill="#FFF9E5">
          <circle cx="70" cy="90" r="70" />
          <circle cx="140" cy="70" r="80" />
          <circle cx="210" cy="90" r="70" />
        </svg>
      </div>

      {/* Twinkling Stars */}
      {stars.map((star) => (
        <div 
          key={`star-${star.id}`}
          className="absolute bg-white rounded-full animate-[twinkle_3s_ease-in-out_infinite] shadow-[0_0_10px_white]"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration
          }}
        />
      ))}

      {/* Soft Floating Bubbles */}
      {bubbles.map((bubble) => (
        <div 
          key={`bubble-${bubble.id}`}
          className="absolute rounded-full opacity-[0.08] animate-[float-up_30s_linear_infinite]"
          style={{
            left: bubble.left,
            width: bubble.size,
            height: bubble.size,
            backgroundColor: bubble.color,
            animationDelay: bubble.delay,
            animationDuration: bubble.duration
          }}
        />
      ))}

      {/* Floating Emojis */}
      <div className="absolute inset-0">
        <div className="floating-emoji top-[15%] left-[15%] text-4xl opacity-20">✨</div>
        <div className="floating-emoji top-[40%] right-[10%] text-5xl opacity-15" style={{ animationDelay: '2s' }}>🎨</div>
        <div className="floating-emoji bottom-[25%] left-[10%] text-4xl opacity-15" style={{ animationDelay: '4s' }}>🚀</div>
        <div className="floating-emoji bottom-[15%] right-[20%] text-4xl opacity-20" style={{ animationDelay: '1s' }}>⭐</div>
      </div>

      <style jsx global>{`
        @keyframes float-x {
          0% { transform: translateX(-300px); }
          100% { transform: translateX(calc(100vw + 300px)); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes float-up {
          0% { transform: translateY(110vh) scale(1); opacity: 0; }
          10% { opacity: 0.1; }
          90% { opacity: 0.1; }
          100% { transform: translateY(-20vh) scale(1.5); opacity: 0; }
        }
        .floating-emoji {
          position: absolute;
          animation: float-y 8s ease-in-out infinite;
        }
        @keyframes float-y {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-40px) rotate(15deg); }
        }
      `}</style>
    </div>
  );
}
