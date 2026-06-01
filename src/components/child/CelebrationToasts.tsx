"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Flame, Trophy, Award } from "lucide-react";

interface CelebrationToastsProps {
  stats: {
    totalBooksRead: number;
    readingStreak: number;
  } | null;
}

export function CelebrationToasts({ stats }: CelebrationToastsProps) {
  useEffect(() => {
    if (!stats) return;

    // Toast for streak active
    if (stats.readingStreak > 0) {
      toast("Reading Streak Active!", {
        description: "You’re doing amazing! Keep your reading streak alive.",
        icon: <Flame className="h-5 w-5 text-amber-500 fill-amber-500" />,
        duration: 6000,
      });
    }

    // Toast for streak unlocked (7 days)
    if (stats.readingStreak >= 7) {
      toast("7-Day Streak Unlocked!", {
        description: "Streak unlocked! You’ve read for 7 days in a row.",
        icon: <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />,
        duration: 8000,
      });
    }

    // Toast for first book completed
    if (stats.totalBooksRead === 1) {
      toast("First Book Completed!", {
        description: "Amazing work! You completed your first book.",
        icon: <Trophy className="h-5 w-5 text-[#E87154]" />,
        duration: 8000,
      });
    }

    // Toast for milestone unlocked (5+ books)
    if (stats.totalBooksRead >= 5) {
      toast("Achievement Unlocked!", {
        description: "Achievement unlocked! You earned a new reading badge. You’re becoming a reading superstar.",
        icon: <Award className="h-5 w-5 text-indigo-500" />,
        duration: 8000,
      });
    }
  }, [stats]);

  return null;
}
