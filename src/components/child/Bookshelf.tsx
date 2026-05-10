"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flipbook } from "@prisma/client";
import { ChevronRight } from "lucide-react";

interface BookshelfProps {
  flipbooks: Flipbook[];
}

export function Bookshelf({ flipbooks }: BookshelfProps) {
  // Group flipbooks by category
  const groupedFlipbooks = useMemo(() => {
    const groups: Record<string, Flipbook[]> = {};
    flipbooks.forEach((book) => {
      const category = book.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(book);
    });
    return groups;
  }, [flipbooks]);

  // Helper to chunk books into rows (e.g., rows of 5 for desktop)
  const chunkArray = (arr: Flipbook[], size: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  if (flipbooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[40px] border border-[#E87154]/10 shadow-[0_10px_40px_rgba(232,113,84,0.05)]">
        <div className="w-32 h-32 bg-[#E87154]/5 rounded-full flex items-center justify-center mb-8">
           <span className="text-6xl">📖</span>
        </div>
        <h2 className="text-3xl font-black text-[#2D2D2D] mb-3 font-quicksand">Your bookshelf is empty!</h2>
        <p className="text-[#6D6D6D] max-w-md font-medium text-lg leading-relaxed">
          Ask your parent to add some magical books for you to start your adventure!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-32">
      {Object.entries(groupedFlipbooks).map(([category, books]) => (
        <div key={category} className="space-y-12">
          {/* Category Header */}
          <div className="flex items-end justify-between px-2">
            <div className="space-y-1">
              <span className="text-xs font-black text-[#E87154] uppercase tracking-[0.3em] font-quicksand">Collection</span>
              <h2 className="text-4xl font-black text-[#2D2D2D] font-quicksand tracking-tight">
                {category}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[#BBBBBB] font-black text-sm uppercase tracking-widest hover:text-[#E87154] transition-colors cursor-pointer group">
              View All <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Rows of Books with Shelves */}
          <div className="space-y-24">
            {chunkArray(books, 5).map((row, rowIndex) => (
              <div key={rowIndex} className="relative pb-16">
                {/* Wooden Shelf Graphic */}
                <div className="absolute bottom-[64px] left-[-40px] right-[-40px] h-12 z-0">
                  {/* The actual shelf plank */}
                  <div className="absolute bottom-0 w-full h-8 bg-gradient-to-b from-[#D4A373] to-[#A98467] rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.2)] border-b-4 border-[#8B6B50]">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                  </div>
                  {/* Decorative shelf thickness/front */}
                  <div className="absolute bottom-[-4px] left-0 right-0 h-4 bg-[#8B6B50]/30 blur-sm rounded-full -z-10"></div>
                </div>

                {/* Books Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 relative z-10">
                  {row.map((book) => (
                    <Link
                      key={book.id}
                      href={`/child/flipbooks/${book.id}`}
                      className="group flex flex-col items-center"
                    >
                      {/* Book Object */}
                      <div className="relative w-full aspect-[3/4] perspective-1000 mb-4">
                        <div className="relative w-full h-full rounded-r-xl overflow-hidden bg-white shadow-[0_15px_35px_rgba(0,0,0,0.1)] group-hover:shadow-[0_25px_55px_rgba(232,113,84,0.25)] group-hover:-rotate-y-12 transition-all duration-500 origin-left border border-[#F0F0F0] group-hover:border-[#E87154]/20">
                          {book.coverImageUrl ? (
                            <Image
                              src={book.coverImageUrl}
                              alt={book.title}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#E87154]/10 to-[#E87154]/5 p-6 text-center">
                              <span className="text-[#E87154] font-black text-xl font-quicksand leading-tight">
                                {book.title}
                              </span>
                            </div>
                          )}
                          
                          <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-black/20 via-black/5 to-transparent border-r border-white/10"></div>
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                      </div>
                      
                      {/* Book Info */}
                      <div className="space-y-2 text-center max-w-[180px] min-h-[80px]">
                        <h3 className="text-lg font-black text-[#2D2D2D] font-quicksand leading-tight group-hover:text-[#E87154] transition-colors line-clamp-2">
                          {book.title}
                        </h3>
                        <div className="flex items-center justify-center">
                          <span className="text-[10px] font-black text-[#E87154] uppercase tracking-[0.2em] bg-[#E87154]/5 px-3 py-1 rounded-full border border-[#E87154]/10 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            Read Now
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .-rotate-y-12 {
          transform: rotateY(-12deg);
        }
      `}</style>
    </div>
  );
}
