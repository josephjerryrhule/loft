"use client";

import React, { useState } from "react";
import { Star, MessageCircle, Sparkles, Flame, Gift, ShieldCheck } from "lucide-react";

interface TestimonialData {
  name: string;
  role: string;
  location: string;
  quote: string;
  rating: number;
  avatarType: "mother-bun" | "father-cap" | "mother-glasses" | "boy" | "girl-braids" | "child-smile" | "teacher-wrap";
  sizeClass: string;
  positionClass: string;
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  badgePosition?: string;
}

// Custom illustrated face vector graphics representing LOFT parents & community members
const AvatarIllustration = ({ type }: { type: string }) => {
  switch (type) {
    case "mother-bun":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full select-none">
          {/* Hair Bun */}
          <circle cx="50" cy="18" r="14" fill="#1C1816" />
          {/* Ear Gold Hoops */}
          <circle cx="24" cy="56" r="6" fill="none" stroke="#FAF5EF" strokeWidth="2.5" />
          <circle cx="76" cy="56" r="6" fill="none" stroke="#FAF5EF" strokeWidth="2.5" />
          {/* Face */}
          <circle cx="50" cy="54" r="28" fill="#C68A6C" stroke="#302824" strokeWidth="3" />
          {/* Hair line */}
          <path d="M22 52 C28 36, 72 36, 78 52 C70 34, 30 34, 22 52 Z" fill="#1C1816" stroke="#302824" strokeWidth="1.5" />
          {/* Eyes */}
          <path d="M38 52 C40 50, 44 50, 46 52" stroke="#302824" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M54 52 C56 50, 60 50, 62 52" stroke="#302824" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Blush */}
          <circle cx="32" cy="58" r="4" fill="#E87154" opacity="0.3" />
          <circle cx="68" cy="58" r="4" fill="#E87154" opacity="0.3" />
          {/* Smile */}
          <path d="M44 62 C46 65, 54 65, 56 62" stroke="#302824" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "father-cap":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full select-none">
          {/* Face */}
          <circle cx="50" cy="54" r="28" fill="#9C6044" stroke="#302824" strokeWidth="3" />
          {/* Cap */}
          <path d="M22 44 C26 26, 74 26, 78 44 Z" fill="#E87154" stroke="#302824" strokeWidth="3" />
          <path d="M26 44 L74 44 C82 44, 82 38, 70 38 L30 38 C18 38, 18 44, 26 44 Z" fill="#FAF5EF" stroke="#302824" strokeWidth="2.5" />
          {/* Eyes */}
          <circle cx="38" cy="54" r="2.5" fill="#302824" />
          <circle cx="62" cy="54" r="2.5" fill="#302824" />
          {/* Beard lines */}
          <path d="M28 62 C34 78, 66 78, 72 62" stroke="#302824" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Smile */}
          <path d="M44 62 C47 66, 53 66, 56 62" stroke="#302824" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "mother-glasses":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full select-none">
          {/* Curly Hair background */}
          <circle cx="34" cy="40" r="14" fill="#2E2420" />
          <circle cx="66" cy="40" r="14" fill="#2E2420" />
          <circle cx="50" cy="30" r="16" fill="#2E2420" />
          {/* Face */}
          <circle cx="50" cy="54" r="28" fill="#B6795B" stroke="#302824" strokeWidth="3" />
          {/* Hair front details */}
          <path d="M22 50 C26 34, 74 34, 78 50" stroke="#302824" strokeWidth="3" fill="none" />
          {/* Glasses */}
          <rect x="30" y="46" width="16" height="10" rx="3" fill="none" stroke="#302824" strokeWidth="3" />
          <rect x="54" y="46" width="16" height="10" rx="3" fill="none" stroke="#302824" strokeWidth="3" />
          <line x1="46" y1="51" x2="54" y2="51" stroke="#302824" strokeWidth="3" />
          {/* Smile */}
          <path d="M44 64 C47 67, 53 67, 56 64" stroke="#302824" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "boy":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full select-none">
          {/* Hair spikes */}
          <path d="M28 36 L34 22 L42 26 L50 18 L58 26 L66 22 L72 36 Z" fill="#1C1816" stroke="#302824" strokeWidth="2.5" />
          {/* Face */}
          <circle cx="50" cy="54" r="28" fill="#A86E50" stroke="#302824" strokeWidth="3" />
          {/* Eyes */}
          <circle cx="38" cy="52" r="2.5" fill="#302824" />
          <circle cx="62" cy="52" r="2.5" fill="#302824" />
          {/* Smile */}
          <path d="M42 62 Q50 70 58 62" stroke="#302824" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "girl-braids":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full select-none">
          {/* Braids (left & right sides) */}
          <path d="M20 40 L16 70 L24 72 L20 40 Z" fill="#1C1816" stroke="#302824" strokeWidth="2" />
          <path d="M80 40 L84 70 L76 72 L80 40 Z" fill="#1C1816" stroke="#302824" strokeWidth="2" />
          {/* Beads */}
          <circle cx="20" cy="74" r="3.5" fill="#E87154" />
          <circle cx="80" cy="74" r="3.5" fill="#E87154" />
          {/* Face */}
          <circle cx="50" cy="50" r="26" fill="#B87F61" stroke="#302824" strokeWidth="3" />
          {/* Hair line */}
          <path d="M24 44 Q50 36 76 44" stroke="#302824" strokeWidth="3" fill="none" />
          {/* Eyes */}
          <circle cx="40" cy="48" r="2.5" fill="#302824" />
          <circle cx="60" cy="48" r="2.5" fill="#302824" />
          {/* Smile */}
          <path d="M43 58 Q50 64 57 58" stroke="#302824" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "child-smile":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full select-none">
          {/* Face */}
          <circle cx="50" cy="50" r="28" fill="#C28A6B" stroke="#302824" strokeWidth="3" />
          {/* Curly hair blobs on top */}
          <circle cx="34" cy="24" r="8" fill="#1C1816" />
          <circle cx="50" cy="22" r="9" fill="#1C1816" />
          <circle cx="66" cy="24" r="8" fill="#1C1816" />
          {/* Laughing Eyes */}
          <path d="M36 46 C38 48, 42 48, 44 46" stroke="#302824" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M56 46 C58 48, 62 48, 64 46" stroke="#302824" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Cheek lines */}
          <circle cx="30" cy="52" r="3.5" fill="#E87154" opacity="0.4" />
          <circle cx="70" cy="52" r="3.5" fill="#E87154" opacity="0.4" />
          {/* Big happy mouth */}
          <path d="M40 56 Q50 66 60 56 Z" fill="#302824" />
        </svg>
      );
    case "teacher-wrap":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full select-none">
          {/* Headwrap */}
          <path d="M22 36 Q50 14 78 36 Z" fill="#E87154" stroke="#302824" strokeWidth="3" />
          {/* Wrap stripes */}
          <path d="M30 32 Q50 20 70 32" stroke="#F4C491" strokeWidth="4.5" fill="none" />
          {/* Face */}
          <circle cx="50" cy="56" r="28" fill="#90553B" stroke="#302824" strokeWidth="3" />
          {/* Eyes */}
          <path d="M38 54 C40 52, 44 52, 46 54" stroke="#302824" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M54 54 C56 52, 60 52, 62 54" stroke="#302824" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Golden nose ring */}
          <circle cx="50" cy="62" r="2.5" fill="none" stroke="#F4C491" strokeWidth="1.5" />
          {/* Gentle Smile */}
          <path d="M43 66 C46 70, 54 70, 57 66" stroke="#302824" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );
    default:
      return null;
  }
};

export default function Testimonials() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const testimonials: TestimonialData[] = [
    {
      name: "Abena Mensah",
      role: "Parent of 5-year-old reader",
      location: "Accra",
      quote: "My daughter Ama used to spend hours watching cartoons. Since starting LOFT, she asks to increase her reading streak every single day! Seeing herself in characters did wonders for her confidence.",
      rating: 5,
      avatarType: "mother-bun",
      sizeClass: "w-20 h-20 md:w-26 md:h-26",
      positionClass: "left-[12%] sm:left-[16%] top-[6%]",
      badgeText: "Ama's Streak: 12 days",
      badgeIcon: <Flame className="w-3.5 h-3.5 text-brand-coral fill-brand-coral" />,
      badgePosition: "-left-12 top-24"
    },
    {
      name: "Kofi Owusu",
      role: "LOFT Team Leader & Promoter",
      location: "Kumasi",
      quote: "As an ambassador, introducing LOFT to local schools has been incredibly rewarding. Parents immediately trust the cultural orientation, and the weekly MoMo commission structure is excellent.",
      rating: 5,
      avatarType: "father-cap",
      sizeClass: "w-24 h-24 md:w-28 md:h-28",
      positionClass: "left-[41%] sm:left-[43%] top-[12%]",
      badgeText: "MTN MoMo active",
      badgeIcon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
      badgePosition: "left-20 -top-8"
    },
    {
      name: "Efua Baffour",
      role: "Parent of 8 & 10-year-olds",
      location: "Tema",
      quote: "The personalized birthday books are outstanding. The look on Kojo's face when he saw his own name on the cover of a Ghanaian adventure story was priceless. It's now his favorite bedtime book.",
      rating: 5,
      avatarType: "mother-glasses",
      sizeClass: "w-20 h-20 md:w-26 md:h-26",
      positionClass: "right-[12%] sm:right-[16%] top-[6%]",
      badgeText: "Customized cover",
      badgeIcon: <Gift className="w-3.5 h-3.5 text-brand-coral" />,
      badgePosition: "-right-6 top-24"
    },
    {
      name: "Kwame Owusu",
      role: "LOFT Promoter",
      location: "Koforidua",
      quote: "Weekly mobile money transfers are so convenient. The supervisor override commissions show direct rewards for coordinating local literacy programs.",
      rating: 5,
      avatarType: "boy",
      sizeClass: "w-16 h-16 md:w-20 md:h-20",
      positionClass: "left-[28%] sm:left-[30%] top-[48%]",
      badgeText: "Earnings: GHS 780"
    },
    {
      name: "Ama Darko",
      role: "Community Affiliate",
      location: "Tamale",
      quote: "Sharing the printable worksheets customized with child names has helped parents in Tamale run home tutoring circles easily. Literacy interest is growing step-by-step.",
      rating: 5,
      avatarType: "girl-braids",
      sizeClass: "w-16 h-16 md:w-20 md:h-20",
      positionClass: "right-[28%] sm:right-[30%] top-[48%]"
    },
    {
      name: "Kojo Mensah",
      role: "LOFT Student Explorer",
      location: "Ho",
      quote: "I love reading wiggling flipbooks! I unlocked the 7-day Streak achievement flame and got my own Bookworm badge shelf.",
      rating: 5,
      avatarType: "child-smile",
      sizeClass: "w-14 h-14 md:w-18 md:h-18",
      positionClass: "left-[2%] sm:left-[3%] top-[34%]"
    },
    {
      name: "Adwoa Boateng",
      role: "Primary School Teacher",
      location: "Sunyani",
      quote: "LOFT stories represent our culture beautifully. Children seeing their names and backgrounds in books inspires real engagement. It's a wonderful tool for modern classrooms.",
      rating: 5,
      avatarType: "teacher-wrap",
      sizeClass: "w-14 h-14 md:w-18 md:h-18",
      positionClass: "right-[2%] sm:right-[3%] top-[34%]"
    }
  ];

  return (
    <section id="testimonials" className="w-full py-20 bg-brand-cream/30 border-b border-brand-coral/5 overflow-hidden">
      <div className="mx-auto max-w-7xl min-[1700px]:max-w-[100rem] px-6">
        
        <style>{`
          @keyframes float-badge {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
          .animate-float-badge {
            animation: float-badge 5s ease-in-out infinite;
          }
          .animate-float-badge-delayed {
            animation: float-badge 5s ease-in-out infinite;
            animation-delay: 1.5s;
          }
        `}</style>

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-brand-coral bg-brand-coral/5 border border-brand-coral/10">
            <MessageCircle className="w-3.5 h-3.5" />
            Voices of Trust
          </span>
          <h2 className="text-3xl sm:text-4xl text-text-dark font-quicksand font-bold">
            Joyful Moments With LOFT
          </h2>
          <p className="text-base sm:text-lg text-text-muted font-medium">
            Hear from parents, teachers, and ambassadors who are transforming screen time into literacy milestones.
          </p>
        </div>

        {/* Testimonials Scattered Cloud Container */}
        <div className="relative mx-auto max-w-5xl w-full h-[380px] sm:h-[460px] md:h-[480px] my-10 overflow-visible">
          
          {testimonials.map((t, idx) => {
            const isHovered = hoveredIdx === idx;
            
            return (
              <div
                key={idx}
                className={`absolute transition-all duration-300 ${t.positionClass} z-10`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                
                {/* Profile Avatar Trigger Button */}
                <div
                  className={`rounded-full border-[3px] border-[#302824] bg-white p-0.5 cursor-pointer shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-110 relative ${t.sizeClass}`}
                >
                  <AvatarIllustration type={t.avatarType} />
                  
                  {/* Miniature checkmark seal on profiles */}
                  <span className="absolute bottom-0 right-0 w-4 h-4 md:w-5 md:h-5 rounded-full bg-brand-green border-[2px] border-[#302824] flex items-center justify-center text-[7px] md:text-[8px] font-black text-text-dark shadow-sm">
                    +
                  </span>
                </div>

                {/* Testimonial Quote Bubble Popup */}
                <div
                  className={`absolute -top-40 left-1/2 -translate-x-1/2 w-60 sm:w-64 p-4 rounded-2xl bg-[#302824] text-white shadow-xl pointer-events-none transition-all duration-300 z-50 border border-[#FAF5EF]/15 ${
                    isHovered
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                  }`}
                >
                  {/* Rating Stars */}
                  <div className="flex gap-1 mb-2">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400 stroke-none" />
                    ))}
                  </div>

                  {/* Quote Text */}
                  <p className="text-[10px] sm:text-xs italic font-medium leading-relaxed mb-3 text-[#FAF5EF] opacity-90">
                    "{t.quote}"
                  </p>

                  {/* Author Meta */}
                  <div className="border-t border-[#FAF5EF]/10 pt-2 flex flex-col">
                    <span className="text-[9px] font-black uppercase text-brand-coral tracking-wider">
                      {t.name}
                    </span>
                    <span className="text-[8px] font-bold text-[#FAF5EF] opacity-60 mt-0.5">
                      {t.role} &bull; {t.location}
                    </span>
                  </div>

                  {/* Downward Speech Bubble Arrow */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#302824] rotate-45 border-r border-b border-[#FAF5EF]/15" />
                </div>

                {/* Floating Tags next to some avatars */}
                {t.badgeText && (
                  <div
                    className={`absolute hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#302824]/10 text-[9px] font-black text-text-dark whitespace-nowrap shadow-sm select-none ${t.badgePosition} ${
                      idx % 2 === 0 ? "animate-float-badge" : "animate-float-badge-delayed"
                    }`}
                  >
                    {t.badgeIcon}
                    {t.badgeText}
                  </div>
                )}

              </div>
            );
          })}

          {/* Stool decoration vector lines inside cloud space for Ghana accent (back layer) */}
          <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-[0.03] select-none pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-96 h-96 stroke-current text-text-dark" strokeWidth="2" fill="none">
              <path d="M20 70 C30 50, 70 50, 80 70 M50 20 L50 70 M30 50 L70 50" />
            </svg>
          </div>

        </div>

        {/* Hover Hint text */}
        <div className="text-center pt-2 select-none">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted">
            <Sparkles className="w-3.5 h-3.5 text-brand-coral" />
            Hover over any face in the cloud above to read their story
          </span>
        </div>

      </div>
    </section>
  );
}
