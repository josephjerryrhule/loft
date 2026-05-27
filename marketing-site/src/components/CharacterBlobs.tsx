import React from "react";

// Cute closed eyes and smile face SVG elements - warm ebony outlines
const Face = () => (
  <g>
    {/* Left Eye (closed, curved line) */}
    <path
      d="M28 32 C30 30, 34 30, 36 32"
      stroke="#302824"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Right Eye (closed, curved line) */}
    <path
      d="M48 32 C50 30, 54 30, 56 32"
      stroke="#302824"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Happy Smile */}
    <path
      d="M38 39 C40 42, 44 42, 46 39"
      stroke="#302824"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </g>
);

// Little Lofter (Green Blob - Ages 0-3): Sensory & shapes, holding a small magnifying glass
export const GreenBlob = ({ className = "w-32 h-32" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} animate-[float_4s_ease-in-out_infinite]`}
      style={{ animationDelay: "0.5s" }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1deg); }
        }
      `}</style>
      {/* Cloud-like shape */}
      <path
        d="M25 75 C10 75, 5 55, 15 45 C10 30, 25 15, 45 20 C60 10, 80 20, 85 35 C95 45, 90 70, 75 75 Z"
        fill="var(--color-brand-green)"
        stroke="#302824"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Face />
      {/* Telescopic / Magnifying Glass */}
      <circle
        cx="72"
        cy="52"
        r="10"
        fill="#FFFFFF"
        stroke="#302824"
        strokeWidth="2.5"
      />
      <line
        x1="66"
        y1="59"
        x2="58"
        y2="67"
        stroke="#302824"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Tiny rosy cheeks */}
      <circle cx="26" cy="36" r="3" fill="#E87154" opacity="0.3" />
      <circle cx="58" cy="36" r="3" fill="#E87154" opacity="0.3" />
    </svg>
  );
};

// LOFT 365 (Purple Blob - Ages 4-7): Early reading, wearing a small baseball cap
export const PurpleBlob = ({ className = "w-32 h-32" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} animate-[float-purple_5s_ease-in-out_infinite]`}
    >
      <style>{`
        @keyframes float-purple {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-1.5deg); }
        }
      `}</style>
      {/* Crown-like blob shape */}
      <path
        d="M20 75 C12 70, 10 50, 20 40 C15 25, 30 22, 35 30 C42 12, 58 12, 65 30 C70 22, 85 25, 80 40 C90 50, 88 70, 80 75 C70 82, 30 82, 20 75 Z"
        fill="var(--color-brand-purple)"
        stroke="#302824"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Cap */}
      <path
        d="M32 24 C32 15, 48 10, 56 16 L65 24 Z"
        fill="var(--color-brand-coral)"
        stroke="#302824"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M54 16 C60 16, 68 20, 72 25"
        stroke="#302824"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Face details */}
      <g>
        <path
          d="M30 42 C32 40, 36 40, 38 42"
          stroke="#302824"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M50 42 C52 40, 56 40, 58 42"
          stroke="#302824"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Surprise open mouth */}
        <ellipse
          cx="44"
          cy="49"
          rx="3"
          ry="4"
          fill="#302824"
        />
      </g>
      
      {/* Small Key representing unlocking reading worlds */}
      <path
        d="M75 52 L62 56 L64 62 L60 63 L57 58 L54 59 L55 55"
        stroke="#302824"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        cx="74"
        cy="52"
        r="4"
        fill="#FFFFFF"
        stroke="#302824"
        strokeWidth="2.5"
      />
    </svg>
  );
};

// Big Reader (Orange Blob - Ages 8+): Chapter books, holding explorer compass
export const OrangeBlob = ({ className = "w-32 h-32" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} animate-[float-orange_4.5s_ease-in-out_infinite]`}
      style={{ animationDelay: "1s" }}
    >
      <style>{`
        @keyframes float-orange {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
        }
      `}</style>
      {/* Bean/Curved shape */}
      <path
        d="M15 65 C10 45, 20 20, 45 20 C60 20, 85 25, 85 45 C85 65, 75 75, 60 75 C45 75, 30 75, 15 65 Z"
        fill="var(--color-brand-orange)"
        stroke="#302824"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Friendly winking face */}
      <g>
        {/* Left eye: Wink (horizontal dash) */}
        <line
          x1="32"
          y1="36"
          x2="40"
          y2="36"
          stroke="#302824"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Right eye: Open curve */}
        <path
          d="M52 35 C54 33, 58 33, 60 35"
          stroke="#302824"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="56" cy="37" r="2" fill="#302824" />
        {/* Cute smile */}
        <path
          d="M40 45 C43 48, 49 48, 52 45"
          stroke="#302824"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      
      {/* Compass / Book symbol in hand */}
      <circle
        cx="72"
        cy="58"
        r="7"
        fill="#FFFFFF"
        stroke="#302824"
        strokeWidth="2.5"
      />
      {/* Compass needle */}
      <line
        x1="72"
        y1="54"
        x2="72"
        y2="62"
        stroke="var(--color-brand-coral)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="68"
        y1="58"
        x2="76"
        y2="58"
        stroke="var(--color-brand-coral)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

// Brand Star (Orange-Coral Star - Logo matching element)
export const CoralBlob = ({ className = "w-32 h-32" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} animate-[float-coral_6s_ease-in-out_infinite]`}
      style={{ animationDelay: "1.5s" }}
    >
      <style>{`
        @keyframes float-coral {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-7px) scale(1.03); }
        }
      `}</style>
      {/* Playful starfish/star shape */}
      <path
        d="M50 15 C52 28, 55 35, 68 35 C80 35, 82 45, 72 52 C82 68, 70 75, 58 68 C50 78, 38 72, 35 60 C22 68, 15 58, 25 50 C15 38, 25 32, 35 35 C42 32, 45 22, 50 15 Z"
        fill="var(--color-brand-coral)"
        stroke="#302824"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Cute sleeping face */}
      <g>
        <path
          d="M36 44 C38 46, 42 46, 44 44"
          stroke="#302824"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M54 44 C56 46, 60 46, 62 44"
          stroke="#302824"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M47 50 C48 51, 50 51, 51 50"
          stroke="#302824"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
};
